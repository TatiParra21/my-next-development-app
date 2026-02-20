import axios from "axios";
import { safeStorage, } from 'electron';
import { Conf } from "electron-conf";
const store = new Conf<Record<string, string>>({
  name: "secure-tokens",
});
const codeVerifier = new Conf<Record<string, string>>({
  name: "code-verifier",
});

const setConfStore = (store: Conf<Record<string, string>>) => {
  const set = (key: string, value: string) => {
    if (safeStorage.isEncryptionAvailable()) {
      const buffer = safeStorage.encryptString(value);
      // Store the buffer as a latin1 string in the JSON file
      store.set(key, buffer.toString('latin1'));
    } else {
      // Handle the case where encryption is unavailable
      console.log("encryption not available");
      return;
    }
  }
  const get = (key: string): string | null => {
    const encryptedValue = store.get(key);
    if (!encryptedValue) return null;
    return safeStorage.decryptString(
      Buffer.from(encryptedValue, "latin1")
    );

  }
  const deleteKey = (key: string): void => {
    store.delete(key)
  }
  return { set, get, deleteKey }
}
export const secureTokenStore = setConfStore(store)
export const codeVerifierStore = setConfStore(codeVerifier)
export const setSecureToken = (key: string, value: string): void => {
  secureTokenStore.set(key, value)
}
export function getSecureToken(key: string): string | null {
  return secureTokenStore.get(key)
}
export const deleteSecureToken = (key: string): void => {
  secureTokenStore.deleteKey(key)
}
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getSecureToken("google-refresh-token");
  if (!refreshToken) throw new Error("No refresh token available");

  const res = await axios.get("http://localhost:4000//refresh-token", {
    params: { refresh_token: refreshToken },
  });

  const newAccessToken = res.data.access_token;
  // Save the new access token
  setSecureToken("google-access-token", newAccessToken);
  return newAccessToken;
}

export async function getAccessToken(): Promise<string | null> {
  return getSecureToken("google-access-token")
}