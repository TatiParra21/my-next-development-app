import axios from "axios";
import {  safeStorage, } from 'electron';
import { Conf } from "electron-conf";
const store = new Conf<Record<string, string>>({
  name: "secure-tokens",
});
export const setSecureToken=(key:string, value:string):void =>{
  if (safeStorage.isEncryptionAvailable()) {
    const buffer = safeStorage.encryptString(value);
    // Store the buffer as a latin1 string in the JSON file
    store.set(key, buffer.toString('latin1'));
  } else {
    // Handle the case where encryption is unavailable
    console.log("encryption not available");
  }
}
export function getSecureToken (key: string): string | null {
  const encryptedValue = store.get(key);
   if (!encryptedValue) return null;
  return safeStorage.decryptString(
    Buffer.from(encryptedValue, "latin1")
  );
}
export const deleteSecureToken =(key:string):void=>{
  store.delete(key)
}
export async function refreshAccessToken():Promise<string| null> {
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