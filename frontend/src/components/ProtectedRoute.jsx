import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import IKTISLoadingScreen from './IKTISLoadingScreen.jsx';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, isInitialized, ensureAuth } = useAuth();

  useEffect(() => {
    ensureAuth();
  }, [ensureAuth]);

  if (isLoading || !isInitialized) {
    return <IKTISLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
