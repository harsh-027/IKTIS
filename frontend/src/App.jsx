import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicOnlyRoute from './components/PublicOnlyRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PropertiesPage from './pages/PropertiesPage.jsx';
import PropertyDetailPage from './pages/PropertyDetailPage.jsx';
import TenantsPage from './pages/TenantsPage.jsx';
import TenantDetailPage from './pages/TenantDetailPage.jsx';
import RentChargesPage from './pages/RentChargesPage.jsx';
import PaymentsPage from './pages/PaymentsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import LandingPage from './pages/LandingPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRoute />} />

          {/* Public routes (redirect to / if already logged in) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />

          {/* Protected routes — all share the AppLayout shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/properties/:id" element={<PropertyDetailPage />} />
              <Route path="/tenants" element={<TenantsPage />} />
              <Route path="/tenants/:id" element={<TenantDetailPage />} />
              <Route path="/rent-charges" element={<RentChargesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-soft flex items-center justify-center">
        <div className="text-ink-muted text-sm tracking-wide">Loading IKTIS...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <AppLayout>
        <DashboardPage />
      </AppLayout>
    );
  }

  return <LandingPage />;
}
