# Estructura del proyecto — Gestor de Tareas con autenticación JWT

Documentación del monorepo: backend (Node.js + Express + PostgreSQL) y frontend (React + Vite),
incluyendo usuarios, autenticación JWT, aislamiento de tareas por usuario, categorías
muchos-a-muchos y filtros dinámicos.

> Rama: `feature/filtros`. Esquema canónico en [`docs/Database.sql`](Database.sql).

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
├── package.json       Workspaces y scripts raíz (dev, build, db)
├── package-lock.json  Árbol de dependencias del monorepo
├── backend/           API REST (Express) + PostgreSQL + JWT
├── frontend/          SPA (React + Vite) con login y gestión de tareas
└── docs/              Documentación y script de base de datos
```

El frontend nunca habla con PostgreSQL: todo pasa por la API. En desarrollo Vite hace proxy de
`/api` hacia `http://localhost:3000`, por lo que navegador, API y cookie de sesión comparten origen
y no hay problemas de CORS ni de cookies.

```
┌──────────────────┐  HTTP/JSON + JWT  ┌──────────────────┐   SQL (pg)   ┌──────────────┐
│ React + Vite     │ ────────────────► │ Express (Node.js)│ ───────────► │ PostgreSQL   │
│ localhost:5173   │ ◄──────────────── │ localhost:3000   │ ◄─────────── │ users        │
│                  │  cookie httpOnly  │                  │              │ categories   │
└──────────────────┘                   └──────────────────┘              │ tasks        │
                                                                        │ task_categ...│
                                                                        │ refresh_...  │
                                                                        └──────────────┘
```

Características principales:

- Registro y login con contraseñas hasheadas con **bcrypt** (coste 12).
- **Access token JWT** de 15 minutos, enviado como `Authorization: Bearer`.
- **Refresh token opaco** de 7 días en cookie `httpOnly`, con rotación y detección de reutilización.
- Todas las rutas de `/api/tasks` y `/api/categories` requieren autenticación y cada usuario solo
  ve sus tareas.
- **Categorías N:M**: una tarea puede tener varias categorías y una categoría varias tareas.
- **Filtros dinámicos multi-selección**: un desplegable reúne todos los filtros (estado, prioridad,
  categorías y fecha límite). Se pueden activar varios a la vez, incluso varias categorías o presets
  de fecha; las opciones activas se marcan con ✓ y también aparecen como chips. Disponible en la
  pantalla principal y en el listado de subtareas del detalle.
- **Gestión de categorías**: acordeón cerrado por defecto y en gris claro, con un toggle de todas las
  categorías y un formulario para agregar, actualizar y eliminar; Eliminar/Actualizar usan el toggle
  e Agregar usa el input.
- **Resumen**: acordeón cerrado por defecto y en gris claro que, al abrirse, muestra el total de
  tareas y el conteo por estado.
- **Detalle y subtareas**: el título de cada tarea es un botón que abre su detalle. La pantalla usa
  dos columnas: a la izquierda, los acordeones «Editar tarea», «Nueva subtarea» y «Gestionar
  categorías» (solo la nueva subtarea abre desplegada); a la derecha, el listado de subtareas
  siempre visible. La pantalla principal solo muestra las tareas sin padre.
- **Fechas límite**: cada tarea puede tener una fecha opcional que se muestra en la tarjeta y se
  resalta en rojo cuando está vencida; los filtros permiten ver vencidas, para hoy, próximas o sin
  fecha.
- **Tarjetas expandibles**: cada tarjeta muestra una línea de la descripción y un toggle que
  despliega sus subtareas, también con título y descripción recortada, en tonos apagados y
  clicables para abrir su detalle. Cada subtarea incluye un selector de estado que guarda el cambio
  automáticamente en la base de datos.
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

### 3.2 Configurar el entorno

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
# Ajustar DATABASE_URL y, en producción, JWT_ACCESS_SECRET en backend/.env
```

### 3.3 Instalar y arrancar desde la raíz

El repositorio usa npm workspaces: una sola instalación en la raíz resuelve las dependencias de
`backend` y `frontend`.

```powershell
npm install
npm run db:migrate
npm run db:seed          # usuario demo + 3 tareas + 4 categorías
npm run dev              # API :3000 + SPA :5173 en paralelo
```

El script `dev` usa `concurrently`: prefija los logs con `api` y `web` y detiene ambos procesos
cuando uno termina. También se pueden levantar por separado:

```powershell
npm run dev:api          # solo http://localhost:3000/api
npm run dev:web          # solo http://localhost:5173
```

Credenciales del seed:

```
email:    demo@tareas.local
password: Demo1234!
```

Abrir <http://localhost:5173>, iniciar sesión con la cuenta demo o crear una cuenta nueva.

Comprobar la API:

```powershell
curl http://localhost:3000/api/health
curl http://localhost:3000/api/tasks
# -> 401: las tareas requieren autenticación
```

### 3.4 Si ya tenías la base de la versión anterior

El esquema cambió para alinearse con `docs/Database.sql` (ids `BIGSERIAL`, `priority`,
`parent_task_id`, `user_id`, categorías N:M). En un entorno **de desarrollo** sin datos que
conservar:

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
│   │   ├── 003_create_refresh_tokens.sql  Sesiones renovables (hash SHA-256)
│   │   ├── 004_create_categories.sql  Categorías + relación N:M task_categories
│   │   ├── 005_task_hierarchy.sql     CHECK: una tarea no puede ser su propio padre
│   │   └── 006_task_due_date.sql      Fecha límite opcional (DATE) e índice
│   └── seeds/
│       └── 001_seed_tasks.sql       Usuario demo + tareas + categorías de ejemplo
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
    │   ├── index.js                 Router /api: health, auth, categories y tasks (protegidos)
    │   ├── auth.routes.js           Registro, login, refresh, logout y me
    │   ├── categories.routes.js     Catálogo de categorías
    │   └── tasks.routes.js          CRUD de tareas
    ├── controllers/
    │   ├── auth.controller.js       Cookie httpOnly + respuestas de sesión
    │   ├── categories.controller.js Capa HTTP del catálogo
    │   └── tasks.controller.js      Capa HTTP de tareas
    ├── validators/
    │   ├── auth.validator.js        Email, contraseña y nombre
    │   ├── categories.validator.js  Nombre, color e id de categoría
    │   └── tasks.validator.js       Ids, estados, prioridades, fecha, jerarquía y categoryIds
    ├── services/
    │   ├── auth.service.js          bcrypt, sesiones, rotación y reuse detection
    │   ├── categories.service.js    Catálogo y verificación de categorías existentes
    │   └── tasks.service.js         Reglas de negocio, filtros y aislamiento por usuario
    ├── repositories/
    │   ├── users.repository.js      SQL de usuarios
    │   ├── refreshTokens.repository.js  SQL de refresh tokens + rotación transaccional
    │   ├── categories.repository.js SQL del catálogo
    │   └── tasks.repository.js      SQL de tareas + agregación de categorías
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
| `src/routes/index.js` | `GET /api/health`, `/api/auth` público y `/api/categories` + `/api/tasks` protegidos con `requireAuth`. |
| `src/routes/auth.routes.js` | `POST /register`, `/login`, `/refresh`, `/logout` y `GET /me`. Aplica `authLimiter` a registro/login. |
| `src/routes/categories.routes.js` | Declara `GET`, `POST`, `PATCH` y `DELETE` de `/api/categories`. |
| `src/routes/tasks.routes.js` | Declara los endpoints CRUD de tareas. |
| `src/middlewares/auth.js` | Exige `Authorization: Bearer`, verifica firma/expiración/emisor/audiencia y coloca `req.user` (`id`, `email`, `role`). |
| `src/middlewares/rateLimit.js` | Máximo 20 intentos cada 15 minutos en login/registro por IP. |
| `src/controllers/auth.controller.js` | Valida el body, llama al servicio, envía la cookie httpOnly y responde `{ data: { user, accessToken } }`. |
| `src/controllers/categories.controller.js` | Lista, crea, actualiza y elimina categorías; responde `{ data }` (201 al crear, 204 al borrar). |
| `src/controllers/tasks.controller.js` | Lee params/query/body (incluido `categoryIds`), usa `req.user.id` y responde con `{ data }`. |
| `src/validators/auth.validator.js` | Normaliza email (minúsculas, formato, ≤255), exige contraseña de 8–72 con letra y número, y nombre de 2–120. |
| `src/validators/categories.validator.js` | `name` obligatorio al crear (1–80), color hexadecimal opcional y `id` entero positivo. |
| `src/validators/tasks.validator.js` | Ids enteros positivos, `title` ≤255, `description` ≤2000, estados/prioridades permitidos, `dueDate` opcional en `YYYY-MM-DD` (fecha real), `parentTaskId` y `categoryIds` (hasta 20 ids únicos). |
| `src/services/auth.service.js` | Hash bcrypt (coste 12), login con mensaje genérico, creación de sesión, rotación del refresh token y revocación global ante reutilización. |
| `src/services/categories.service.js` | Lista, crea, actualiza y elimina categorías; genera un slug único, evita nombres duplicados (sin distinguir mayúsculas) y valida que los `categoryIds` existan. |
| `src/services/tasks.service.js` | Normaliza filtros multi-valor, 404, validación de la tarea padre (misma persona), categorías existentes y paso del `userId` al repositorio. |
| `src/repositories/users.repository.js` | SQL de usuarios; solo expone `password_hash` en consultas internas de login. |
| `src/repositories/refreshTokens.repository.js` | Alta, búsqueda por hash, rotación atómica (revocar + insertar) y revocación por token/usuario. |
| `src/repositories/categories.repository.js` | SQL del catálogo global: listado, búsqueda por id/nombre/slug, alta, actualización y borrado. |
| `src/repositories/tasks.repository.js` | Todo el SQL de tareas; **cada consulta filtra por `user_id`**, devuelve `due_date` como `YYYY-MM-DD`, agrega categorías con `json_agg` y escribe tarea + relación N:M en transacción. |
| `src/utils/jwt.js` | Firma/verifica el access token con `issuer` y `audience` fijos. |
| `src/utils/tokens.js` | Genera refresh tokens con `randomBytes(48)`, calcula SHA-256 y la fecha de expiración. |
| `src/utils/cookies.js` | Cookie `refresh_token` httpOnly, `SameSite` configurable, `Secure` en producción y `Path=/api/auth`. |
| `src/utils/ApiError.js` | Error operativo con `statusCode`, `details` y helpers (`unauthorized`, `forbidden`, `notFound`, `conflict`). |
| `src/utils/asyncHandler.js` | Reenvía rechazos async a `next()` para el error handler. |
| `db/migrations/*.sql` | DDL versionado del esquema canónico. |
| `db/seeds/001_seed_tasks.sql` | Inserta el usuario demo (hash bcrypt), 4 categorías y sus tareas/asignaciones si no existen. |
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
migraciones. Para una base creada antes de la fecha límite, el cambio puntual está en
[`docs/modificacion1.sql`](modificacion1.sql), que añade `due_date` e índice de forma idempotente.

> `Database.sql` es un script de **inicialización destructivo**: ejecuta
> `DROP TABLE ... CASCADE` sobre `refresh_tokens`, `task_categories`, `tasks`, `categories` y
> `users` antes de crearlas, junto con todos sus índices y triggers. Úsalo para recrear la base
> desde cero; para bases existentes usa `npm run db:migrate`.

### `users`

| Columna | Tipo | Restricciones |
| ------- | ---- | ------------- |
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(120)` | `NOT NULL` |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE`, normalizado a minúsculas en la API |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` (bcrypt) |
| `role` | `VARCHAR(20)` | `NOT NULL DEFAULT 'user'`, CHECK `user/admin` |
| `created_at` / `updated_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP`; trigger en updates |

### `categories`

Catálogo **global** (compartido por todos los usuarios) de etiquetas asignables a las tareas. Está
expuesto por API con CRUD completo (`GET`, `POST`, `PATCH`, `DELETE`) detrás de autenticación; el
seed precarga cuatro categorías. Al borrar una categoría, las asignaciones se eliminan en cascada.

| Columna | Tipo | Restricciones |
| ------- | ---- | ------------- |
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(80)` | `NOT NULL`, `UNIQUE` |
| `slug` | `VARCHAR(80)` | `NOT NULL`, `UNIQUE` |
| `color` | `VARCHAR(20)` | `NOT NULL DEFAULT '#64748b'` (hex para la UI) |
| `created_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |

### `tasks`

| Columna | Tipo | Restricciones |
| ------- | ---- | ------------- |
| `id` | `BIGSERIAL` | PK |
| `user_id` | `BIGINT` | `NOT NULL`, FK → `users(id)` `ON DELETE CASCADE` |
| `title` | `VARCHAR(255)` | `NOT NULL` |
| `description` | `TEXT` | Nullable |
| `status` | `VARCHAR(50)` | default `pending`, CHECK `pending/in_progress/done` |
| `priority` | `VARCHAR(50)` | default `medium`, CHECK `low/medium/high/urgent` |
| `due_date` | `DATE` | Nullable; fecha límite sin hora (`YYYY-MM-DD`) |
| `parent_task_id` | `BIGINT` | Nullable, FK → `tasks(id)` `ON DELETE CASCADE`; CHECK `parent_task_id <> id` |
| `created_at` / `updated_at` | `TIMESTAMP` | trigger `tasks_set_updated_at` |

La relación es **auto-referenciada**: una tarea puede tener muchas hijas y cada hija tiene como
máximo un padre (`parent_task_id`). La FK con `ON DELETE CASCADE` elimina toda la descendencia al
borrar un padre. La migración `005` añade el CHECK que impide que una tarea sea su propio padre.

Índices: `(user_id, created_at DESC)`, `(user_id, status)`, `(user_id, due_date)` y
`(parent_task_id)`. La migración `006` (y el script idempotente
[`modificacion1.sql`](modificacion1.sql)) añaden `due_date` y su índice.

### `task_categories`

Relación **muchos a muchos** entre `tasks` y `categories`.

| Columna | Tipo | Restricciones |
| ------- | ---- | ------------- |
| `task_id` | `BIGINT` | FK → `tasks(id)` `ON DELETE CASCADE`, PK compuesta |
| `category_id` | `BIGINT` | FK → `categories(id)` `ON DELETE CASCADE`, PK compuesta |
| `created_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |

La PK `(task_id, category_id)` evita duplicados y cubre las búsquedas por tarea; el índice
`idx_task_categories_category` cubre las consultas y filtros por categoría. Borrar una tarea o una
categoría elimina sus asignaciones.

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
- Los seeds son idempotentes: el usuario demo usa `ON CONFLICT DO NOTHING`, las tareas solo se
  insertan si el usuario aún no tiene ninguna y las asignaciones de categorías usan
  `ON CONFLICT DO NOTHING`.
- La migración `004_create_categories.sql` añade `categories` y `task_categories`; las bases
  existentes solo necesitan `npm run db:migrate`.
- Para evolucionar el esquema se añade un archivo nuevo (`005_...sql`), nunca se edita uno aplicado.

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
| `GET` | `/categories` | Bearer | Catálogo global de categorías. |
| `POST` | `/categories` | Bearer | Crea una categoría (`name`, `color` opcional). |
| `PATCH` | `/categories/:id` | Bearer | Actualiza nombre y/o color. |
| `DELETE` | `/categories/:id` | Bearer | Elimina la categoría y sus asignaciones (204). |
| `GET` | `/tasks` | Bearer | Lista las tareas del usuario. Filtros: `status`, `priority`, `categoryIds`, `search`. |
| `POST` | `/tasks` | Bearer | Crea una tarea con categorías opcionales. |
| `GET` | `/tasks/:id` | Bearer | Obtiene una tarea propia. |
| `PATCH` | `/tasks/:id` | Bearer | Actualización parcial; `categoryIds` reemplaza las categorías. |
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

### Categorías

```http
GET /api/categories
Authorization: Bearer <accessToken>
```

```json
{
  "data": [
    { "id": 1, "name": "Trabajo", "slug": "trabajo", "color": "#2563eb" },
    { "id": 2, "name": "Personal", "slug": "personal", "color": "#16a34a" }
  ]
}
```

El catálogo es global y requiere sesión. Se usa para el selector del formulario y para las opciones
de categoría del desplegable de filtros.

```http
POST /api/categories
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "name": "Hogar", "color": "#0ea5e9" }
```

```json
201 Created
{ "data": { "id": 5, "name": "Hogar", "slug": "hogar", "color": "#0ea5e9" } }
```

- `name` es obligatorio al crear (1–80 caracteres) y no puede repetirse sin distinguir
  mayúsculas; un duplicado devuelve **409**.
- `color` es opcional y debe ser hexadecimal (`#rrggbb`); por defecto `#64748b`.
- El `slug` se genera automáticamente a partir del nombre y se mantiene único.
- `PATCH` acepta `name`, `color` o ambos. `DELETE` elimina la categoría y sus filas de
  `task_categories`; las tareas siguen existiendo sin esa categoría.

> Las categorías son globales: cualquier usuario autenticado puede gestionarlas y los cambios
> afectan a todos. Restringir la gestión a administradores queda como mejora futura.

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
  "dueDate": "2026-11-15",
  "parentTaskId": null,
  "categoryIds": [1, 3]
}
```

- `status`: `pending` | `in_progress` | `done` (default `pending`).
- `priority`: `low` | `medium` | `high` | `urgent` (default `medium`).
- `dueDate`: fecha límite opcional en `YYYY-MM-DD` o `null`. El backend valida que sea una fecha
  real (rechaza `2026-02-31`) y la API la devuelve siempre sin hora.
- `parentTaskId`: id numérico de una tarea propia o `null` (subtareas). El padre debe existir y
  pertenecer al mismo usuario; una tarea no puede apuntarse a sí misma. `GET /tasks` devuelve todas
  las tareas propias (raíces e hijas) y la pantalla principal filtra las que tienen padre.
- `categoryIds`: array de ids existentes (máximo 20, sin duplicados). En `PATCH` reemplaza por
  completo las categorías; `[]` las vacía. Cada tarea devuelve `categories: [{ id, name, slug,
  color }]`.
- `id` de tarea es **numérico** (`BIGSERIAL`).

```powershell
# Listar tareas pendientes de Trabajo o Estudio que contengan "despliegue"
curl "http://localhost:3000/api/tasks?status=pending&categoryIds=1,3&search=despliegue" `
  -H "Authorization: Bearer <token>"

# Marcar como completada
curl -X PATCH http://localhost:3000/api/tasks/12 `
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" `
  -d '{"status":"done"}'

# Vaciar las categorías
curl -X PATCH http://localhost:3000/api/tasks/12 `
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" `
  -d '{"categoryIds":[]}'
```

#### Filtros multi-valor

- `status` y `priority` aceptan un valor, una lista separada por comas (`status=done,pending`) o
  parámetros repetidos (`status=done&status=pending`). Dentro del mismo filtro se combina con
  **OR**.
- `categoryIds` acepta ids separados por comas o repetidos; una tarea coincide si tiene **alguna**
  de las categorías indicadas.
- Filtros de tipos distintos se combinan con **AND**. `search` sigue siendo un texto libre.
- Los valores inválidos (estado/prioridad desconocidos o ids no numéricos) devuelven **400**.

La interfaz aplica estos mismos criterios en el cliente sobre las tareas ya cargadas, por lo que
los chips responden al instante; la API mantiene los filtros para integraciones externas.

### Errores

| Código | Cuándo |
| ------ | ------ |
| 400 | Body inválido, JSON malformado, id/prioridad/estado no válidos o categoría inexistente. |
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
    │   ├── categories.api.js      Catálogo de categorías
    │   └── tasks.api.js           CRUD de tareas
    ├── context/
    │   └── AuthContext.jsx        Estado de sesión, login/register/logout
    ├── components/
    │   ├── ActiveFilters.jsx      Chips de filtros activos y «Limpiar todo»
    │   ├── Alert.jsx              Mensajes de error accesibles
    │   ├── CategoryManager.jsx    Toggle + formulario CRUD de categorías
    │   ├── FilterDropdown.jsx     Desplegable de filtros multi-selección
    │   ├── FilteredTaskList.jsx   Búsqueda + filtros + listado reutilizable
    │   ├── TaskDetail.jsx         Edición de la tarea abierta y sus categorías
    │   ├── TaskForm.jsx           Alta de tareas y subtareas (parentTaskId)
    │   ├── TaskHierarchyIndex.jsx Índice fijo desplegable (padre/hijas) a la derecha
    │   ├── TaskItem.jsx           Título-botón, badges, estado y borrado
    │   └── TaskList.jsx           Lista, carga y vacío
    ├── constants/
    │   └── tasks.js               Estados y prioridades + etiquetas
    ├── hooks/
    │   ├── useCategories.js       Carga única del catálogo
    │   ├── useTaskFilters.js      Búsqueda y filtros multi-valor compartidos
    │   └── useTasks.js            Estado y CRUD de tareas
    ├── utils/
    │   └── dates.js               Fechas sin hora, formato y detección de vencidas
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
| `src/api/categories.api.js` | Lista, crea, actualiza y elimina categorías; desempaqueta `{ data }`. |
| `src/context/AuthContext.jsx` | Recupera la sesión al cargar con `/auth/refresh`, mantiene `user`, `initializing` y acciones `login`/`register`/`logout`. |
| `src/pages/LoginPage.jsx` | Pestañas login/registro, validación local, errores de API, estado de envío y credenciales demo. |
| `src/pages/TasksPage.jsx` | Hook de tareas, tarea abierta, contadores, búsqueda, filtros, gestión de categorías y separación entre tareas raíz e hijas. |
| `src/hooks/useTasks.js` | Carga inicial y operaciones CRUD con `saving`/`error`; sincroniza la lista y replica en memoria el borrado en cascada de las subtareas. |
| `src/hooks/useCategories.js` | Carga el catálogo y expone `categories`, `loading`, `saving`, `error` y las acciones CRUD; mantiene la lista ordenada. |
| `src/hooks/useTaskFilters.js` | Encapsula búsqueda, filtros activos, grupos de opciones y el filtrado OR/AND. Permite varios estados, prioridades, categorías y presets de fecha límite a la vez. |
| `src/utils/dates.js` | Trabaja con `YYYY-MM-DD` sin desfases de zona horaria: parseo local, suma de días, formato español y detección de tareas vencidas. |
| `src/components/CategoryManager.jsx` | Acordeón cerrado por defecto con toggle de todas las categorías + input y botones Agregar/Eliminar/Actualizar. Seleccionar un toggle rellena el input; Eliminar y Actualizar usan la categoría seleccionada e Agregar usa el texto. |
| `src/components/FilterDropdown.jsx` | Botón «Filtros» + panel agrupado (estado, prioridad, categoría, fecha límite). Cada opción se activa/desactiva con `aria-pressed` y ✓; el panel permanece abierto para combinar varias. |
| `src/components/FilteredTaskList.jsx` | Barra de búsqueda, desplegable, chips, listado y contador; se usa tanto en la pantalla principal como en las subtareas del detalle. |
| `src/components/ActiveFilters.jsx` | Botones/chips de los filtros activos; al pulsarlos se retiran y su opción deja de estar marcada en el desplegable. |
| `src/components/TaskForm.jsx` | Formulario plegable con título, descripción, fecha límite, estado, prioridad y categorías. Acepta `parentTaskId`, `initialCategoryIds`, `heading`, `submitLabel` y `defaultOpen`; al crear subtareas precarga las categorías del padre. |
| `src/components/TaskDetail.jsx` | Tarjeta plegable de edición de la tarea abierta: título, descripción, fecha límite, estado, prioridad, categorías, guardado y borrado; empieza cerrada. |
| `src/components/TaskHierarchyIndex.jsx` | Índice lateral fijo con la tarea padre (la propia si es raíz) y todas sus hijas directas; incluye un botón para volver a la pantalla principal, la tarea abierta se marca en rojo, cada entrada permite navegar y el panel se abre/cierra sin perder la posición al hacer scroll. |
| `src/components/TaskItem.jsx` | Título-botón, vista previa de descripción en una línea, fecha límite (en rojo si está vencida), badges, toggle de subtareas clicables con selector de estado persistente y acciones de estado/borrado. |
| `src/components/TaskList.jsx` | Agrupa las hijas por `parentTaskId` y renderiza la lista o los estados de carga/vacío; reenvía la apertura del detalle. |
| `src/components/Alert.jsx` | Mensaje `role="alert"` con reintentar/cerrar. |
| `src/constants/tasks.js` | Enums y etiquetas en español. |
| `src/index.css` | Tokens de diseño, layout, formularios, tarjetas, login, badges y responsive. |

### Filtros en la interfaz

- El botón **Filtros** abre un desplegable con todos los valores filtrables del catálogo y los
  enums: estado, prioridad, categorías (de `GET /api/categories`) y fecha límite.
- Cada opción se puede **activar y desactivar** sin cerrar el panel. Las activas se marcan con ✓ y
  se añaden como chips; el contador del botón refleja cuántos filtros hay activos. Se pueden tener
  varias opciones del mismo tipo a la vez, incluidas **varias categorías**.
- Al pulsar un chip activo se retira ese filtro y su opción deja de estar marcada. «Limpiar todo»
  retira todos los chips a la vez.
- El grupo **Fecha límite** ofrece presets: `Vencidas` (fecha pasada y tarea no completada),
  `Para hoy`, `Próximos 7 días` y `Sin fecha`. Se combinan con OR entre sí.
- Dentro del mismo tipo los valores se combinan con **OR** (p. ej. `pending` o `in_progress`, varias
  categorías o varios presets de fecha); entre tipos distintos, con **AND** (estado + prioridad +
  categoría + fecha). La búsqueda por texto se aplica además como AND.
- `FilteredTaskList` + `useTaskFilters` aplican la misma lógica en la pantalla principal y en el
  listado de subtareas del detalle. El filtrado se hace en el cliente sobre las tareas ya cargadas,
  por lo que no hay peticiones adicionales al cambiar de filtro.

### Detalle y subtareas

- En el listado, el título de cada tarea es un `<button>`; al pulsarlo `TasksPage` guarda su id y
  sustituye la vista principal por la pantalla de detalle.
- En el lateral derecho hay un **índice de jerarquía fijo y desplegable**: el botón «Índice»
  permanece visible al hacer scroll y abre un panel con la tarea padre (o la propia tarea si es
  raíz) y todas sus hijas directas. Cada entrada es un botón para navegar y la tarea abierta se
  resalta en rojo. El panel incluye el botón **← Volver a la pantalla principal**, se cierra con su
  botón ×, con `Escape` o haciendo clic fuera; en móvil ocupa el ancho disponible y el disparador
  pasa a la esquina inferior derecha.
- La pantalla se divide en dos columnas (`task-detail-page__columns`): la izquierda agrupa los
  formularios y la derecha el listado de subtareas. En pantallas estrechas (≤ 820 px) las columnas
  pasan a apilarse.
- En la columna izquierda aparece la tarjeta **Editar tarea** (datos y categorías), plegada por
  defecto. Al abrirla muestra sus campos; al cerrarla, la tarjeta queda en gris claro.
- Debajo aparece el mismo `TaskForm` de alta, configurado con `parentTaskId`, `heading`,
  `submitLabel`, `initialCategoryIds` y `defaultOpen`. Es la única sección que abre desplegada al
  entrar en el detalle: muestra las categorías de la tarea padre ya marcadas y las conserva al
  limpiarse después de crear cada subtarea.
- La nueva subtarea queda enlazada al padre y también recibe esas categorías en la API, porque el
  formulario envía la selección precargada salvo que el usuario la modifique.
- Más abajo se reutiliza `CategoryManager` como tercer acordeón de la izquierda, cerrado por
  defecto y con el mismo fondo gris. Sus operaciones actualizan el catálogo global y los formularios
  de la pantalla.
- La columna derecha muestra **Subtareas (N)** como tarjeta fija, sin acordeón. Se listan siempre
  las hijas directas de la tarea abierta, con su propia barra de búsqueda y los mismos filtros
  multi-selección; sus títulos también abren su propio detalle. El botón de volver regresa al padre
  si existe o al listado principal. Los filtros se reinician al cambiar de tarea.
- La pantalla principal calcula `rootTasks = tasks.filter(parentTaskId === null)`; los contadores,
  filtros y búsqueda trabajan sobre esas tareas raíz. Las hijas se ven en el detalle de su padre.
- Al guardar, `useTasks` actualiza la tarea en memoria y el detalle refleja los cambios sin recargar.
  Al borrar, la API elimina la descendencia por cascada y el hook retira también esas tareas de su
  estado local.

### Gestión de categorías

- La tarjeta **Gestionar categorías** empieza plegada y en gris claro. Al abrirla muestra un toggle
  con todo el catálogo. La selección es única: al pulsar una categoría se marca y su nombre se copia
  al input; al volver a pulsarla se deselecciona.
- **Agregar categoría** usa exclusivamente el texto del input.
- **Actualizar** usa la categoría seleccionada en el toggle y el texto del input como nuevo nombre.
- **Eliminar** usa la categoría seleccionada, pide confirmación y elimina también sus asignaciones.
- Tras cualquier operación, el catálogo se actualiza en memoria: el formulario de tareas, los badges
  y el desplegable de filtros reflejan los cambios. Si se borra una categoría marcada en el
  formulario de tareas o usada como filtro activo, esa selección se retira automáticamente.

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

### Crear una tarea o subtarea

1. En la pantalla principal, la tarjeta **Nueva tarea** empieza plegada y en gris claro; al abrirla,
   `TaskForm` → `useTasks.createTask` → `tasksApi.create`.
2. `POST /api/tasks` con Bearer, `dueDate`, `categoryIds` y, si es una subtarea, `parentTaskId`.
3. `requireAuth` → controlador → validador (incluida la fecha real) → servicio (valida que el padre
   sea del usuario y que las categorías existan) → repositorio.
4. El repositorio abre una transacción, inserta la tarea, inserta las filas de `task_categories` y
   devuelve la tarea con `categories` agregadas; el hook la añade al estado. En la vista principal
   no aparece si tiene padre; en el detalle del padre sí.

### Abrir el detalle y editar

1. `TaskItem` renderiza el título como botón y llama `onOpen(task.id)`.
2. `TasksPage` guarda `selectedTaskId`; si existe, renderiza `TaskDetail` arriba, el `TaskForm` de
   subtareas debajo y el listado de hijas al final.
3. `TaskDetail` guarda con `PATCH /api/tasks/:id` (incluye `dueDate` y `categoryIds`), y `useTasks`
   actualiza esa tarea en el array.
4. El botón de volver regresa al padre (si la tarea abierta es una subtarea) o a la lista principal.

### Gestionar una categoría

1. `CategoryManager` recibe el catálogo de `useCategories` y lo pinta como toggle de selección única.
2. Al seleccionar, copia el nombre al input; **Agregar** valida el input y llama `POST /categories`.
3. **Actualizar** llama `PATCH /categories/:id` con el id seleccionado y el texto del input.
4. **Eliminar** confirma y llama `DELETE /categories/:id`; la FK elimina las asignaciones.
5. `useCategories` actualiza su estado con la respuesta, y `TasksPage` sincroniza el formulario, los
   badges, el desplegable de filtros y los chips activos.

### Añadir y quitar filtros

1. `useCategories` carga una vez el catálogo y `useTaskFilters` construye los grupos (estado,
   prioridad, categoría y fecha límite).
2. Al elegir una opción, `useTaskFilters` la guarda en `activeFilters`; `FilterDropdown` mantiene
   todas las opciones visibles y marca las activas con ✓.
3. `ActiveFilters` pinta un chip por filtro; al pulsarlo se elimina del estado y su opción deja de
   estar marcada.
4. `visibleTasks` recalcula en memoria: OR dentro de cada tipo y AND entre tipos, más la búsqueda.
   Las fechas se comparan como `YYYY-MM-DD` para evitar desfases horarios.

---

## 13. Comandos disponibles

### Raíz del monorepo

| Comando | Descripción |
| ------- | ----------- |
| `npm install` | Instala las dependencias de todos los workspaces. |
| `npm run dev` | Levanta API y frontend en paralelo con recarga. |
| `npm run dev:api` | Levanta solo la API. |
| `npm run dev:web` | Levanta solo el frontend. |
| `npm run build` | Build de producción del frontend. |
| `npm start` | Arranca la API sin recarga. |
| `npm run db:migrate` | Aplica migraciones pendientes. |
| `npm run db:seed` | Carga usuario demo, tareas y categorías. |

### Backend (`backend/`)

| Comando | Descripción |
| ------- | ----------- |
| `npm run dev` | Servidor con recarga (`node --watch`). |
| `npm start` | Servidor sin recarga. |
| `npm run db:migrate` | Aplica migraciones pendientes. |
| `npm run db:seed` | Carga usuario demo, tareas y categorías. |

### Frontend (`frontend/`)

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
- **Catálogo global de categorías**: compartido por todos los usuarios; cada uno decide qué
  asignar a sus tareas. El CRUD está disponible para cualquier sesión autenticada.
- **Gestión con toggle único**: el toggle selecciona la categoría sobre la que actúan Eliminar y
  Actualizar; el input alimenta Agregar y Actualizar. El borrado se confirma y cae en cascada.
- **N:M con tabla puente** `task_categories` y PK compuesta; integridad garantizada por FKs.
- **Jerarquía auto-referenciada**: `tasks.parent_task_id` permite muchas hijas por padre y un solo
  padre por hija. La FK usa `ON DELETE CASCADE`; el CHECK impide el auto-parentesco y la API valida
  que el padre sea del mismo usuario. La navegación del detalle se resuelve con estado (`selectedTaskId`),
  sin añadir router.
- **Pantalla principal solo con raíces**: el cliente filtra `parentTaskId === null`; el detalle
  muestra las hijas directas y permite navegar a su propio detalle.
- **Filtros multi-valor**: OR dentro del mismo tipo, AND entre tipos; búsqueda de texto aparte.
- **Filtrado en cliente** sobre las tareas cargadas para que los chips sean instantáneos; la API
  expone los mismos filtros para otros clientes.
- **Migraciones inmutables**: cambios nuevos se añaden con otro archivo.
- **Sin ORM, sin TypeScript y sin framework de UI** por decisión del proyecto.

---

## 15. Cómo ampliar el proyecto

### Añadir un recurso nuevo (ej. `projects`)

1. Una migración nueva (la siguiente sería `006_create_projects.sql`) con `user_id` y FK.
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

La verificación se hizo con **clústeres PostgreSQL temporales** (puertos 55434/55435/55436, ya
eliminados) y la API en los puertos 3011/3012/3013:

| Prueba | Resultado |
| ------ | --------- |
| Migraciones `001`–`006` sobre base limpia | OK; `due_date DATE` e índice `(user_id, due_date)` |
| Seed: usuario demo + 3 tareas + 4 categorías + 4 asignaciones | OK |
| `GET /api/categories` autenticado | 200, 4 categorías con id/name/slug/color |
| `GET /api/categories` sin token | 401 |
| Crear categoría con nombre y color | 201, slug generado y color normalizado |
| Nombre duplicado sin distinguir mayúsculas | 409 |
| Nombre vacío, >80 o color inválido | 400 |
| Actualizar nombre y color | 200; el slug se regenera |
| Actualizar a un nombre existente | 409 |
| `PATCH` vacío, id inválido o categoría inexistente | 400/400/404 |
| Categoría renombrada en una tarea asignada | la tarea y el filtro reflejan el nuevo nombre |
| Eliminar categoría asignada | 204; la tarea queda sin esa categoría (cascade) |
| Eliminar sin token / inexistente / id inválido | 401/404/400 |
| `GET /api/tasks` incluye `categories[]` por tarea | OK |
| Tarea JWT con 2 categorías (Trabajo + Urgente) | OK |
| Crear tarea con `categoryIds` | 201 y 2 categorías ordenadas |
| `PATCH` con `categoryIds` | reemplaza por completo |
| `PATCH` con `categoryIds: []` | vacía las categorías |
| `PATCH` solo con `categoryIds` | 200 sin tocar el resto de campos |
| Categoría inexistente al crear/actualizar | 400 |
| `categoryIds` con formato inválido | 400 |
| `PATCH` sin campos | 400 |
| Filtro `status`, repetido y separado por comas | OR correcto |
| Filtro `priority` | OK |
| Filtro `categoryIds` y dos categorías | OR correcto |
| `status` + `categoryIds` | AND correcto |
| Filtro `search` | OK |
| Filtros inválidos (`status`, `categoryIds`) | 400 |
| Segundo usuario: lista vacía y catálogo visible | OK |
| Segundo usuario: leer/modificar/borrar tarea ajena | 404 |
| Borrar tarea propia | 204 y deja de existir |
| Crear padre + hija A + hija B con `parentTaskId` | 201 y `parentTaskId` correcto |
| Editar una hija (título, estado, prioridad y categorías) | 200 y datos actualizados |
| Una tarea como su propio padre | 400 |
| Usar como padre una tarea de otro usuario | 400 |
| Crear una nieta (anidación) | 201 |
| Borrar el padre con dos hijas y una nieta | 204 y cascada completa (GET hijas → 404) |
| `UPDATE tasks SET parent_task_id = id` directo en PostgreSQL | bloqueado por `chk_tasks_parent_not_self` |
| Crear tarea con `dueDate` | 201 y `dueDate` devuelto como `YYYY-MM-DD` |
| `PATCH` con `dueDate: null` | 200 y fecha borrada |
| `dueDate` con `2026-02-31` | 400; la fecha debe existir en el calendario |
| Tarjetas con fecha y sin fecha | fecha formateada en español; «Sin fecha» no muestra línea |
| Tarea pendiente con fecha pasada | línea en rojo «Venció el …» |
| Índice de jerarquía fijo a la derecha | posición fija comprobada tras hacer scroll; abre/cierra con botón, `Escape` y clic fuera |
| Botón «Volver a la pantalla principal» del índice | cierra el detalle y restaura el listado principal |
| Formulario de subtarea con padre categorizado | abre con las categorías del padre marcadas y las conserva tras crear |
| Selector de estado en la lista desplegada de subtareas | actualiza la interfaz y persiste el nuevo estado vía `PATCH /api/tasks/:id` |
| Acordeones «Nueva tarea» y «Editar tarea» | cerrados por defecto; abren sus campos y recuperan el fondo blanco |
| Acordeón «Nueva subtarea» | abierto por defecto en la columna izquierda del detalle |
| Listado «Subtareas» del detalle | visible siempre en la columna derecha, sin toggle |
| Acordeón «Gestionar categorías» | cerrado por defecto; reutilizado en la pantalla principal y en la columna izquierda del detalle |
| Acordeón «Resumen» | cerrado por defecto; al abrirlo muestra el total y el conteo por estado |
| Índice en móvil (390 px) | panel dentro del viewport; disparador en la esquina inferior derecha |
| Tarea completada con fecha pasada | no se marca como vencida |
| Filtros `Vencidas`, `Para hoy`, `Próximos 7 días` y `Sin fecha` | resultados correctos |
| OR entre `Vencidas` y `Sin fecha` | muestra ambas categorías de fecha |
| Alta y edición de fecha desde la interfaz | tarjeta y `#detail-due-date` actualizados |
| Desplegable de subtareas tras añadir fechas | sigue mostrando título y descripción |
| `docs/modificacion1.sql` ejecutado dos veces | OK; añade columna e índice de forma idempotente |
| `docs/Database.sql` ejecutado dos veces | OK; 5 tablas y 17 índices |
| Seed sobre el esquema de `Database.sql` | OK (3 tareas, 4 categorías, 4 asignaciones) |
| `npm run build` del frontend | OK (51 módulos) |
| Sintaxis de todos los archivos del backend (`node --check`, 30 archivos) | OK |

Suite funcional previa: **44 comprobaciones de tareas/categorías + 34 de CRUD de categorías + 26 de
jerarquía y cascada, 0 fallos**. La verificación de fecha añadió las comprobaciones de la tabla
anterior, también sin fallos.

---

## 17. Próximos pasos sugeridos

- Tests automatizados de auth, categorías y aislamiento entre usuarios.
- Verificación de email y recuperación de contraseña.
- Refresh por dispositivo con listado/revocación selectiva.
- React Router y rutas protegidas declarativas.
- Paginación de tareas; mover el filtrado a servidor si el volumen crece.
- Restringir la gestión del catálogo global a administradores (`requireRole('admin')`).
- Docker Compose (PostgreSQL + API + frontend) y CI.
- OpenAPI/Swagger y logs estructurados.
- En producción: HTTPS, `COOKIE_SAMESITE=none` si hay dominios distintos, proxy inverso y
  rotación programada de `JWT_ACCESS_SECRET` junto con limpieza de refresh tokens expirados.
