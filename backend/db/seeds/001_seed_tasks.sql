-- 001_seed_tasks.sql
-- Datos de ejemplo. Solo inserta si la tabla está vacía (idempotente).

INSERT INTO tasks (title, description, status, due_date)
SELECT seed.title, seed.description, seed.status, seed.due_date
FROM (
  VALUES
    ('Configurar el entorno', 'Copiar .env.example a .env y ejecutar las migraciones.', 'done', DATE '2026-10-20'),
    ('Implementar GET /api/tasks', 'Listado con filtros por estado y búsqueda por texto.', 'in_progress', DATE '2026-10-27'),
    ('Añadir autenticación', 'JWT con refresh tokens y roles de usuario.', 'pending', DATE '2026-11-10')
) AS seed (title, description, status, due_date)
WHERE NOT EXISTS (SELECT 1 FROM tasks);
