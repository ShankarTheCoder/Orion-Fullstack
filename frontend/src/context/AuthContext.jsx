import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { getStoredUser } from '../services/api';

const AuthContext = createContext(null);

// Global auth state: the logged-in user (customer or admin) + actions.
// Guests simply have user = null - and per the permission table they have
// NO cart and cannot order until they register and verify their email.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await authService.getMe();
      if (me) setUser(me);
    } catch { /* token expired/invalid - stay guest */ }
  }, []);

  useEffect(() => { if (getStoredUser()) refresh(); }, [refresh]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { user: u } = await authService.login(email, password);
      setUser(u);
      return u;
    } finally { setLoading(false); }
  }, []);

  // Used by the Verify Email page after a successful OTP check (the service
  // has already saved the session token).
  const adoptSession = useCallback((u) => setUser(u), []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user, loading,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    login, logout, refresh, adoptSession, setUser,
  }), [user, loading, login, logout, refresh, adoptSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
