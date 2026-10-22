# Gestor de Tareas

Monorepo con backend Node.js + Express + PostgreSQL y frontend React + Vite, con autenticación JWT
y tareas aisladas por usuario.

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

Endpoints principales: `POST /api/auth/register`, `POST /api/auth/login`,
`POST /api/auth/refresh`, `POST /api/auth/logout` y `GET /api/auth/me`.

La documentación completa (estructura, dependencias, responsabilidades, esquema, API y
decisiones) está en [docs/ESTRUCTURA.md](docs/ESTRUCTURA.md). El esquema canónico de la base de
datos está en [docs/Database.sql](docs/Database.sql).
