import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import Landing from './pages/Landing'
import { Login, Signup } from './pages/Auth'
import AppLayout from './app/AppLayout'
import Overview from './app/Overview'
import { ApiKeys, Billing, Settings, Verifications, Webhooks } from './app/Pages'

// Apply the remembered theme before first paint of the dashboard.
try {
  if (localStorage.getItem('assay-theme') === 'dark') document.documentElement.classList.add('dark')
} catch {
  /* storage unavailable */
}

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'verifications', element: <Verifications /> },
      { path: 'keys', element: <ApiKeys /> },
      { path: 'billing', element: <Billing /> },
      { path: 'webhooks', element: <Webhooks /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <Landing /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
