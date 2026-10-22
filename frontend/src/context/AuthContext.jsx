import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../api/auth.api.js';
import { onAuthFailure } from '../api/client.js';

const AuthContext = createContext(null);

/**
 * Mantiene la sesión en React:
 * - al montar, intenta recuperarla con el refresh token (cookie httpOnly);
 * - expone login, register y logout;
 * - `initializing` evita parpadeos de la pantalla de login al recargar.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    authApi
      .refresh()
      .then((session) => {
        if (active) setUser(session.user);
      })
      .catch(() => {
        // Sin sesión previa: se mostrará el login.
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Si el refresh deja de ser válido durante la sesión, se vuelve al login.
  useEffect(() => onAuthFailure(() => setUser(null)), []);

  const login = useCallback(async (credentials) => {
    const session = await authApi.login(credentials);
    setUser(session.user);
    return session.user;
  }, []);

  const register = useCallback(async (data) => {
    const session = await authApi.register(data);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
}
