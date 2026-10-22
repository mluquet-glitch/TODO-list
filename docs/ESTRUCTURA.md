# Estructura del proyecto — Gestor de Tareas

Documentación de la estructura generada para el backend (Node.js + Express + PostgreSQL) y el
frontend (React + Vite).

- [1. Visión general](#1-visión-general)
- [2. Stack y requisitos](#2-stack-y-requisitos)
- [3. Puesta en marcha](#3-puesta-en-marcha)
- [4. Variables de entorno](#4-variables-de-entorno)
- [5. Backend: estructura y responsabilidades](#5-backend-estructura-y-responsabilidades)
- [6. Dependencias del backend](#6-dependencias-del-backend)
- [7. Base de datos](#7-base-de-datos)
- [8. API REST](#8-api-rest)
- [9. Frontend: estructura y responsabilidades](#9-frontend-estructura-y-responsabilidades)
- [10. Dependencias del frontend](#10-dependencias-del-frontend)
- [11. Flujo de una petición](#11-flujo-de-una-petición)
- [12. Comandos disponibles](#12-comandos-disponibles)
- [13. Convenciones y decisiones de diseño](#13-convenciones-y-decisiones-de-diseño)
- [14. Cómo ampliar el proyecto](#14-cómo-ampliar-el-proyecto)
- [15. Verificación realizada](#15-verificación-realizada)
- [16. Próximos pasos sugeridos](#16-próximos-pasos-sugeridos)

---

## 1. Visión general

Monorepo con dos aplicaciones independientes:

```
C:\CODIGO\Tareas
├── backend/      API REST (Express) + acceso a PostgreSQL
├── frontend/    SPA (React + Vite) que consume la API
└── docs/        Esta documentación
```

El frontend nunca habla directamente con PostgreSQL: todas las operaciones pasan por la API.
En desarrollo, Vite hace proxy de `/api` hacia `http://localhost:3000`, de modo que el navegador
solo ve un origen (`http://localhost:5173`) y no hay problemas de CORS.

```
┌──────────────────┐   HTTP/JSON    ┌──────────────────┐   SQL (pg)   ┌──────────────┐
│ React + Vite     │ ─────────────► │ Express (Node.js)│ ───────────► │ PostgreSQL   │
│ localhost:5173   │ ◄───────────── │ localhost:3000   │ ◄─────────── │ tasks        │
└──────────────────┘                └──────────────────┘              └──────────────┘
```

El dominio de ejemplo implementado es **tareas** (`tasks`), suficiente para demostrar el flujo
completo: listado, creación, consulta, actualización parcial y borrado.

---

## 2. Stack y requisitos

| Componente | Tecnología                  | Versión probada |
| ---------- | --------------------------- | --------------- |
| Runtime    | Node.js (ESM)               | 24.18.0         |
| Backend    | Express 4                   | 4.22.3          |
| Driver DB  | `pg` (node-postgres)        | 8.23.1          |
| Base datos | PostgreSQL                  | 16.14           |
| Frontend   | React                       | 19.3.1          |
| Bundler    | Vite                        | 7.3.7           |
| Lenguaje   | JavaScript (sin TypeScript) | —               |

Requisitos mínimos:

- Node.js **20 o superior** (Vite 7 lo exige; el backend usa `node --watch` y `fetch` nativo en el cliente).
- PostgreSQL **13 o superior** (`gen_random_uuid()` es nativo desde la 13).
- Una base de datos vacía llamada, por ejemplo, `tareas`.

No se usa ORM ni generador de código: el acceso a datos es SQL explícito con consultas
parametrizadas.

---

## 3. Puesta en marcha

### 3.1 Crear la base de datos

```powershell
# Con el cliente psql en el PATH
createdb -U postgres tareas
```

También se puede crear desde pgAdmin o con:

```sql
CREATE DATABASE tareas;
```

### 3.2 Backend

```powershell
cd backend
Copy-Item .env.example .env      # Linux/macOS: cp .env.example .env
# Editar .env y ajustar DATABASE_URL con tus credenciales
npm install
npm run db:migrate               # crea tablas, trigger e índices
npm run db:seed                  # (opcional) carga 3 tareas de ejemplo
npm run dev                      # http://localhost:3000/api
```

Comprobar que responde:

```powershell
curl http://localhost:3000/api/health
# {"status":"ok","uptimeSeconds":1,"database":"up","timestamp":"..."}
```

### 3.3 Frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev                      # http://localhost:5173
```

El `.env` del frontend ya viene preparado (`VITE_API_URL=/api` + proxy a `localhost:3000`);
normalmente no hace falta modificarlo en desarrollo.

### 3.4 Orden recomendado

1. PostgreSQL en marcha y base `tareas` creada.
2. `backend`: `.env`, instalación, migraciones y seed.
3. `backend`: `npm run dev`.
4. `frontend`: `.env`, instalación y `npm run dev`.

---

## 4. Variables de entorno

### Backend — `backend/.env`

| Variable       | Obligatoria | Por defecto             | Descripción                                                       |
| -------------- | ----------- | ----------------------- | ----------------------------------------------------------------- |
| `NODE_ENV`     | No          | `development`           | Entorno (`development`, `production`, `test`).                    |
| `PORT`         | No          | `3000`                  | Puerto HTTP de la API.                                            |
| `DATABASE_URL` | Sí\*        | —                       | Cadena de conexión completa. Tiene prioridad sobre las `PG*`.     |
| `PGHOST`       | Sí\*        | —                       | Host de PostgreSQL (solo si no hay `DATABASE_URL`).               |
| `PGPORT`       | No          | `5432`                  | Puerto de PostgreSQL (solo si no hay `DATABASE_URL`).             |
| `PGUSER`       | Sí\*        | —                       | Usuario (solo si no hay `DATABASE_URL`).                          |
| `PGPASSWORD`   | Sí\*        | —                       | Contraseña (solo si no hay `DATABASE_URL`).                       |
| `PGDATABASE`   | Sí\*        | —                       | Nombre de la base (solo si no hay `DATABASE_URL`).                |
| `PGSSL`        | No          | `false`                 | `true` activa SSL (útil en proveedores cloud).                    |
| `CORS_ORIGIN`  | No          | `http://localhost:5173` | Origen(es) permitidos; admite varios separados por coma.          |

\* Se usa `DATABASE_URL` **o** el bloque `PG*`; el arranque falla con un mensaje claro si falta la
configuración elegida.

### Frontend — `frontend/.env`

| Variable             | Por defecto             | Descripción                                                              |
| -------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `VITE_API_URL`       | `/api`                  | URL base que usa el navegador. Con `/api`, Vite aplica el proxy en dev. |
| `VITE_PROXY_TARGET`  | `http://localhost:3000` | Destino del proxy de desarrollo (solo lo lee `vite.config.js`).          |

> En producción se compila con `VITE_API_URL=https://mi-api.com/api` (o se sirve la SPA tras un
> reverse proxy que enrute `/api` al backend) y se configura `CORS_ORIGIN` en el backend con el
> dominio real del frontend.

---

## 5. Backend: estructura y responsabilidades

```
backend/
├── package.json                     Metadatos, scripts y dependencias
├── package-lock.json                Árbol exacto de dependencias (autogenerado)
├── .env.example                     Plantilla de variables de entorno
├── .gitignore                       Excluye node_modules, .env, logs…
├── db/
│   ├── migrations/
│   │   └── 001_create_tasks.sql     Esquema inicial: tabla, trigger e índices
│   └── seeds/
│       └── 001_seed_tasks.sql       Datos de ejemplo idempotentes
├── scripts/
│   ├── migrate.js                   Runner de migraciones con control de aplicadas
│   └── seed.js                      Ejecutor de seeds
└── src/
    ├── index.js                     Punto de entrada: listen + apagado ordenado
    ├── app.js                       Construcción de la app Express y middleware global
    ├── config/
    │   ├── env.js                   Carga y valida variables de entorno
    │   └── db.js                    Pool de pg, query(), checkDatabase(), cierre
    ├── routes/
    │   ├── index.js                 Router raíz de /api + GET /health
    │   └── tasks.routes.js          Rutas REST de /api/tasks
    ├── controllers/
    │   └── tasks.controller.js      Capa HTTP: request → servicio → response
    ├── validators/
    │   └── tasks.validator.js       Validación de body e id (UUID, estados, fechas)
    ├── services/
    │   └── tasks.service.js         Reglas de negocio y errores de dominio (404, 400)
    ├── repositories/
    │   └── tasks.repository.js      SQL de tasks y mapeo snake_case → camelCase
    ├── middlewares/
    │   ├── notFound.js              404 para rutas inexistentes
    │   └── errorHandler.js          Traducción centralizada de errores a JSON
    └── utils/
        ├── ApiError.js              Error operativo con statusCode y detalles
        └── asyncHandler.js          Captura promesas rechazadas → next(error)
```

### Responsabilidad de cada archivo

| Archivo                                | Responsabilidad                                                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/index.js`                         | Arranca el servidor, comprueba la conexión a la base (sin bloquear el arranque), registra manejadores de `SIGINT`/`SIGTERM` y cierra el pool al apagar.                                    |
| `src/app.js`                           | Crea la app Express, desactiva `x-powered-by`, registra `helmet`, `cors`, `express.json`, `morgan`, monta `/api` y añade 404 + error handler. Exporta `app` para testear sin abrir puerto. |
| `src/config/env.js`                    | Carga `.env` con `dotenv` y construye un objeto `env` validado. Falla al arrancar si falta configuración imprescindible (fail fast).                                                       |
| `src/config/db.js`                     | Único `Pool` de conexiones de la app. Expone `query()` parametrizado, `getClient()` para transacciones, `checkDatabase()` y `closePool()`.                                                  |
| `src/routes/index.js`                  | Router de `/api`: define `GET /api/health` (incluye estado de PostgreSQL) y monta el router de tareas.                                                                                      |
| `src/routes/tasks.routes.js`           | Declara los métodos y paths de `/api/tasks` y los asocia a los handlers del controlador.                                                                                                    |
| `src/controllers/tasks.controller.js`  | Lee `req.params`, `req.query` y `req.body`, valida lo que corresponde, llama al servicio y responde con el status y el envelope `{ data }`. No contiene SQL ni reglas de negocio.          |
| `src/validators/tasks.validator.js`    | Valida y normaliza entradas: `title` obligatorio (≤120), `description` (≤1000), `status` en el enum, `dueDate` como `YYYY-MM-DD` y `id` como UUID. Lanza `ApiError` 400 con detalles.      |
| `src/services/tasks.service.js`        | Lógica de negocio: filtros válidos, 404 cuando la tarea no existe, delega persistencia en el repositorio. No conoce `req`/`res`.                                                            |
| `src/repositories/tasks.repository.js` | Todo el SQL de `tasks`: `findAll` (filtros por estado y búsqueda), `findById`, `create`, `update` dinámico y `remove`. Usa siempre parámetros `$1..$n` y mapea filas a camelCase.           |
| `src/middlewares/notFound.js`          | Convierte cualquier request sin ruta coincidente en un `ApiError` 404.                                                                                                                       |
| `src/middlewares/errorHandler.js`      | Único lugar donde se decide el status final. Traduce `ApiError`, errores de PostgreSQL (violaciones de unicidad, FK, CHECK, formato), JSON malformado y errores inesperados (500). Oculta el stack en producción. |
| `src/utils/ApiError.js`                | Clase de error operativo con `statusCode`, `details` y helpers `badRequest`, `notFound`, `conflict`.                                                                                         |
| `src/utils/asyncHandler.js`            | Wrapper para controladores async: reenvía rechazos a `next()` y evita try/catch repetidos.                                                                                                  |
| `db/migrations/001_create_tasks.sql`   | DDL versionado: extensión `pgcrypto`, tabla `tasks` con CHECK de estado, función y trigger `updated_at`, índices por estado y fecha.                                                         |
| `db/seeds/001_seed_tasks.sql`          | Inserta 3 tareas solo si la tabla está vacía (reejecutable).                                                                                                                               |
| `scripts/migrate.js`                   | Crea `schema_migrations`, aplica los `.sql` pendientes en orden alfabético, cada uno en una transacción, y registra el resultado.                                                           |
| `scripts/seed.js`                      | Ejecuta todos los `.sql` de `db/seeds` en orden, cada uno en una transacción.                                                                                                               |

### Capas (de fuera hacia dentro)

```
routes → controllers → validators → services → repositories → PostgreSQL
                              ↘ ApiError → errorHandler → JSON de error
```

- **routes**: solo declara endpoints.
- **controllers**: traduce HTTP ↔ dominio.
- **validators**: entra datos externos, salen datos seguros.
- **services**: reglas del negocio.
- **repositories**: SQL y persistencia.

Esta separación permite cambiar el transporte (por ejemplo, añadir GraphQL o workers) sin tocar
la lógica de negocio, y testear servicios con un repositorio simulado.

---

## 6. Dependencias del backend

### Producción

| Paquete   | Versión instalada | Uso en el proyecto                                                                 |
| --------- | ----------------- | ---------------------------------------------------------------------------------- |
| `express` | 4.22.3            | Framework HTTP, routing y middleware.                                              |
| `pg`      | 8.23.1            | Driver oficial de PostgreSQL: `Pool`, consultas parametrizadas y transacciones.     |
| `dotenv`  | 16.6.1            | Carga `backend/.env` en `process.env` al importar `config/env.js`.                  |
| `cors`    | 2.8.6             | Permite peticiones del origen configurado en `CORS_ORIGIN` (necesario si no hay proxy). |
| `helmet`  | 8.3.0             | Cabeceras HTTP de seguridad (CSP, `X-Content-Type-Options`, etc.).                  |
| `morgan`  | 1.12.1            | Log de peticiones en consola (`dev` en local, `combined` en producción).            |

### Desarrollo

No hay `devDependencies`. El reinicio automático usa `node --watch` (nativo desde Node 18.11),
lo que evita instalar `nodemon` y mantiene el árbol de dependencias pequeño.

### Decisiones

- **Sin ORM**: se pidió JavaScript + `pg`; el SQL explícito hace visibles los índices, los JOIN y
  el coste de cada consulta, y evita una capa de generación adicional.
- **Un solo Pool**: crear un `Pool` por request agotaría las conexiones de PostgreSQL.
- **`cors` se mantiene** aunque en desarrollo se use el proxy de Vite: en producción el frontend
  puede servirse desde otro dominio.
- **Seed y migraciones separados** para no cargar datos de ejemplo en entornos reales.

---

## 7. Base de datos

### Tabla `tasks`

| Columna       | Tipo          | Restricciones                                            |
| ------------- | ------------- | -------------------------------------------------------- |
| `id`          | `uuid`        | PK, `DEFAULT gen_random_uuid()`                          |
| `title`       | `varchar(120)`| `NOT NULL`                                               |
| `description` | `text`        | Nullable                                                 |
| `status`      | `varchar(20)` | `NOT NULL DEFAULT 'pending'`, CHECK `pending/in_progress/done` |
| `due_date`    | `date`        | Nullable                                                 |
| `created_at`  | `timestamptz` | `NOT NULL DEFAULT now()`                                 |
| `updated_at`  | `timestamptz` | `NOT NULL DEFAULT now()`, actualizado por trigger         |

- **Trigger `tasks_set_updated_at`**: ejecuta `set_updated_at()` antes de cada `UPDATE`.
- **Índices**: `idx_tasks_status (status)` para filtros y `idx_tasks_created_at (created_at DESC)`
  para el orden del listado.
- `gen_random_uuid()` requiere `pgcrypto` en PostgreSQL < 13; la migración ejecuta
  `CREATE EXTENSION IF NOT EXISTS pgcrypto` (puede requerir permisos de superusuario la primera vez).

### Control de migraciones

El runner crea:

```sql
CREATE TABLE schema_migrations (
  name       text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
```

Cada archivo de `db/migrations` se aplica una sola vez y queda registrado. Para evolucionar el
esquema se añade un archivo nuevo (nunca se edita uno ya aplicado):

```
db/migrations/002_add_task_priority.sql
```

### Seeds

`db/seeds/001_seed_tasks.sql` inserta datos de ejemplo solo si `tasks` está vacía, por lo que se
puede ejecutar varias veces sin duplicar filas.

---

## 8. API REST

Base: `http://localhost:3000/api`

Todas las respuestas de éxito usan el envelope `{ "data": ... }`.
Los errores usan:

```json
{
  "error": {
    "message": "Datos inválidos",
    "details": ["title es obligatorio"]
  }
}
```

### Endpoints

| Método   | Ruta                | Descripción                                        | Éxito |
| -------- | ------------------- | -------------------------------------------------- | ----- |
| `GET`    | `/health`           | Estado del proceso y de PostgreSQL (`503` si cae). | 200   |
| `GET`    | `/tasks`            | Lista tareas. Filtros: `?status=`, `?search=`.     | 200   |
| `POST`   | `/tasks`            | Crea una tarea. `title` obligatorio.               | 201   |
| `GET`    | `/tasks/:id`        | Obtiene una tarea por UUID.                        | 200   |
| `PATCH`  | `/tasks/:id`        | Actualización parcial de campos.                   | 200   |
| `DELETE` | `/tasks/:id`        | Elimina una tarea.                                 | 204   |

### Cuerpo de `POST /tasks`

```json
{
  "title": "Preparar el despliegue",
  "description": "Revisar variables de entorno y migraciones",
  "status": "pending",
  "dueDate": "2026-11-15"
}
```

- `title`: string 1–120, obligatorio.
- `description`: string ≤1000 o `null`, opcional.
- `status`: `pending` | `in_progress` | `done`, por defecto `pending`.
- `dueDate`: `YYYY-MM-DD` o `null`, opcional.

`PATCH` acepta cualquier subconjunto de esos campos (al menos uno).

### Ejemplos

```powershell
# Listar pendientes que contengan "despliegue"
curl "http://localhost:3000/api/tasks?status=pending&search=despliegue"

# Crear
curl -X POST http://localhost:3000/api/tasks `
  -H "Content-Type: application/json" `
  -d '{"title":"Revisar logs","dueDate":"2026-11-01"}'

# Marcar como completada
curl -X PATCH http://localhost:3000/api/tasks/<uuid> `
  -H "Content-Type: application/json" -d '{"status":"done"}'

# Eliminar
curl -X DELETE http://localhost:3000/api/tasks/<uuid>
```

### Códigos de error

| Código | Cuándo                                                                 |
| ------ | ---------------------------------------------------------------------- |
| 400    | Body inválido, JSON malformado, UUID con formato incorrecto, fecha inválida, estado no permitido. |
| 404    | Tarea o ruta inexistente.                                              |
| 409    | Violación de restricciones (p. ej. unicidad o clave foránea).          |
| 500    | Error inesperado (no se expone el detalle en producción).              |

---

## 9. Frontend: estructura y responsabilidades

```
frontend/
├── index.html                    Documento raíz; monta #root y carga src/main.jsx
├── package.json                  Scripts y dependencias
├── package-lock.json             Árbol exacto de dependencias (autogenerado)
├── vite.config.js                Plugin React, puerto 5173, proxy /api, build
├── .env.example                  Plantilla de variables VITE_*
├── .gitignore                    Excluye node_modules, dist, .env…
└── src/
    ├── main.jsx                  createRoot + StrictMode; importa estilos globales
    ├── App.jsx                   Layout: cabecera, TasksPage y pie
    ├── index.css                 Variables de diseño, layout, componentes y responsive
    ├── api/
    │   ├── client.js             fetch con BASE_URL, JSON y errores uniformes
    │   └── tasks.api.js          Funciones list/get/create/update/remove
    ├── components/
    │   ├── Alert.jsx             Mensaje de error con reintentar/cerrar
    │   ├── TaskForm.jsx          Formulario controlado de alta
    │   ├── TaskItem.jsx          Tarjeta de tarea: estado, vencimiento y borrado
    │   └── TaskList.jsx          Lista, estado de carga y estado vacío
    ├── constants/
    │   └── tasks.js              Estados y etiquetas en español
    ├── hooks/
    │   └── useTasks.js           Estado, carga inicial y CRUD con la API
    └── pages/
        └── TasksPage.jsx         Composición: formulario, resumen, filtros y listado
```

### Responsabilidad de cada archivo

| Archivo                          | Responsabilidad                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                     | HTML base, metadatos y `<div id="root">`.                                                                                                            |
| `vite.config.js`                 | Configura el plugin de React, puerto 5173, proxy `/api` → backend y build con sourcemaps.                                                            |
| `src/main.jsx`                   | Punto de entrada: `createRoot` + `StrictMode` e importación de `index.css`.                                                                           |
| `src/App.jsx`                    | Estructura visual de la aplicación y lectura de `VITE_API_URL` para el pie.                                                                           |
| `src/index.css`                  | Design tokens (colores, radios, sombras), estilos de layout, formulario, tarjetas, badges, alertas y breakpoints.                                     |
| `src/api/client.js`              | Envuelve `fetch`: compone la URL, serializa JSON, maneja 204, convierte errores HTTP/red en `ApiError` con `status` y `details`.                     |
| `src/api/tasks.api.js`           | Endpoints de tareas; construye el query string y desempaqueta `{ data }`. Es la única capa que conoce las rutas de la API.                            |
| `src/constants/tasks.js`         | Enum de estados y etiquetas legibles (`pending` → «Pendiente»).                                                                                      |
| `src/hooks/useTasks.js`          | Hook con `tasks`, `loading`, `saving`, `error`; carga inicial, `createTask`, `updateTask`, `removeTask`, `refresh` y sincronización optimista del estado local. |
| `src/components/Alert.jsx`       | Mensaje accesible (`role="alert"`) con acciones opcionales.                                                                                           |
| `src/components/TaskForm.jsx`    | Formulario controlado con validación local de título, límites de longitud y reset tras crear.                                                          |
| `src/components/TaskItem.jsx`    | Presenta título, descripción, badge, fecha límite (detecta vencidas), selector de estado y borrado con confirmación.                                 |
| `src/components/TaskList.jsx`    | Renderiza la colección o los estados de carga/vacío.                                                                                                  |
| `src/pages/TasksPage.jsx`        | Página principal: usa el hook, calcula contadores y aplica filtros de texto/estado en cliente.                                                        |

### Gestión del estado

No se usa librería de estado global: el estado de las tareas vive en `useTasks`, y `TasksPage`
mantiene únicamente los filtros de la vista. Para una aplicación mayor se podría incorporar
React Query, Zustand o Redux sin cambiar la capa `api/`.

---

## 10. Dependencias del frontend

### Producción

| Paquete      | Versión instalada | Uso                                                    |
| ------------ | ----------------- | ------------------------------------------------------ |
| `react`      | 19.3.1            | Biblioteca de UI y hooks.                              |
| `react-dom`  | 19.3.1            | Renderizado en el DOM (`createRoot`).                  |

### Desarrollo

| Paquete                 | Versión instalada | Uso                                                              |
| ----------------------- | ----------------- | ---------------------------------------------------------------- |
| `vite`                  | 7.3.7             | Servidor de desarrollo, HMR, proxy y build de producción.        |
| `@vitejs/plugin-react`  | 5.2.0             | Transformación JSX y Fast Refresh.                               |

No se incluyen linters ni framework de tests para mantener el esqueleto mínimo; se recomienda
añadir ESLint + Vitest cuando el proyecto crezca (ver [próximos pasos](#16-próximos-pasos-sugeridos)).

---

## 11. Flujo de una petición

Ejemplo: `PATCH /api/tasks/:id` desde el navegador.

1. `TaskItem` dispara `onChange(id, { status })` y `TasksPage` llama a `updateTask` del hook.
2. `useTasks` activa `saving` y llama a `tasksApi.update`, que usa `client.js` (`fetch`).
3. Vite recibe `/api/tasks/:id` y lo reenvía a `http://localhost:3000` (proxy).
4. Express aplica `helmet`, `cors`, `express.json` y `morgan`.
5. `tasks.routes.js` dirige la petición a `tasksController.update`.
6. El controlador valida el UUID y el body con `tasks.validator.js`.
7. `tasks.service.js` llama al repositorio y lanza `ApiError(404)` si no existe.
8. `tasks.repository.js` ejecuta un `UPDATE ... RETURNING` parametrizado.
9. La respuesta vuelve como `{ data: tarea }` y el hook reemplaza esa tarea en el estado.
10. Si algo falla, `asyncHandler` envía el error a `errorHandler`, que responde
    `{ error: { message, details? } }` con el status adecuado; la UI muestra `Alert`.

---

## 12. Comandos disponibles

### Backend (`backend/`)

| Comando             | Descripción                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `npm run dev`       | Servidor con recarga automática (`node --watch`).                 |
| `npm start`         | Servidor sin recarga (modo normal/producción).                    |
| `npm run db:migrate`| Aplica las migraciones pendientes.                                |
| `npm run db:seed`   | Carga los datos de ejemplo.                                       |

### Frontend (`frontend/`)

| Comando           | Descripción                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con HMR en `http://localhost:5173`. |
| `npm run build`   | Build de producción en `dist/`.                          |
| `npm run preview` | Sirve localmente el build de `dist/` (puerto 4173).      |

---

## 13. Convenciones y decisiones de diseño

- **ESM en todo el proyecto** (`"type": "module"`, `import`/`export`), sin `require`.
- **Backend en capas** (routes → controllers → validators → services → repositories) para que la
  lógica de negocio sea independiente de Express y de SQL.
- **SQL parametrizado siempre**: nunca se concatenan valores del usuario en las consultas.
- **Validación en el borde**: el backend valida todo lo que entra aunque el frontend también lo
  haga; el frontend nunca es una garantía de seguridad.
- **Errores centralizados** en `errorHandler`: los controladores no formatean errores a mano.
- **Envelope `{ data }` / `{ error }`** para respuestas predecibles y fáciles de consumir.
- **Fail fast** en configuración: si falta `DATABASE_URL` (o el bloque `PG*`), el backend no arranca.
- **Apagado ordenado**: `SIGINT`/`SIGTERM` cierran el servidor y el pool de conexiones.
- **Fechas sin zona horaria**: `due_date` es `date` y se transporta como `YYYY-MM-DD`; el cliente
  lo parsea como fecha local para no perder un día.
- **Sin ORM ni TypeScript** por decisión del proyecto; el tipado se sustituye con validadores
  explícitos y una estructura predecible.
- **CSS plano con variables**: sin framework de UI ni CSS-in-JS, fácil de reemplazar.
- **`dist/` y `node_modules/` ignorados** en ambos directorios.

---

## 14. Cómo ampliar el proyecto

### Añadir una tabla/recurso nuevo (ej. `projects`)

1. Crear `backend/db/migrations/002_create_projects.sql`.
2. Ejecutar `npm run db:migrate`.
3. Añadir:
   - `src/repositories/projects.repository.js` (SQL)
   - `src/services/projects.service.js` (reglas + 404)
   - `src/validators/projects.validator.js` (entrada)
   - `src/controllers/projects.controller.js` (HTTP)
   - `src/routes/projects.routes.js` y montarlo en `src/routes/index.js`
4. En el frontend: `src/api/projects.api.js`, un hook `useProjects` y los componentes/página.
5. Documentar el nuevo endpoint en esta guía.

### Añadir un campo a `tasks`

1. Nueva migración `002_add_<campo>.sql` con `ALTER TABLE`.
2. Actualizar `FIELD_COLUMNS`, `mapRow` y `create` en el repositorio.
3. Actualizar `parsers` del validador.
4. Añadir el control en `TaskForm` y mostrarlo en `TaskItem`.

### Añadir autenticación

- Middleware `auth.js` que valide JWT y adjunte `req.user`.
- Tabla `users` + relación `tasks.user_id`.
- Rutas `/api/auth/register` y `/api/auth/login`.
- En el frontend, contexto de sesión, formulario de login y `Authorization` en `client.js`.

### Añadir tests

- Backend: `vitest` + `supertest` importando `app.js` (sin abrir puerto) y una base de test o
  repositorios simulados.
- Frontend: `vitest` + Testing Library sobre `TasksPage` y `useTasks`.

---

## 15. Verificación realizada

Se comprobó el proyecto de extremo a extremo con un **clúster PostgreSQL temporal** (puerto 55432,
datos en el directorio temporal del sistema) para no tocar la instalación local del usuario:

| Prueba                                            | Resultado |
| ------------------------------------------------- | --------- |
| `npm install` en backend y frontend               | OK        |
| `npm run db:migrate` (crea tabla, trigger, índices) | OK        |
| `npm run db:seed` (3 tareas, ejecutable 2 veces)   | OK        |
| `GET /api/health`                                  | 200, `database: up` |
| `GET /api/tasks`, filtro `status` y `search`       | 200, resultados correctos |
| `POST /api/tasks` completo y solo con `title`      | 201, `status` por defecto `pending` |
| `POST` con título vacío / estado o fecha inválidos | 400 con `details` |
| `PATCH /api/tasks/:id`                             | 200 y `updated_at` actualizado por el trigger |
| `PATCH` con estado inválido                        | 400 |
| `GET`/`PATCH`/`DELETE` con UUID inválido o inexistente | 400 / 404 |
| `DELETE /api/tasks/:id`                            | 204 y posterior `GET` 404 |
| Ruta inexistente                                   | 404 JSON |
| `npm run dev` del backend (arranque y apagado)     | OK        |
| `npm run build` del frontend                       | OK (38 módulos, sin errores) |
| Servidor Vite + proxy `/api` → backend             | OK (`/` sirve la SPA y `/api/health` responde) |

> Durante la verificación se detectó y corrigió un fallo de validación: al crear una tarea sin
> `status`/`dueDate`, el validador los exigía en lugar de aplicar los valores por defecto.

El clúster temporal y los procesos de prueba se detienen al finalizar; la configuración del
proyecto queda apuntando a `localhost:5432` según `.env.example`.

---

## 16. Próximos pasos sugeridos

- Tests automatizados (Vitest + Supertest en backend, Testing Library en frontend).
- Autenticación y autorización (JWT, roles) y asociación de tareas a usuarios.
- Paginación y orden configurable en `GET /api/tasks`.
- Docker Compose con PostgreSQL + backend + frontend para un entorno reproducible.
- ESLint + Prettier y CI (lint, tests, build) en GitHub Actions.
- Documentación OpenAPI/Swagger servida desde `/api/docs`.
- Observabilidad: logs estructurados (pino), métricas y health checks de infraestructura.
- Variables y migraciones automáticas en el pipeline de despliegue.
