-- 008_two_task_statuses.sql
-- Reduce los estados de tarea a solo dos: pendiente y completada.

UPDATE tasks
SET status = 'pending'
WHERE status = 'in_progress';

ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS chk_tasks_status;

ALTER TABLE tasks
  ADD CONSTRAINT chk_tasks_status
  CHECK (status IN ('pending', 'done'));
