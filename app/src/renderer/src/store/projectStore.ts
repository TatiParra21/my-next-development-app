import { create } from "zustand"
import type { ProjectType } from "@renderer/types"
import { fetchRequest } from "@renderer/functions/requests";

export type ProjectDataStoreType = {
  projects: ProjectType[],
  setProjects: (projects: ProjectType[] | []) => void,
  loading: boolean,
  setLoading: (value: boolean) => void,
  openedProject: ProjectType | null,
  setOpenedProject: (project: ProjectType | null) => void
  updateProjects: () => Promise<void>
}
export const projectDataStore = create<ProjectDataStoreType>((set) => ({
  projects: [], //starting,
  setProjects: (projects: ProjectType[]) => set({ projects: projects }),
  loading: true,
  setLoading: (value: boolean) => set({ loading: value }),
  openedProject: null,
  setOpenedProject: (openedProject: ProjectType | null) => set({ openedProject: openedProject }),
  updateProjects: async () => {
    const userId = googleAuthStore.getState().user?.id
    console.log("user ID", userId)
    if (userId) {
      const projects: ProjectType[] = await fetchRequest(userId)
      projectDataStore.setState({ projects: projects })
    }
  }
}))

export const selectProjects = (state: ProjectDataStoreType): ProjectType[] | [] => state.projects
export const selectSetProjects = (state: ProjectDataStoreType): (projects: ProjectType[]) => void => state.setProjects
export const selectLoading = (state: ProjectDataStoreType): boolean => state.loading
export const selectSetLoading = (state: ProjectDataStoreType): (value: boolean) => void => state.setLoading
export const selectUpdateProjects = (state: ProjectDataStoreType): () => Promise<void> => state.updateProjects

export type FormStoreType = {
  isNotActive: boolean,
  setIsNotActive: (value: boolean) => void
}
export const formStore = create<FormStoreType>((set) => ({
  isNotActive: true,
  setIsNotActive: (value: boolean) => set({ isNotActive: value })
}))

export const selectIsNotActive = (state: FormStoreType): boolean => state.isNotActive
export const selectSetIsNotActive = (state: FormStoreType): (value: boolean) => void => state.setIsNotActive
import { generatePKCEPair } from "@renderer/functions/generatePKCEPair";
//import axios from "axios";

type GoogleUser = {
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
};
export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture: string;
  locale?: string;
}
type GoogleAuthStoreType = {
  user: GoogleUser | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>,
  //handleRedirect: (url:string)=>Promise<void>;
  initAuth: () => Promise<void>; // ✅ added
  processGoogleCode: (code: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const googleAuthStore = create<GoogleAuthStoreType>((set) => ({
  user: null,
  loading: true, // start as loading until we check localStorage
  authError: null,
  // 🔹 Opens browser for Google sign-in (via backend)
  // 🔹 Runs once on app start — restores saved token if present

  signInWithGoogle: async (): Promise<void> => {
    const { codeVerifier, codeChallenge } = await generatePKCEPair();
    // Save verifier for the callback
    await window.api.setCodeVerifier(codeVerifier);

    await window.api.startGoogleLogin(
      codeVerifier,
      codeChallenge
    );

  },

  processGoogleCode: async (code: string): Promise<void> => {
    const codeVerifier: string | null = await window.api.getCodeVerifier();
    if (!codeVerifier) {
      console.error("No code verifier found!");
      return;
    }

    set({ loading: true });
    const result = await window.api.exchangeGoogleCode(code, codeVerifier);

    if (result?.access_token) {
      await window.api.deleteCodeVerifier(); // Clean up
      googleAuthStore.getState().initAuth();
    } else {
      set({ loading: false, authError: "Exchange failed" });
    }
  },
  initAuth: async () => {
    set({ loading: true });
    console.log("it ran")

    try {
      const profile = await window.api.getProfile();
      console.log(profile, "there is prr")
      if (!profile) {
        set({ user: null, loading: false });
        return;
      }
      set({
        user: {
          email: profile.email,
          id: profile.id,
          name: profile.name,
          picture: profile.picture,
        },
        loading: false,
      });
      await projectDataStore.getState().updateProjects();
    } catch {
      // await window.secureAuth.clearToken();
      set({ user: null, loading: false });
    }
  },

  // 🔹 Log out completely
  logout: async () => {

    await window.api.logout()
    set({ user: null });
    projectDataStore.setState({ projects: [] });
  },
}));


export const selectUser = (state: GoogleAuthStoreType): GoogleUser | null => state.user;
export const selectUserEmail = (state: GoogleAuthStoreType): string => state.user?.email || "";
export const selectAuthLoading = (state: GoogleAuthStoreType): boolean => state.loading;
export const selectLogout = (state: GoogleAuthStoreType): () => Promise<void> => state.logout;
export const selectInitAuth = (state: GoogleAuthStoreType): () => Promise<void> => state.initAuth;