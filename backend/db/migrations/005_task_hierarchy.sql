-- 005_task_hierarchy.sql
-- La relación padre-hijo ya existe en 002_create_tasks.sql:
--   parent_task_id BIGINT NULL REFERENCES tasks(id) ON DELETE CASCADE
-- Esta migración refuerza la integridad: una tarea no puede ser su propio padre.

ALTER TABLE tasks
  ADD CONSTRAINT chk_tasks_parent_not_self
  CHECK (parent_task_id IS NULL OR parent_task_id <> id);
