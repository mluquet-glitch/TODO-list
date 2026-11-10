-- 015_task_calificacion_ponderacion.sql
-- Renombra la columna nota a calificacion y agrega ponderacion (entero).

ALTER TABLE tasks
  RENAME COLUMN nota TO calificacion;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS ponderacion INTEGER NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_ponderacion ON tasks (ponderacion);

COMMENT ON COLUMN tasks.calificacion IS 'Calificacion de la tarea.';
COMMENT ON COLUMN tasks.ponderacion IS 'Ponderacion (peso) de la tarea.';
