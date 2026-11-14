import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import Landing from './pages/Landing'
import { CoveragePage, FaqPage, HowItWorksPage, PlatformPage, PricingPage } from './pages/MarketingPages'
import { Login, Signup } from './pages/Auth'
import AppLayout from './app/AppLayout'
import Overview from './app/Overview'
import { ApiKeys, Billing, Settings, Verifications, Webhooks } from './app/Pages'
import { RequireAuth, SessionProvider } from './lib/session'
import { AdminOrganisation, AdminOrganisations, AdminOverview } from './admin/Admin'

// Apply the remembered theme before first paint of the dashboard.
try {
  if (localStorage.getItem('assay-theme') === 'dark') document.documentElement.classList.add('dark')
} catch {
  /* storage unavailable */
}

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/platform', element: <PlatformPage /> },
  { path: '/coverage', element: <CoveragePage /> },
  { path: '/how-it-works', element: <HowItWorksPage /> },
  { path: '/pricing', element: <PricingPage /> },
  { path: '/faq', element: <FaqPage /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Overview /> },
      { path: 'verifications', element: <Verifications /> },
      { path: 'keys', element: <ApiKeys /> },
      { path: 'billing', element: <Billing /> },
      { path: 'webhooks', element: <Webhooks /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAuth staff>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AdminOverview /> },
      { path: 'organisations', element: <AdminOrganisations /> },
      { path: 'organisations/:id', element: <AdminOrganisation /> },
    ],
  },
  { path: '*', element: <Landing /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  </StrictMode>,
)
