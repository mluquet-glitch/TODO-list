import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

/**
 * Construcción de la app Express, separada del arranque del servidor
 * (`index.js`) para poder importarla en tests sin abrir un puerto.
 */
export const app = express();

// Confía en el proxy de Vercel para leer correctamente las IP del cliente
// (X-Forwarded-For, Forwarded). Requerido por express-rate-limit detrás de un proxy.
// No confía ciegamente en cualquier IP para evitar saltarse el rate limiting.
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// Oculta la cabecera X-Powered-By: Express.
app.disable('x-powered-by');

// Cabeceras HTTP de seguridad.
app.use(helmet());

// CORS restringido al frontend configurado (admite lista separada por comas).
// `credentials` permite el envío de la cookie httpOnly del refresh token.
const corsOrigins = env.corsOrigin.split(',').map((origin) => origin.trim());
console.log('[cors] Aplicando middleware CORS con origen(es):', corsOrigins);
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

// Parseo del body JSON con límite para evitar payloads gigantes.
app.use(express.json({ limit: '1mb' }));

// Lectura de cookies (refresh token).
app.use(cookieParser());

// Log de requests: 'dev' en local, 'combined' en producción.
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// Todas las rutas de la API cuelgan de /api.
app.use('/api', routes);

// 404 y manejo centralizado de errores (siempre al final).
app.use(notFound);
app.use(errorHandler);
