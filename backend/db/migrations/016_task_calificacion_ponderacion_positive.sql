-- 016_task_calificacion_ponderacion_positive.sql
-- Convierte calificacion y ponderacion a enteros positivos.

-- Primero, rellenar valores nulos con 0
UPDATE tasks SET calificacion = 0 WHERE calificacion IS NULL;
UPDATE tasks SET ponderacion = 0 WHERE ponderacion IS NULL;

ALTER TABLE tasks
  ALTER COLUMN calificacion TYPE INTEGER USING calificacion::INTEGER,
  ALTER COLUMN calificacion SET NOT NULL,
  ALTER COLUMN calificacion SET DEFAULT 0,
  ALTER COLUMN ponderacion TYPE INTEGER USING ponderacion::INTEGER,
  ALTER COLUMN ponderacion SET NOT NULL,
  ALTER COLUMN ponderacion SET DEFAULT 0;

ALTER TABLE tasks
  ADD CONSTRAINT chk_tasks_calificacion_positive CHECK (calificacion >= 0),
  ADD CONSTRAINT chk_tasks_ponderacion_positive CHECK (ponderacion >= 0);

COMMENT ON COLUMN tasks.calificacion IS 'Calificacion de la tarea (entero positivo).';
COMMENT ON COLUMN tasks.ponderacion IS 'Ponderacion (peso) de la tarea (entero positivo).';
