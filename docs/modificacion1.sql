-- =============================================================================
-- Modificación 1: fecha límite por tarea
--
-- Añade una fecha opcional a cada tarea. Se guarda como DATE (sin hora) y se
-- expone en la API como `dueDate` con formato YYYY-MM-DD.
--
-- Uso sobre una base existente:
--   psql -U postgres -d tareas -f docs/modificacion1.sql
--
-- El script es idempotente: se puede ejecutar más de una vez sin error.
-- =============================================================================

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS due_date DATE NULL;

COMMENT ON COLUMN tasks.due_date IS
    'Fecha límite opcional de la tarea, sin hora (formato YYYY-MM-DD)';

CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date
    ON tasks (user_id, due_date);
