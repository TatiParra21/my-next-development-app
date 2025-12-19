
import  { JSX } from "react"
import { useLocation, NavLink } from "react-router-dom"

declare global {
  interface Window {
   authAPI: {
     oauthGoogle: () => Promise<{ success: boolean; url?: string; message?: string }>
    }
  }
}
export interface GoogleAuthResult {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
}


import { googleAuthStore } from "@renderer/store/projectStore";
export const LoginForm =():JSX.Element=>{
  const location = useLocation()
  const params = location.pathname
 const signInWithGoogle = googleAuthStore(state=>state.signInWithGoogle)

  //const [authError, setAuthError] = useState<string | null>(null);
  console.log("Current origin is:", window.location.origin); 
  const signInWithGoogleFunc = async ():Promise<void> => {
    await signInWithGoogle()
  };
  

    return(
        <>
   
        <button onClick={signInWithGoogleFunc}>Sign in With Google</button>
        {params == "/" && <p>{`Already have an account?`}<NavLink to="sign-in">Sign In</NavLink></p>}
         {params == "/sign-in" && <p>{`Don't have an account?`}<NavLink to="/">Sign Up</NavLink></p>}     
        
        </>
    )
}

