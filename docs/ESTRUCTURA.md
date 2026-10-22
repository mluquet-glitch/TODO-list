# Estructura del proyecto — Gestor de Tareas con autenticación JWT

Documentación del monorepo: backend (Node.js + Express + PostgreSQL) y frontend (React + Vite),
incluyendo usuarios, autenticación JWT y aislamiento de tareas por usuario.

> Rama: `feature/usuarios-jwt`. Esquema canónico en [`docs/Database.sql`](Database.sql).

- [1. Visión general](#1-visión-general)
- [2. Stack y requisitos](#2-stack-y-requisitos)
- [3. Puesta en marcha](#3-puesta-en-marcha)
- [4. Variables de entorno](#4-variables-de-entorno)
- [5. Backend: estructura y responsabilidades](#5-backend-estructura-y-responsabilidades)
- [6. Dependencias del backend](#6-dependencias-del-backend)
- [7. Base de datos](#7-base-de-datos)
- [8. Autenticación y sesiones](#8-autenticación-y-sesiones)
- [9. API REST](#9-api-rest)
- [10. Frontend: estructura y responsabilidades](#10-frontend-estructura-y-responsabilidades)
- [11. Dependencias del frontend](#11-dependencias-del-frontend)
- [12. Flujos completos](#12-flujos-completos)
- [13. Comandos disponibles](#13-comandos-disponibles)
- [14. Convenciones y decisiones de diseño](#14-convenciones-y-decisiones-de-diseño)
- [15. Cómo ampliar el proyecto](#15-cómo-ampliar-el-proyecto)
- [16. Verificación realizada](#16-verificación-realizada)
- [17. Próximos pasos sugeridos](#17-próximos-pasos-sugeridos)

---

## 1. Visión general

```
C:\CODIGO\Tareas
├── backend/      API REST (Express) + PostgreSQL + JWT
├── frontend/     SPA (React + Vite) con login y gestión de tareas
└── docs/         Documentación y script de base de datos
```

El frontend nunca habla con PostgreSQL: todo pasa por la API. En desarrollo Vite hace proxy de
`/api` hacia `http://localhost:3000`, por lo que navegador, API y cookie de sesión comparten origen
y no hay problemas de CORS ni de cookies.

```
┌──────────────────┐  HTTP/JSON + JWT  ┌──────────────────┐   SQL (pg)   ┌──────────────┐
│ React + Vite     │ ────────────────► │ Express (Node.js)│ ───────────► │ PostgreSQL   │
│ localhost:5173   │ ◄──────────────── │ localhost:3000   │ ◄─────────── │ users        │
│                  │  cookie httpOnly  │                  │              │ tasks        │
└──────────────────┘                   └──────────────────┘              │ refresh_...  │
                                                                        └──────────────┘
```

Características principales:

- Registro y login con contraseñas hasheadas con **bcrypt** (coste 12).
- **Access token JWT** de 15 minutos, enviado como `Authorization: Bearer`.
- **Refresh token opaco** de 7 días en cookie `httpOnly`, con rotación y detección de reutilización.
- Todas las rutas de `/api/tasks` requieren autenticación y cada usuario solo ve sus tareas.
- Logout real: revoca el refresh token en la base de datos y limpia la cookie.
- Rate limiting en login/registro para frenar fuerza bruta.

---

## 2. Stack y requisitos

| Componente | Tecnología                  | Versión probada |
| ---------- | --------------------------- | --------------- |
| Runtime    | Node.js (ESM)               | 24.18.0         |
| Backend    | Express 4                   | 4.22.3          |
| Driver DB  | `pg` (node-postgres)        | 8.23.1          |
| Base datos | PostgreSQL                  | 16.14           |
| Auth       | jsonwebtoken + bcryptjs     | 9.0.3 / 3.0.3   |
| Frontend   | React                       | 19.3.1          |
| Bundler    | Vite                        | 7.3.7           |
| Lenguaje   | JavaScript (sin TypeScript) | —               |

Requisitos mínimos:

- Node.js **20 o superior**.
- PostgreSQL **13 o superior**.
- Base de datos vacía (por ejemplo, `tareas`).

---

## 3. Puesta en marcha

### 3.1 Crear la base de datos

```powershell
createdb -U postgres tareas
```

### 3.2 Backend

```powershell
cd backend
Copy-Item .env.example .env      # Linux/macOS: cp .env.example .env
# Ajustar DATABASE_URL y, en producción, JWT_ACCESS_SECRET
npm install
npm run db:migrate
npm run db:seed                  # usuario demo + 3 tareas
npm run dev                      # http://localhost:3000/api
```

Credenciales del seed:

```
email:    demo@tareas.local
password: Demo1234!
```

Comprobar la API:

```powershell
curl http://localhost:3000/api/health
curl http://localhost:3000/api/tasks
# -> 401: las tareas requieren autenticación
```

### 3.3 Frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev                      # http://localhost:5173
```

Abrir <http://localhost:5173>, iniciar sesión con la cuenta demo o crear una cuenta nueva.

### 3.4 Si ya tenías la base de la versión anterior

El esquema cambió para alinearse con `docs/Database.sql` (ids `BIGSERIAL`, `priority`,
`parent_task_id`, `user_id`). En un entorno **de desarrollo** sin datos que conservar:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Después: `npm run db:migrate && npm run db:seed`.

---

## 4. Variables de entorno

### Backend — `backend/.env`

| Variable                 | Obligatoria | Por defecto             | Descripción                                                        |
| ------------------------ | ----------- | ----------------------- | ------------------------------------------------------------------ |
| `NODE_ENV`               | No          | `development`           | Entorno de ejecución.                                              |
| `PORT`                   | No          | `3000`                  | Puerto HTTP de la API.                                             |
| `DATABASE_URL`           | Sí\*        | —                       | Cadena de conexión PostgreSQL. Prioritaria sobre las `PG*`.       |
| `PGHOST` / `PGPORT` …    | Sí\*        | `5432`                  | Alternativa a `DATABASE_URL` (PGUSER, PGPASSWORD, PGDATABASE…).    |
| `PGSSL`                  | No          | `false`                 | `true` activa SSL hacia PostgreSQL.                                |
| `CORS_ORIGIN`            | No          | `http://localhost:5173` | Origen(es) permitidos, separados por coma.                         |
| `JWT_ACCESS_SECRET`      | Sí\*\*      | secreto de desarrollo   | Firma de los access tokens. Mínimo 32 caracteres.                  |
| `JWT_ACCESS_EXPIRES_IN`  | No          | `15m`                   | Vida del access token (formato de `jsonwebtoken`).                 |
| `JWT_REFRESH_EXPIRES_DAYS` | No        | `7`                     | Vida del refresh token en días.                                    |
| `COOKIE_SAMESITE`        | No          | `lax`                   | `lax`, `strict` o `none` (`none` exige HTTPS).                    |
| `COOKIE_SECURE`          | No          | `true` en producción    | Fuerza el flag `Secure` de la cookie.                              |

\* Se usa `DATABASE_URL` **o** el bloque `PG*`.
\*\* En desarrollo hay un valor por defecto con aviso en consola; **en producción el arranque falla**
si no se define un secreto propio de al menos 32 caracteres.

Generar un secreto:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Frontend — `frontend/.env`

| Variable            | Por defecto             | Descripción                                                      |
| ------------------- | ----------------------- | ---------------------------------------------------------------- |
| `VITE_API_URL`      | `/api`                  | URL base usada por el navegador (Vite aplica proxy en dev).      |
| `VITE_PROXY_TARGET` | `http://localhost:3000` | Destino del proxy de desarrollo (solo lo lee `vite.config.js`).  |

---

## 5. Backend: estructura y responsabilidades

```
backend/
├── package.json                     Metadatos, scripts y dependencias
├── package-lock.json                Árbol exacto de dependencias
├── .env.example                     Plantilla de variables de entorno
├── .gitignore
├── db/
│   ├── migrations/
│   │   ├── 001_create_users.sql     Usuarios + función set_updated_at
│   │   ├── 002_create_tasks.sql     Tareas (BIGSERIAL, prioridad, jerarquía, FK usuario)
│   │   └── 003_create_refresh_tokens.sql  Sesiones renovables (hash SHA-256)
│   └── seeds/
│       └── 001_seed_tasks.sql       Usuario demo + tareas de ejemplo
├── scripts/
│   ├── migrate.js                   Runner de migraciones con control de aplicadas
│   └── seed.js                      Ejecutor de seeds
└── src/
    ├── index.js                     Arranque, comprobación de BD y apagado ordenado
    ├── app.js                       App Express y middleware global
    ├── config/
    │   ├── env.js                   Variables de entorno validadas (BD, JWT, cookies)
    │   └── db.js                    Pool de pg, query(), transacciones, health check
    ├── routes/
    │   ├── index.js                 Router /api: health, auth y tasks (protegido)
    │   ├── auth.routes.js           Registro, login, refresh, logout y me
    │   └── tasks.routes.js          CRUD de tareas
    ├── controllers/
    │   ├── auth.controller.js       Cookie httpOnly + respuestas de sesión
    │   └── tasks.controller.js      Capa HTTP de tareas
    ├── validators/
    │   ├── auth.validator.js        Email, contraseña y nombre
    │   └── tasks.validator.js       Ids numéricos, estados, prioridades, jerarquía
    ├── services/
    │   ├── auth.service.js          bcrypt, sesiones, rotación y reuse detection
    │   └── tasks.service.js         Reglas de negocio y aislamiento por usuario
    ├── repositories/
    │   ├── users.repository.js      SQL de usuarios
    │   ├── refreshTokens.repository.js  SQL de refresh tokens + rotación transaccional
    │   └── tasks.repository.js      SQL de tareas (siempre filtra por user_id)
    ├── middlewares/
    │   ├── auth.js                  Verifica el Bearer token y adjunta req.user
    │   ├── rateLimit.js             Límite de intentos en auth
    │   ├── notFound.js              404 para rutas inexistentes
    │   └── errorHandler.js          Errores centralizados → JSON
    └── utils/
        ├── ApiError.js              Error operativo (400/401/403/404/409)
        ├── asyncHandler.js          Captura promesas rechazadas
        ├── jwt.js                   Firma y verificación del access token
        ├── tokens.js                Refresh token aleatorio, hash y expiración
        └── cookies.js               Set/clear/read de la cookie de refresco
```

### Responsabilidad de cada archivo

| Archivo | Responsabilidad |
| ------- | --------------- |
| `src/index.js` | Arranca el servidor, comprueba la conexión a la BD sin bloquear, cierra servidor y pool con `SIGINT`/`SIGTERM`. |
| `src/app.js` | `helmet`, `cors` con credenciales, `express.json`, `cookie-parser`, `morgan`, monta `/api`, 404 y error handler. Exporta `app` para tests. |
| `src/config/env.js` | Carga `.env` y valida PostgreSQL, secreto JWT (≥32 caracteres, obligatorio en producción), expiraciones y flags de cookie. |
| `src/config/db.js` | Único `Pool` de conexiones; `query()` parametrizado, `getClient()` para transacciones, `checkDatabase()` y `closePool()`. |
| `src/routes/index.js` | `GET /api/health`, `/api/auth` público y `/api/tasks` protegido con `requireAuth`. |
| `src/routes/auth.routes.js` | `POST /register`, `/login`, `/refresh`, `/logout` y `GET /me`. Aplica `authLimiter` a registro/login. |
| `src/routes/tasks.routes.js` | Declara los endpoints CRUD de tareas. |
| `src/middlewares/auth.js` | Exige `Authorization: Bearer`, verifica firma/expiración/emisor/audiencia y coloca `req.user` (`id`, `email`, `role`). |
| `src/middlewares/rateLimit.js` | Máximo 20 intentos cada 15 minutos en login/registro por IP. |
| `src/controllers/auth.controller.js` | Valida el body, llama al servicio, envía la cookie httpOnly y responde `{ data: { user, accessToken } }`. |
| `src/controllers/tasks.controller.js` | Lee params/query/body, usa `req.user.id` y responde con `{ data }`. |
| `src/validators/auth.validator.js` | Normaliza email (minúsculas, formato, ≤255), exige contraseña de 8–72 con letra y número, y nombre de 2–120. |
| `src/validators/tasks.validator.js` | Ids enteros positivos, `title` ≤255, `description` ≤2000, estados/prioridades permitidos y `parentTaskId` opcional. |
| `src/services/auth.service.js` | Hash bcrypt (coste 12), login con mensaje genérico, creación de sesión, rotación del refresh token y revocación global ante reutilización. |
| `src/services/tasks.service.js` | Filtros válidos, 404, validación de la tarea padre (misma persona) y paso del `userId` al repositorio. |
| `src/repositories/users.repository.js` | SQL de usuarios; solo expone `password_hash` en consultas internas de login. |
| `src/repositories/refreshTokens.repository.js` | Alta, búsqueda por hash, rotación atómica (revocar + insertar) y revocación por token/usuario. |
| `src/repositories/tasks.repository.js` | Todo el SQL de tareas; **cada consulta filtra por `user_id`** y usa parámetros. |
| `src/utils/jwt.js` | Firma/verifica el access token con `issuer` y `audience` fijos. |
| `src/utils/tokens.js` | Genera refresh tokens con `randomBytes(48)`, calcula SHA-256 y la fecha de expiración. |
| `src/utils/cookies.js` | Cookie `refresh_token` httpOnly, `SameSite` configurable, `Secure` en producción y `Path=/api/auth`. |
| `src/utils/ApiError.js` | Error operativo con `statusCode`, `details` y helpers (`unauthorized`, `forbidden`, `notFound`, `conflict`). |
| `src/utils/asyncHandler.js` | Reenvía rechazos async a `next()` para el error handler. |
| `db/migrations/*.sql` | DDL versionado del esquema canónico. |
| `db/seeds/001_seed_tasks.sql` | Inserta el usuario demo (hash bcrypt) y sus tareas si no existen. |
| `scripts/migrate.js` | Crea `schema_migrations`, aplica `.sql` pendientes en orden y registra cada uno en una transacción. |
| `scripts/seed.js` | Ejecuta los seeds en orden, cada uno en una transacción. |

### Capas

```
routes → middleware auth → controllers → validators → services → repositories → PostgreSQL
                                              ↘ ApiError → errorHandler → JSON
```

---

## 6. Dependencias del backend

### Producción

| Paquete | Versión | Uso |
| ------- | ------- | --- |
| `express` | 4.22.3 | Framework HTTP, routing y middleware. |
| `pg` | 8.23.1 | Pool, consultas parametrizadas y transacciones. |
| `dotenv` | 16.6.1 | Carga de `.env`. |
| `cors` | 2.8.6 | Origen permitido y `credentials` para la cookie. |
| `helmet` | 8.3.0 | Cabeceras HTTP de seguridad. |
| `morgan` | 1.12.1 | Log de peticiones. |
| `cookie-parser` | 1.4.7 | Lectura de la cookie del refresh token. |
| `jsonwebtoken` | 9.0.3 | Firma y verificación de access tokens JWT. |
| `bcryptjs` | 3.0.3 | Hash y comparación de contraseñas (JS puro, sin compilación nativa). |
| `express-rate-limit` | 8.7.1 | Límite de intentos en login/registro. |

### Desarrollo

Sin `devDependencies`: la recarga usa `node --watch` nativo.

### Decisiones

- **Access token en memoria + refresh en cookie**: el token de acceso no se guarda en
  `localStorage`, reduciendo el impacto de un XSS; el refresh token es inaccesible desde JS.
- **Refresh opaco en BD**: permite logout real, rotación y detección de reutilización, algo que un
  JWT de refresco sin estado no ofrece.
- **bcryptjs** evita dependencias nativas y funciona igual en Windows/Linux.
- **Rate limit** solo en auth para no interferir con el uso normal de la API.

---

## 7. Base de datos

El esquema completo y ejecutable está en [`docs/Database.sql`](Database.sql), alineado con las
migraciones.

### `users`

| Columna | Tipo | Restricciones |
| ------- | ---- | ------------- |
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(120)` | `NOT NULL` |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE`, normalizado a minúsculas en la API |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` (bcrypt) |
| `role` | `VARCHAR(20)` | `NOT NULL DEFAULT 'user'`, CHECK `user/admin` |
| `created_at` / `updated_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP`; trigger en updates |

### `tasks`

| Columna | Tipo | Restricciones |
| ------- | ---- | ------------- |
| `id` | `BIGSERIAL` | PK |
| `user_id` | `BIGINT` | `NOT NULL`, FK → `users(id)` `ON DELETE CASCADE` |
| `title` | `VARCHAR(255)` | `NOT NULL` |
| `description` | `TEXT` | Nullable |
| `status` | `VARCHAR(50)` | default `pending`, CHECK `pending/in_progress/done` |
| `priority` | `VARCHAR(50)` | default `medium`, CHECK `low/medium/high/urgent` |
| `parent_task_id` | `BIGINT` | Nullable, FK → `tasks(id)` `ON DELETE CASCADE` |
| `created_at` / `updated_at` | `TIMESTAMP` | trigger `tasks_set_updated_at` |

Índices: `(user_id, created_at DESC)`, `(user_id, status)` y `(parent_task_id)`.

### `refresh_tokens`

| Columna | Tipo | Restricciones |
| ------- | ---- | ------------- |
| `id` | `BIGSERIAL` | PK |
| `user_id` | `BIGINT` | FK → `users(id)` `ON DELETE CASCADE` |
| `token_hash` | `CHAR(64)` | `UNIQUE` (SHA-256 del token) |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` |
| `revoked_at` | `TIMESTAMPTZ` | Nullable |
| `user_agent` | `VARCHAR(255)` | Nullable, informativo |
| `created_at` | `TIMESTAMPTZ` | default `now()` |

### Migraciones y seeds

- `schema_migrations (name, applied_at)` registra qué archivos se aplicaron.
- Cada migración corre en su propia transacción.
- Los seeds son idempotentes: el usuario demo usa `ON CONFLICT DO NOTHING` y las tareas solo se
  insertan si el usuario aún no tiene ninguna.
- Para evolucionar el esquema se añade un archivo nuevo (`004_...sql`), nunca se edita uno aplicado.

---

## 8. Autenticación y sesiones

### Registro / login

1. El cliente envía `{ name?, email, password }`.
2. El validador normaliza el email y comprueba la contraseña.
3. `bcrypt.hash` (registro) o `bcrypt.compare` (login).
4. Se crea el usuario si no existe (409 si el email está ocupado).
5. El servicio genera:
   - **access token JWT** (15 min): `sub`, `email`, `role`, `iss`, `aud`, `exp`.
   - **refresh token** aleatorio de 48 bytes.
6. Se guarda en `refresh_tokens` solo el **SHA-256** del refresh token.
7. La respuesta incluye `accessToken` y el usuario; el refresh va en `Set-Cookie`.

### Renovación

`POST /api/auth/refresh` lee la cookie, busca el hash y:

1. Si no existe → 401.
2. Si está revocado → **posible robo**: revoca todas las sesiones del usuario y 401.
3. Si expiró → revoca ese token y 401.
4. Si es válido → revoca el actual e inserta uno nuevo en la **misma transacción** (rotación),
   devuelve un access token nuevo y actualiza la cookie.

El cliente renueva automáticamente al recibir un 401 en cualquier ruta que no sea `/auth/*`;
varias peticiones simultáneas comparten una sola promesa de refresh (single-flight).

### Logout

`POST /api/auth/logout` marca el refresh token como revocado y borra la cookie. El access token
sigue siendo válido hasta que expira (máximo 15 minutos), porque JWT es sin estado.

### Cookie

```
refresh_token=<opaco>; HttpOnly; Path=/api/auth; SameSite=Lax; Max-Age=7d
```

- `Secure` se activa en producción.
- `Path=/api/auth` evita enviarla en cada petición de tareas.
- Si frontend y API están en dominios distintos en producción, configura
  `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true` y `CORS_ORIGIN` exacto.

### Aislamiento por usuario

`requireAuth` deja `req.user.id`; todas las consultas de tareas incluyen `user_id = $n`. Un usuario
no puede leer, modificar ni borrar tareas ajenas: recibe 404 (no se revela su existencia).
La tarea padre de una subtarea también debe pertenecer al mismo usuario.

---

## 9. API REST

Base: `http://localhost:3000/api`

Éxito: `{ "data": ... }`. Error: `{ "error": { "message", "details"? } }`.

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| `GET` | `/health` | No | Estado del proceso y de PostgreSQL. |
| `POST` | `/auth/register` | No | Crea una cuenta y abre sesión. |
| `POST` | `/auth/login` | No | Inicia sesión. |
| `POST` | `/auth/refresh` | Cookie | Renueva el access token y rota el refresh. |
| `POST` | `/auth/logout` | Cookie | Revoca la sesión y borra la cookie. |
| `GET` | `/auth/me` | Bearer | Devuelve el usuario autenticado. |
| `GET` | `/tasks` | Bearer | Lista las tareas del usuario. Filtros: `status`, `priority`, `search`. |
| `POST` | `/tasks` | Bearer | Crea una tarea. |
| `GET` | `/tasks/:id` | Bearer | Obtiene una tarea propia. |
| `PATCH` | `/tasks/:id` | Bearer | Actualización parcial. |
| `DELETE` | `/tasks/:id` | Bearer | Elimina una tarea propia (204). |

### Registro

```http
POST /api/auth/register
Content-Type: application/json

{ "name": "Ana Torres", "email": "ana@example.com", "password": "Secreta123" }
```

```json
201 Created
{
  "data": {
    "user": { "id": 2, "name": "Ana Torres", "email": "ana@example.com", "role": "user", "createdAt": "...", "updatedAt": "..." },
    "accessToken": "eyJhbGciOi..."
  }
}
Set-Cookie: refresh_token=...; HttpOnly; Path=/api/auth; SameSite=Lax
```

Validaciones: `name` 2–120, email válido ≤255, contraseña 8–72 con al menos una letra y un número.
Email duplicado → **409**.

### Login

```http
POST /api/auth/login
{ "email": "demo@tareas.local", "password": "Demo1234!" }
```

→ `200` con la misma estructura que el registro. Credenciales incorrectas → **401** con mensaje
genérico (no revela si el email existe).

### Renovar / logout

```powershell
curl -X POST http://localhost:3000/api/auth/refresh -b cookies.txt -c cookies.txt
curl -X POST http://localhost:3000/api/auth/logout  -b cookies.txt -c cookies.txt
```

### Tareas

```http
POST /api/tasks
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "Preparar el despliegue",
  "description": "Revisar variables y migraciones",
  "status": "pending",
  "priority": "high",
  "parentTaskId": null
}
```

- `status`: `pending` | `in_progress` | `done` (default `pending`).
- `priority`: `low` | `medium` | `high` | `urgent` (default `medium`).
- `parentTaskId`: id numérico de una tarea propia o `null` (subtareas).
- `id` de tarea es **numérico** (`BIGSERIAL`).

```powershell
# Listar altas pendientes que contengan "despliegue"
curl "http://localhost:3000/api/tasks?status=pending&priority=high&search=despliegue" `
  -H "Authorization: Bearer <token>"

# Marcar como completada
curl -X PATCH http://localhost:3000/api/tasks/12 `
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" `
  -d '{"status":"done"}'
```

### Errores

| Código | Cuándo |
| ------ | ------ |
| 400 | Body inválido, JSON malformado, id/prioridad/estado/fecha no válidos. |
| 401 | Sin token, token expirado/inválido, credenciales incorrectas, sesión revocada. |
| 404 | Tarea ajena/inexistente o ruta desconocida. |
| 409 | Email ya registrado u otra violación de unicidad. |
| 429 | Demasiados intentos de login/registro. |
| 500 | Error inesperado (sin stack en producción). |

---

## 10. Frontend: estructura y responsabilidades

```
frontend/
├── index.html                     Documento raíz
├── package.json
├── package-lock.json
├── vite.config.js                 React, puerto 5173, proxy /api, build
├── .env.example
├── .gitignore
└── src/
    ├── main.jsx                   createRoot + StrictMode
    ├── App.jsx                    AuthProvider + layout + sesión/condicional
    ├── index.css                  Diseño, login, tareas y responsive
    ├── api/
    │   ├── client.js              fetch, access token, refresh single-flight, 401
    │   ├── auth.api.js            register, login, refresh, logout, me
    │   └── tasks.api.js           CRUD de tareas
    ├── context/
    │   └── AuthContext.jsx        Estado de sesión, login/register/logout
    ├── components/
    │   ├── Alert.jsx              Mensajes de error accesibles
    │   ├── TaskForm.jsx           Alta con estado y prioridad
    │   ├── TaskItem.jsx           Badges, cambio de estado y borrado
    │   └── TaskList.jsx           Lista, carga y vacío
    ├── constants/
    │   └── tasks.js               Estados y prioridades + etiquetas
    ├── hooks/
    │   └── useTasks.js            Estado y CRUD de tareas
    └── pages/
        ├── LoginPage.jsx          Login/registro en una pantalla
        └── TasksPage.jsx          Formulario, resumen, filtros y listado
```

### Responsabilidad de cada archivo

| Archivo | Responsabilidad |
| ------- | --------------- |
| `src/App.jsx` | Envuelve la app en `AuthProvider`; muestra «Comprobando sesión», `LoginPage` o `TasksPage`; cabecera con usuario y logout. |
| `src/api/client.js` | Construye peticiones con `credentials: 'include'`; guarda el access token en memoria; ante 401 hace un refresh (single-flight) y reintenta; notifica a `AuthContext` si la sesión murió. |
| `src/api/auth.api.js` | Llama a los endpoints de auth, guarda/limpia el token y expone `refresh`/`me`. |
| `src/api/tasks.api.js` | Lista/crea/actualiza/borra tareas; desempaqueta `{ data }`. |
| `src/context/AuthContext.jsx` | Recupera la sesión al cargar con `/auth/refresh`, mantiene `user`, `initializing` y acciones `login`/`register`/`logout`. |
| `src/pages/LoginPage.jsx` | Pestañas login/registro, validación local, errores de API, estado de envío y credenciales demo. |
| `src/pages/TasksPage.jsx` | Hook de tareas, contadores, búsqueda, filtros por estado/prioridad y composición de la UI. |
| `src/hooks/useTasks.js` | Carga inicial y operaciones CRUD con `saving`/`error`; sincroniza la lista con la respuesta del servidor. |
| `src/components/TaskForm.jsx` | Formulario controlado con título, descripción, estado y prioridad. |
| `src/components/TaskItem.jsx` | Badge de estado, prioridad, subtarea; selector de estado y borrado con confirmación. |
| `src/components/TaskList.jsx` | Renderiza la lista o los estados de carga/vacío. |
| `src/components/Alert.jsx` | Mensaje `role="alert"` con reintentar/cerrar. |
| `src/constants/tasks.js` | Enums y etiquetas en español. |
| `src/index.css` | Tokens de diseño, layout, formularios, tarjetas, login, badges y responsive. |

### Gestión de la sesión en el cliente

- **Access token**: variable en memoria del módulo `client.js`. Nunca en `localStorage`.
- **Refresh token**: cookie httpOnly gestionada por el navegador; JS no puede leerla.
- Al recargar: `AuthContext` llama a `/auth/refresh`; si la cookie es válida recupera usuario y token.
- Al expirar el access token, `client.js` renueva y repite la petición original una vez.
- Logout: revoca en servidor, limpia cookie y token, y desmonta `TasksPage`.

---

## 11. Dependencias del frontend

### Producción

| Paquete | Versión | Uso |
| ------- | ------- | --- |
| `react` | 19.3.1 | UI y hooks. |
| `react-dom` | 19.3.1 | Renderizado en el DOM. |

### Desarrollo

| Paquete | Versión | Uso |
| ------- | ------- | --- |
| `vite` | 7.3.7 | Dev server, proxy, HMR y build. |
| `@vitejs/plugin-react` | 5.2.0 | JSX y Fast Refresh. |

No se añadió router: la alternancia login/app se resuelve con el estado de sesión. Para crecer,
React Router sería el siguiente paso.

---

## 12. Flujos completos

### Login desde el navegador

1. `LoginPage` valida y llama a `login` del contexto.
2. `authApi.login` → `POST /api/auth/login` con `credentials: 'include'`.
3. Express valida, busca el usuario, compara bcrypt y crea la sesión.
4. Responde usuario + `accessToken` y `Set-Cookie: refresh_token`.
5. El cliente guarda el token en memoria y el contexto fija `user`.
6. `App` desmonta `LoginPage` y monta `TasksPage`.
7. `useTasks` pide `/api/tasks` con `Authorization: Bearer`.

### Petición de tareas con token caducado

1. `GET /api/tasks` devuelve 401.
2. `client.js` llama a `/auth/refresh` (cookie).
3. El backend rota el refresh token y devuelve un access token nuevo.
4. El cliente actualiza la cookie (automático) y repite `GET /api/tasks`.
5. Si el refresh falla, se limpia la sesión y aparece el login.

### Crear una tarea

1. `TaskForm` → `useTasks.createTask` → `tasksApi.create`.
2. `POST /api/tasks` con Bearer.
3. `requireAuth` → controlador → validador → servicio (valida padre) → repositorio (`INSERT`).
4. PostgreSQL valida CHECK/FK y devuelve la fila; el hook la añade al estado.

---

## 13. Comandos disponibles

### Backend

| Comando | Descripción |
| ------- | ----------- |
| `npm run dev` | Servidor con recarga (`node --watch`). |
| `npm start` | Servidor sin recarga. |
| `npm run db:migrate` | Aplica migraciones pendientes. |
| `npm run db:seed` | Carga usuario demo y tareas. |

### Frontend

| Comando | Descripción |
| ------- | ----------- |
| `npm run dev` | Dev server en `http://localhost:5173`. |
| `npm run build` | Build de producción en `dist/`. |
| `npm run preview` | Sirve `dist/` en el puerto 4173. |

---

## 14. Convenciones y decisiones de diseño

- **ESM** en backend y frontend.
- **Capas estrictas**: las rutas no tienen lógica; los servicios no conocen `req`/`res`; solo los
  repositorios escriben SQL.
- **Aislamiento por usuario en el repositorio**, no solo en el controlador: defensa en profundidad.
- **Validación doble**: cliente para UX, servidor como fuente de verdad.
- **Mensajes de login genéricos** para no filtrar qué emails están registrados.
- **Contraseñas nunca se devuelven**; el repositorio solo incluye `password_hash` en login.
- **Rotación de refresh tokens** y revocación global ante reutilización.
- **Cookie httpOnly + SameSite** y access token en memoria.
- **Rate limiting** en auth (20 intentos / 15 min / IP).
- **Errores centralizados** y envelope `{ data }` / `{ error }`.
- **Migraciones inmutables**: cambios nuevos se añaden con otro archivo.
- **Sin ORM, sin TypeScript y sin framework de UI** por decisión del proyecto.

---

## 15. Cómo ampliar el proyecto

### Añadir un recurso nuevo (ej. `projects`)

1. Migración `004_create_projects.sql` con `user_id` y FK.
2. `repositories/projects.repository.js`, `services/projects.service.js`,
   `validators/projects.validator.js`, `controllers/projects.controller.js`,
   `routes/projects.routes.js`.
3. Montar en `routes/index.js` detrás de `requireAuth`.
4. En frontend: `api/projects.api.js`, hook y componentes.
5. Documentar endpoints.

### Añadir roles/permisos

- El JWT ya incluye `role` y la tabla `users` tiene `role`.
- Crear middleware `requireRole('admin')`.
- Aplicarlo a las rutas administrativas.

### Añadir refresh token por dispositivo / cerrar todas las sesiones

- La tabla ya guarda `user_agent`.
- Añadir endpoint `POST /api/auth/logout-all` usando `revokeAllForUser`.

### Añadir tests

- Backend: Vitest + Supertest importando `app.js` y una BD de test; probar registro, login,
  refresh, reuse detection y aislamiento entre usuarios.
- Frontend: Vitest + Testing Library para `LoginPage`, `AuthContext` y `useTasks`.

---

## 16. Verificación realizada

Con un **clúster PostgreSQL temporal** (puerto 55432, ya eliminado) y el servidor en el puerto 3010:

| Prueba | Resultado |
| ------ | --------- |
| Migraciones `001`, `002`, `003` | OK |
| Seed: usuario demo + 3 tareas | OK |
| `GET /api/tasks` sin token | 401 |
| Registro de usuario nuevo | 201, cookie httpOnly y access token |
| Registro con email duplicado | 409 |
| Registro con email/contraseña inválidos | 400 con `details` |
| Login demo correcto | 200, 3 tareas |
| Login con contraseña incorrecta | 401 genérico |
| `GET /api/auth/me` | 200 con el usuario |
| Crear tarea con `priority=urgent` | 201 |
| `PATCH` estado y prioridad | 200 y `updated_at` actualizado |
| Acceso de Ana a una tarea del demo | 404 |
| Refresh con cookie válida | 200 y token rotado |
| Reutilizar un refresh token revocado | 401 + revocación de todas las sesiones |
| Logout | 204 |
| Refresh después del logout | 401 |
| Login/refresh/logout a través del proxy de Vite | OK |
| `npm run build` del frontend | OK (41 módulos) |
| Sintaxis de todos los archivos del backend (`node --check`) | OK |

---

## 17. Próximos pasos sugeridos

- Tests automatizados de auth y aislamiento entre usuarios.
- Verificación de email y recuperación de contraseña.
- Refresh por dispositivo con listado/revocación selectiva.
- React Router y rutas protegidas declarativas.
- Paginación de tareas y filtros combinados en servidor.
- Docker Compose (PostgreSQL + API + frontend) y CI.
- OpenAPI/Swagger y logs estructurados.
- En producción: HTTPS, `COOKIE_SAMESITE=none` si hay dominios distintos, proxy inverso y
  rotación programada de `JWT_ACCESS_SECRET` junto con limpieza de refresh tokens expirados.
