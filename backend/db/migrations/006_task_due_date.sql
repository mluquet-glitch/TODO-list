-- 006_task_due_date.sql
-- Añade la fecha límite opcional (DATE) a las tareas.

ALTER TABLE tasks
  ADD COLUMN due_date DATE NULL;

COMMENT ON COLUMN tasks.due_date IS
  'Fecha límite opcional de la tarea, sin hora (formato YYYY-MM-DD)';

CREATE INDEX idx_tasks_user_due_date ON tasks (user_id, due_date);
