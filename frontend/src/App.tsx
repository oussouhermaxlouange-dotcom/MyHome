import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import HomePage from '@/pages/HomePage'
import AnnoncesPage from '@/pages/AnnoncesPage'
import ApartmentDetailPage from '@/pages/ApartmentDetailPage'
import PublishPage from '@/pages/PublishPage'
import LandlordDashboardPage from '@/pages/LandlordDashboardPage'
import CartePage from '@/pages/CartePage'
import AuthPage from '@/pages/AuthPage'
import TenantDossierPage from '@/pages/TenantDossierPage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import PrivacyPage from '@/pages/PrivacyPage'
import CguPage from '@/pages/CguPage'
import { ToastProvider } from '@/context/ToastContext'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { AuthProvider } from '@/context/AuthContext'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="annonces" element={<AnnoncesPage />} />
                <Route path="annonces/:id" element={<ApartmentDetailPage />} />
                <Route path="carte" element={<CartePage />} />
                <Route path="locataire/dossier" element={<TenantDossierPage />} />
                <Route path="auth" element={<AuthPage />} />
                <Route path="inscription" element={<AuthPage />} />
                <Route path="proprietaire/publier" element={<PublishPage />} />
                <Route path="proprietaire/dashboard" element={<LandlordDashboardPage />} />
                <Route path="admin" element={<AdminDashboardPage />} />
                <Route path="confidentialite" element={<PrivacyPage />} />
                <Route path="cgu" element={<CguPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </FavoritesProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
