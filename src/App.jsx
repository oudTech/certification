import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import VerifyPage from './pages/VerifyPage.jsx'
import SignInPage from './pages/admin/SignInPage.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import DashboardPage from './pages/admin/DashboardPage.jsx'
import CertificatesPage from './pages/admin/CertificatesPage.jsx'
import CertificateFormPage from './pages/admin/CertificateFormPage.jsx'
import SettingsPage from './pages/admin/SettingsPage.jsx'
import { getToken } from './lib/api.js'
import './styles/tokens.css'
import './styles/public.css'
import './styles/auth.css'
import './styles/admin.css'

function RequireAuth({ children }) {
  if (!getToken()) return <Navigate to="/admin/sign-in" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VerifyPage />} />
        <Route path="/admin/sign-in" element={<SignInPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="certificates/new" element={<CertificateFormPage />} />
          <Route path="certificates/:id/edit" element={<CertificateFormPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
