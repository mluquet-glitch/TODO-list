-- 001_seed_tasks.sql
-- Datos de ejemplo idempotentes: usuario demo + sus tareas.
--
-- Credenciales de demostración:
--   email:    demo@tareas.local
--   password: Demo1234!
--
-- El hash corresponde a bcrypt con coste 12.

INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Usuario Demo',
  'demo@tareas.local',
  '$2b$12$8VPw9MiTLfG7VsD8s5Yw2.7XACe0UqPIc9/WGSgvf9zLocHMOG4N2',
  'user'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority)
SELECT u.id, seed.title, seed.description, seed.status, seed.priority
FROM (
  VALUES
    ('Configurar el entorno', 'Copiar .env.example a .env y ejecutar las migraciones.', 'done', 'high'),
    ('Implementar autenticación JWT', 'Registro, login, refresh y logout con cookies httpOnly.', 'in_progress', 'urgent'),
    ('Añadir filtros por prioridad', 'Permitir filtrar el listado por prioridad desde la interfaz.', 'pending', 'medium')
) AS seed (title, description, status, priority)
CROSS JOIN users u
WHERE u.email = 'demo@tareas.local'
  AND NOT EXISTS (SELECT 1 FROM tasks WHERE user_id = u.id);
