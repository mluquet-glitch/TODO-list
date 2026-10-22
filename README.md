# Gestor de Tareas

Monorepo con backend Node.js + Express + PostgreSQL y frontend React + Vite, con autenticación JWT,
tareas aisladas por usuario, categorías muchos-a-muchos y filtros dinámicos.

```
backend/    API REST (Express, pg, JWT)  — http://localhost:3000/api
frontend/   SPA React (Vite)             — http://localhost:5173
docs/       Documentación y Database.sql
```

## Inicio rápido

1. Crear una base de datos PostgreSQL llamada `tareas`.
2. Backend:

   ```powershell
   cd backend
   Copy-Item .env.example .env    # ajustar DATABASE_URL y JWT_ACCESS_SECRET
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

3. Frontend (en otra terminal):

   ```powershell
   cd frontend
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```

Abrir <http://localhost:5173>.

### Cuenta de demostración

```
email:    demo@tareas.local
password: Demo1234!
```

También puedes crear una cuenta nueva desde la pantalla de registro.

## Autenticación

- Registro y login con contraseñas bcrypt.
- Access token JWT de 15 minutos (`Authorization: Bearer`).
- Refresh token en cookie `httpOnly` con rotación y detección de reutilización.
- Logout real y rate limiting en login/registro.
- Cada usuario solo puede ver y modificar sus propias tareas.

## Tareas, categorías y filtros

- Cada tarea puede tener **varias categorías** (relación N:M con `task_categories`) y una categoría
  puede estar en varias tareas.
- El formulario permite seleccionar varias categorías; las tarjetas muestran sus badges de color.
- El botón **Filtros** abre un desplegable con todos los filtros disponibles (estado, prioridad y
  categorías). Se pueden activar varios a la vez, incluso varias categorías; las opciones activas se
  marcan con ✓ y aparecen como chips. El panel permanece abierto para combinar filtros.
- Dentro de un mismo tipo los filtros se combinan con OR; entre tipos distintos, con AND. La
  búsqueda por texto se aplica además.
- Los mismos filtros multi-selección están disponibles en la pantalla principal y en el listado de
  subtareas del detalle.
- La API acepta `status`, `priority` y `categoryIds` multi-valor, además de `search`.
- El panel **Gestionar categorías** muestra un toggle con todo el catálogo: selecciona una para
  **Actualizar** o **Eliminar**, escribe un nombre y pulsa **Agregar categoría** para crear una
  nueva. Eliminar pide confirmación y quita la categoría de las tareas que la usen.
- **Tareas y subtareas**: una tarea puede tener varias hijas mediante `tasks.parent_task_id`; cada
  hija tiene como máximo un padre y el borrado del padre elimina su descendencia en cascada. La
  base de datos impide que una tarea sea su propio padre.
- El título de cada tarea es un botón que abre su **detalle**: un índice superior muestra el padre y
  sus hijas (con la tarea actual en rojo), se editan sus datos y categorías, se crean subtareas
  enlazadas y se listan sus hijas directas. La pantalla principal solo muestra las tareas sin padre.

Endpoints principales: `POST /api/auth/register`, `POST /api/auth/login`,
`POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`, el CRUD de
`/api/categories` y el CRUD de `/api/tasks`.

La documentación completa (estructura, dependencias, responsabilidades, esquema, API y
decisiones) está en [docs/ESTRUCTURA.md](docs/ESTRUCTURA.md). El esquema canónico de la base de
datos está en [docs/Database.sql](docs/Database.sql).
