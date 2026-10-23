# Gestor de Tareas

Monorepo con backend Node.js + Express + PostgreSQL y frontend React + Vite, con autenticación JWT,
tareas aisladas por usuario, categorías muchos-a-muchos, fechas límite y filtros dinámicos.

```
backend/    API REST (Express, pg, JWT)  — http://localhost:3000/api
frontend/   SPA React (Vite)             — http://localhost:5173
docs/       Documentación y Database.sql
```

## Inicio rápido

1. Crear una base de datos PostgreSQL llamada `tareas`.
2. Copiar los archivos de entorno desde la raíz:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   # Ajustar DATABASE_URL y JWT_ACCESS_SECRET en backend/.env
   ```

3. Instalar dependencias y preparar la base desde la raíz:

   ```powershell
   npm install
   npm run db:migrate
   npm run db:seed
   ```

4. Arrancar API y frontend a la vez:

   ```powershell
   npm run dev
   ```

`npm run dev` levanta ambos servicios con recarga: la API en <http://localhost:3000/api> y la SPA en <http://localhost:5173>. También puedes arrancarlos por separado con `npm run dev:api` y `npm run dev:web`.

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
- Cada tarea tiene una **fecha límite opcional** (`dueDate`, `YYYY-MM-DD`). Se muestra en la tarjeta
  y se resalta en rojo si está vencida; se edita tanto al crear como en el detalle.
- El botón **Filtros** abre un desplegable con todos los filtros disponibles (estado, prioridad,
  categorías y fecha límite). Se pueden activar varios a la vez, incluso varias categorías o presets
  de fecha; las opciones activas se marcan con ✓ y aparecen como chips. El panel permanece abierto
  para combinar filtros.
- Los presets de fecha son **Vencidas**, **Para hoy**, **Próximos 7 días** y **Sin fecha**.
- Dentro de un mismo tipo los filtros se combinan con OR; entre tipos distintos, con AND. La
  búsqueda por texto se aplica además.
- Los mismos filtros multi-selección están disponibles en la pantalla principal y en el listado de
  subtareas del detalle.
- La API acepta `status`, `priority` y `categoryIds` multi-valor, además de `search`; cada tarea
  incluye `dueDate` en las respuestas.
- El panel **Gestionar categorías** es un acordeón cerrado por defecto y en gris claro. Al abrirlo
  muestra un toggle con todo el catálogo: selecciona una para **Actualizar** o **Eliminar**, escribe
  un nombre y pulsa **Agregar categoría** para crear una nueva. Eliminar pide confirmación y quita
  la categoría de las tareas que la usen.
- El panel **Resumen** también empieza plegado; al abrirlo muestra el total de tareas y el conteo
  por estado.
- **Tareas y subtareas**: una tarea puede tener varias hijas mediante `tasks.parent_task_id`; cada
  hija tiene como máximo un padre y el borrado del padre elimina su descendencia en cascada. La
  base de datos impide que una tarea sea su propio padre.
- El título de cada tarea es un botón que abre su **detalle**: un índice fijo y desplegable en el
  lateral derecho muestra el padre y sus hijas (con la tarea actual en rojo), sigue visible al hacer
  scroll e incluye un botón para volver a la pantalla principal. La vista usa dos columnas: a la
  izquierda, **Editar tarea** y **Gestionar categorías** como acordeones cerrados en gris claro, y
  **Nueva subtarea** abierta con las categorías del padre preseleccionadas; a la derecha, el listado
  de **Subtareas** siempre visible. La tarjeta **Nueva tarea** de la pantalla principal también
  empieza cerrada. La pantalla principal solo muestra las tareas sin padre.
- Cada tarjeta muestra una línea de la descripción y un **toggle de subtareas** que las despliega en
  tonos apagados, con título y parte de la descripción, y permite abrirlas con un clic. Cada
  subtarea incluye un selector para cambiar su estado sin abrir el detalle; el cambio se guarda
  automáticamente en la base de datos.

Endpoints principales: `POST /api/auth/register`, `POST /api/auth/login`,
`POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`, el CRUD de
`/api/categories` y el CRUD de `/api/tasks`.

La documentación completa (estructura, dependencias, responsabilidades, esquema, API y
decisiones) está en [docs/ESTRUCTURA.md](docs/ESTRUCTURA.md). El esquema canónico de la base de
datos está en [docs/Database.sql](docs/Database.sql); para añadir la fecha límite a una base
existente se puede ejecutar el script idempotente
[docs/modificacion1.sql](docs/modificacion1.sql).
