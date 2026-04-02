
import { JSX } from "react"
import { NavLink } from "react-router-dom"
import { useRouteError, isRouteErrorResponse, useLocation } from "react-router-dom";
export const SectionNotReady =(): JSX.Element=>{
    const error = useRouteError();
  console.log("ROUTE ERROR:", error);
 const location = useLocation();
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>Route Error</h1>
        <p>Status: {error.status}</p>
        <p>{error.statusText}</p>
        <p>{String(error.data)}</p>
        <p>Location: {location.pathname}</p>

        <NavLink to=".." relative="path">
          go back
        </NavLink>
      </>
    );
  }

  if (error instanceof Error) {
    return (
      <>
        <h1>Something crashed</h1>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>

        <NavLink to=".." relative="path">
          go back
        </NavLink>
      </>
    );
  }
    return(
        <>
            <h1>Not ready NO Ready?</h1>
              <NavLink to=".."
                relative="path" >go back</NavLink>
        </>
    )
}