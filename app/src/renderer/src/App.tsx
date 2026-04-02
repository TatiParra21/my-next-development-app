
import React, { useEffect, Suspense } from 'react'
import { SectionNotReady } from './components/SectionNotReady'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { SubLayout } from './components/SubLayout'
import { LoginForm } from './components/FormComponents/LoginForm'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoggedInRoute } from './components/LoggedInRoute'
import { googleAuthStore, selectAuthLoading } from './store/projectStore'
import { LoadingRoller } from './components/LoadingRoller'
const AddNewProjectForm = React.lazy(() => import('./components/AddNewProjectForm'))
const Layout = React.lazy(() => import('./components/Layout'))
const ProjectSelectionBase = React.lazy(() => import('./components/ProjectSelectionBase'))
const ProjectBaseEdit = React.lazy(() => import('./components/FormComponents/ProjectBaseEdit'))
const router = createHashRouter([
  { path: "/", element: <LoggedInRoute><LoginForm /> </LoggedInRoute>, errorElement: <SectionNotReady /> },
  { path: "/sign-in", element: <LoggedInRoute> <LoginForm /> </LoggedInRoute>, errorElement: <SectionNotReady /> },
  {
    path: "/dashboard", element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        path: "project-ideas", element: <SubLayout />, errorElement: <SectionNotReady />,
        children: [
          { index: true, element: <ProjectSelectionBase /> },
          { path: ":id", element: <ProjectBaseEdit /> }
        ]
      },
      { path: "write-new-project", element: <AddNewProjectForm /> }
    ]
  }
])
function App(): React.JSX.Element {
  const initAuth = googleAuthStore((s) => s.initAuth);
  const loading = googleAuthStore(selectAuthLoading)

  useEffect(() => {
    const runInit = async (): Promise<void> => {
      await initAuth()
    }
    runInit()

    // Listen for Deep Link Auth Code
    const removeListener = window.api.onGoogleAuthCode ?
      window.api.onGoogleAuthCode((code) => {
        console.log("Deep link code received", code);
        googleAuthStore.getState().processGoogleCode(code);
      }) : null;

    // Note: implementation in preload may not return unsubscribe yet
  }, [initAuth]);
  if (loading) return <LoadingRoller />;
  return (
    <>

      <Suspense fallback={<LoadingRoller />}>
        <RouterProvider router={router} />
      </Suspense>
    </>
  )
}
export default App
