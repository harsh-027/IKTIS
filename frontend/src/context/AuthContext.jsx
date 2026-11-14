import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);
let sharedAuthInitialization = null;

export function AuthProvider({ children }) {
  // In-memory user state only. No tokens are stored in localStorage or sessionStorage.
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const userRef = React.useRef(user);
  const authVersionRef = React.useRef(0);
  const isMountedRef = React.useRef(true);
  const isInitializedRef = React.useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const ensureAuth = useCallback(async () => {
    if (isInitializedRef.current) {
      return userRef.current;
    }

    const requestVersion = authVersionRef.current;
    setIsLoading(true);

    if (!sharedAuthInitialization) {
      sharedAuthInitialization = authApi.getMe()
        .then((response) => (
          response.data?.success && response.data?.data?.user
            ? response.data.data.user
            : null
        ))
        .catch(() => null);
    }

    const authenticatedUser = await sharedAuthInitialization;

    if (
      !isMountedRef.current
      || authVersionRef.current !== requestVersion
    ) {
      return userRef.current;
    }

    userRef.current = authenticatedUser;
    setUser(authenticatedUser);
    isInitializedRef.current = true;
    setIsInitialized(true);
    setIsLoading(false);
    return authenticatedUser;
  }, []);

  const checkAuth = useCallback(async () => {
    if (!isInitializedRef.current) {
      return ensureAuth();
    }

    authVersionRef.current += 1;
    isInitializedRef.current = false;
    setIsInitialized(false);
    sharedAuthInitialization = null;
    return ensureAuth();
  }, [ensureAuth]);

  const login = useCallback(async (credentials) => {
    authVersionRef.current += 1;
    const response = await authApi.login(credentials);
    const authenticatedUser = response.data.data.user;
    userRef.current = authenticatedUser;
    sharedAuthInitialization = Promise.resolve(authenticatedUser);
    setUser(authenticatedUser);
    isInitializedRef.current = true;
    setIsInitialized(true);
    setIsLoading(false);
    return authenticatedUser;
  }, []);

  const register = useCallback(async (userData) => {
    authVersionRef.current += 1;
    const response = await authApi.register(userData);
    const registeredUser = response.data.data.user;
    userRef.current = registeredUser;
    sharedAuthInitialization = Promise.resolve(registeredUser);
    setUser(registeredUser);
    isInitializedRef.current = true;
    setIsInitialized(true);
    setIsLoading(false);
    return registeredUser;
  }, []);

  const logout = useCallback(async () => {
    authVersionRef.current += 1;
    try {
      await authApi.logout();
    } finally {
      userRef.current = null;
      sharedAuthInitialization = Promise.resolve(null);
      setUser(null);
      isInitializedRef.current = true;
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profile) => {
    authVersionRef.current += 1;
    const response = await authApi.updateProfile(profile);
    const updatedUser = response.data.data.user;
    userRef.current = updatedUser;
    sharedAuthInitialization = Promise.resolve(updatedUser);
    setUser(updatedUser);
    isInitializedRef.current = true;
    setIsInitialized(true);
    return updatedUser;
  }, []);

  const deleteAccount = useCallback(async () => {
    authVersionRef.current += 1;
    await authApi.deleteAccount();
    userRef.current = null;
    sharedAuthInitialization = Promise.resolve(null);
    setUser(null);
    isInitializedRef.current = true;
    setIsInitialized(true);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
    ensureAuth,
    checkAuth,
  }), [user, isLoading, isInitialized, login, register, logout, updateProfile, deleteAccount, ensureAuth, checkAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
