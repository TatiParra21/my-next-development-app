import { app, BrowserWindow, safeStorage, shell } from 'electron';
import { Conf } from "electron-conf";
import path from 'path';
import { setSecureToken, getSecureToken, deleteSecureToken, getAccessToken, refreshAccessToken, codeVerifierStore } from "./tokenStore.js";
import { ipcMain, } from "electron";
import axios from "axios";


export interface GoogleAuthResult {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
}

const PROTOCOL_PREFIX = 'mynextdevproject';

// Register protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(
      PROTOCOL_PREFIX,
      process.execPath,
      [path.resolve(process.argv[1])]
    );
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL_PREFIX);
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    // Someone tried to run a second instance, we should focus our window.
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // Handle deep link on Windows
    const url = commandLine.find(arg => arg.startsWith(`${PROTOCOL_PREFIX}://`));
    if (url) handleDeepLink(url);
  });

  // Create window...
  app.on('ready', createWindow);
}

// Global deep link handler function
function handleDeepLink(url: string) {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== `${PROTOCOL_PREFIX}:`) return;

    // Example format: mynextdevproject://auth?code=...
    if (urlObj.hostname === 'auth' || urlObj.pathname.includes('auth')) {
      const params = new URLSearchParams(urlObj.search);
      const code = params.get('code');

      if (code) {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send('google-auth-code', { code });
        }
      }
    }
  } catch (e) {
    console.error('Deep link error', e);
  }
}

// Handle deep link on macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});


function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "../app/index.html")
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};



// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("set-code-verifier", async (_event, codeVerifier: string) => {
  codeVerifierStore.set("code-verifier", codeVerifier)
})
ipcMain.handle("get-code-verifier", async (_event): Promise<string | null> => {
  return codeVerifierStore.get("code-verifier")
})
ipcMain.handle("delete-code-verifier", async (_event) => {
  codeVerifierStore.deleteKey("code-verifier")
})
ipcMain.handle(
  "google-login",
  async (_event, { codeVerifier, codeChallenge }: {
    codeVerifier: string;
    codeChallenge: string;
  }): Promise<void> => {
    try {
      // 1. Get OAuth URL from backend
      console.log("Getting Auth URL...")
      const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
      const res = await axios.get(`${backendUrl}/auth/google`, {
        params: { code_challenge: codeChallenge },
      });
      const authUrl = res.data.authUrl;

      // 2. Open System Browser
      await shell.openExternal(authUrl);

      // 3. Return void (Renderer should wait for event)
      return;

    } catch (err) {
      console.error(err);
      throw err;
    }
  }
);

ipcMain.handle(
  "exchange-google-code",
  async (_event, { code, codeVerifier }: { code: string; codeVerifier: string }) => {
    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
      const res = await axios.post(`${backendUrl}/auth/google/exchange`, {
        code,
        code_verifier: codeVerifier,
      });

      const { access_token, refresh_token } = res.data;

      setSecureToken("google-access-token", access_token);
      if (refresh_token) {
        setSecureToken("google-refresh-token", refresh_token);
      }

      return res.data;
    } catch (err) {
      console.error("Exchange failed", err);
      return null;
    }
  }
);

ipcMain.handle("google-logout", async () => {
  const accessToken = await getAccessToken()
  if (accessToken) {
    // Revoke token on Google
    await axios.post(
      `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
      null,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
  }

  // Delete tokens from Keytar
  deleteSecureToken("google-access-token")
  deleteSecureToken("google-refresh-token")


  return true;
});

ipcMain.handle("is-logged-in", async () => {
  const refreshToken = getSecureToken("google-refresh-token")
  return Boolean(refreshToken);
});

ipcMain.handle("get-access-token", async () => {
  let accessToken = await getAccessToken();

  if (!accessToken) {
    accessToken = await refreshAccessToken();
  }

  return accessToken;
});
export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale?: string;
}
ipcMain.handle("fetch-google-profile", async (): Promise<GoogleUserProfile | null> => {
  const accessToken = await getAccessToken()
  if (!accessToken) return null;

  try {
    const res = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return res.data;
  } catch (err) {
    console.error(err);
    return null;
  }
});

