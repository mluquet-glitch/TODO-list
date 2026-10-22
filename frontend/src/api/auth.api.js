import {
  ApiError,
  api,
  clearAccessToken,
  refreshSession,
  setAccessToken,
} from './client.js';

/** Ejecuta login/register y guarda el access token devuelto. */
async function withSession(requestPromise) {
  const payload = await requestPromise;
  setAccessToken(payload.data.accessToken);
  return payload.data;
}

/**
 * Endpoints de autenticación.
 * El refresh token nunca se manipula desde JS: viaja en una cookie httpOnly.
 */
export const authApi = {
  login: (credentials) => withSession(api.post('/auth/login', credentials)),

  register: (data) => withSession(api.post('/auth/register', data)),

  async refresh() {
    const session = await refreshSession();
    if (!session) throw new ApiError('No hay una sesión activa', 401);
    return session;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
    }
  },

  async me() {
    const payload = await api.get('/auth/me');
    return payload.data.user;
  },
};
