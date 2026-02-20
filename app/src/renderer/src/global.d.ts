export { };

declare global {
  interface Window {
    electron: {
      openExternal: (url: string) => void;
      startGoogleLogin: () => Promise<void>;
      onAuthToken: (callback: (url: string) => void) => void;
    };
    secureAuth: {
      saveToken: (token: string) => Promise<void>;
      getToken: () => Promise<string | null>;
      clearToken: () => Promise<void>;
    };

    authAPI: {
      oauthGoogle: () => Promise<{ success: boolean; url?: string; message?: string }>;
    };
  }
}

declare global {
  interface Window {
    api: {
      startGoogleLogin: (
        codeVerifier: string,
        codeChallenge: string
      ) => Promise<void>;
      GoogleAuthResult: {
        access_token: string;
        refresh_token: string;
        expires_in?: number;
        token_type?: string;
      }
      logout: () => Promise<boolean>;
      isLoggedIn: () => Promise<boolean>;
      getAccessToken: () => Promise<string>;
      getProfile: () => Promise<GoogleUserProfile | null>;
      onGoogleAuthCode: (callback: (code: string) => void) => void;
      exchangeGoogleCode: (code: string, codeVerifier: string) => Promise<GoogleAuthResult | null>;
      setCodeVerifier: (codeVerifier: string) => Promise<void>;
      getCodeVerifier: () => Promise<string | null>;
      deleteCodeVerifier: () => Promise<void>;
    };
  }
}