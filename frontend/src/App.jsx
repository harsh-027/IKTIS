import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicOnlyRoute from './components/PublicOnlyRoute.jsx';
const AppLayout = lazy(() => import('./components/AppLayout.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const PropertiesPage = lazy(() => import('./pages/PropertiesPage.jsx'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage.jsx'));
const TenantsPage = lazy(() => import('./pages/TenantsPage.jsx'));
const TenantDetailPage = lazy(() => import('./pages/TenantDetailPage.jsx'));
const RentChargesPage = lazy(() => import('./pages/RentChargesPage.jsx'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
import LegalPage from './pages/LegalPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen bg-surface-soft flex items-center justify-center"><div className="text-ink-muted text-sm tracking-wide">Loading IKTIS...</div></div>}>
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
          <Route path="/landing" element={<LandingPage />} />

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
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
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
