import { authService } from '../services/auth.service.js';
import { validateLogin, validateRegister } from '../validators/auth.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  clearRefreshCookie,
  readRefreshCookie,
  setRefreshCookie,
} from '../utils/cookies.js';

/**
 * Capa HTTP de autenticación: el access token viaja en el body y el refresh
 * token en una cookie httpOnly con path /api/auth.
 */
export const authController = {
  register: asyncHandler(async (req, res) => {
    const data = validateRegister(req.body);
    const session = await authService.register(data, req.get('user-agent'));

    setRefreshCookie(res, session.refreshToken);
    res.status(201).json({
      data: { user: session.user, accessToken: session.accessToken },
    });
  }),

  login: asyncHandler(async (req, res) => {
    const data = validateLogin(req.body);
    const session = await authService.login(data, req.get('user-agent'));

    setRefreshCookie(res, session.refreshToken);
    res.json({
      data: { user: session.user, accessToken: session.accessToken },
    });
  }),

  refresh: asyncHandler(async (req, res) => {
    const rawToken = readRefreshCookie(req);
    const session = await authService.refresh(rawToken, req.get('user-agent'));

    setRefreshCookie(res, session.refreshToken);
    res.json({
      data: { user: session.user, accessToken: session.accessToken },
    });
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(readRefreshCookie(req));
    clearRefreshCookie(res);
    res.status(204).send();
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.me(req.user.id);
    res.json({ data: { user } });
  }),
};
