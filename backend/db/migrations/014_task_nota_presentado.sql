-- 014_task_nota_presentado.sql
-- Añade los campos nota y presentado a la tabla de tareas.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS nota TEXT NULL;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS presentado BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tasks_presentado ON tasks (presentado);

COMMENT ON COLUMN tasks.nota IS 'Nota libre adicional de la tarea.';
COMMENT ON COLUMN tasks.presentado IS 'Indica si la tarea ha sido presentada.';
