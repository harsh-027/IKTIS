import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicOnlyRoute from './components/PublicOnlyRoute.jsx';
import IKTISLoadingScreen from './components/IKTISLoadingScreen.jsx';
import { isTrustedWebActivity } from './lib/environment.js';
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
const PaymentsPage = lazy(() => import('./pages/PaymentsPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const LegalPage = lazy(() => import('./pages/LegalPage.jsx'));
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.jsx'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<IKTISLoadingScreen complete />}>
          <Routes>
          <Route path="/" element={<RootRoute />} />

          {/* Public routes (redirect to / if already logged in) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
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
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Unknown routes get an auth-aware 404 without changing valid route guards. */}
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

function RootRoute() {
  const { isAuthenticated, isLoading, isInitialized, ensureAuth } = useAuth();

  React.useEffect(() => {
    ensureAuth();
  }, [ensureAuth]);

  if (isLoading || !isInitialized) {
    return <IKTISLoadingScreen />;
  }

  if (isAuthenticated) {
    return (
      <AppLayout>
        <DashboardPage />
      </AppLayout>
    );
  }

  return isTrustedWebActivity() ? <OnboardingPage /> : <LandingPage />;
}
