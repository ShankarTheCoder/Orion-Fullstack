import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { getStoredUser, getToken, saveSession, clearSession } from '../services/api';

const AuthContext = createContext(null);

// Global auth state: the logged-in user (customer or admin) + actions.
// Guests have user = null and per the permission table they have NO cart
// and cannot order until they register and are verified by an administrator.
export function AuthProvider({ children }) {
  const [user, setInternalUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  const setUser = useCallback((updater) => {
    setInternalUser((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next) {
        saveSession(getToken(), next);
      }
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setInternalUser(null);
      return;
    }
    try {
      const me = await authService.getMe();
      if (me) {
        setInternalUser(me);
        saveSession(token, me);
      }
    } catch (err) {
      // Only clear session if token is genuinely invalid or expired (401/403).
      // On temporary network errors, preserve the stored user so the customer
      // does not unexpectedly drop into a guest state.
      if (err?.status === 401 || err?.status === 403) {
        clearSession();
        setInternalUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (getToken()) {
      refresh();
    }
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { user: u, token } = await authService.login(email, password);
      setInternalUser(u);
      saveSession(token, u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const adoptSession = useCallback((u, token) => {
    if (token) saveSession(token, u);
    setInternalUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore */
    }
    clearSession();
    setInternalUser(null);
  }, []);

  const role = String(user?.role || '').toLowerCase();
  const isAdmin = Boolean(user && role === 'admin');
  const isCustomer = Boolean(user && role === 'customer');

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin,
    isCustomer,
    login,
    logout,
    refresh,
    adoptSession,
    setUser,
  }), [user, loading, isAdmin, isCustomer, login, logout, refresh, adoptSession, setUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
