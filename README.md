# Gestor de Tareas

Monorepo de ejemplo con backend Node.js + Express + PostgreSQL y frontend React + Vite.

```
backend/    API REST (Express, pg) — http://localhost:3000/api
frontend/   SPA React (Vite)        — http://localhost:5173
docs/       Documentación del proyecto
```

## Inicio rápido

1. Crear una base de datos PostgreSQL llamada `tareas`.
2. Backend:

   ```powershell
   cd backend
   Copy-Item .env.example .env    # ajustar DATABASE_URL
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

Abrir <http://localhost:5173>. La documentación completa (estructura, dependencias,
responsabilidades, API y decisiones) está en
[docs/ESTRUCTURA.md](docs/ESTRUCTURA.md).
