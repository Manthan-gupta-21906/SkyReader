import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Sky from './ui/Sky.tsx'
import Log from './ui/Log.tsx'
import Atlas from './ui/Atlas.tsx'
import Settings from './ui/Settings.tsx'
import Result from './ui/Result.tsx'
import Onboarding from './ui/Onboarding.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Sky /> },
      { path: 'log', element: <Log /> },
      { path: 'atlas', element: <Atlas /> },
      { path: 'settings', element: <Settings /> },
      { path: 'result', element: <Result /> },
      { path: 'onboarding', element: <Onboarding /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)