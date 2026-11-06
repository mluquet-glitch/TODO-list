-- 013_pasos_orden.sql
-- Añade el campo orden a los pasos de un protocolo para definir su secuencia.
-- Los pasos existentes reciben un orden secuencial según su id actual.

ALTER TABLE pasos
  ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 0;

-- Asigna un orden inicial secuencial a los pasos existentes, agrupados por protocolo.
WITH numerados AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY protocolo_id ORDER BY id ASC) AS nueva_orden
  FROM pasos
)
UPDATE pasos p
SET orden = n.nueva_orden
FROM numerados n
WHERE p.id = n.id;

CREATE INDEX IF NOT EXISTS idx_pasos_orden ON pasos (protocolo_id, orden ASC);

COMMENT ON COLUMN pasos.orden IS 'Posición del paso dentro de la secuencia del protocolo. Se usa para ordenar los pasos al mostrar y ejecutar el protocolo.';
