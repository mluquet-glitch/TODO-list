-- 010_protocolos_disparador.sql
-- Añade el campo disparador a los protocolos.

ALTER TABLE protocolos
  ADD COLUMN IF NOT EXISTS disparador VARCHAR(255);

COMMENT ON COLUMN protocolos.disparador IS 'Condición o evento que dispara la ejecución del protocolo';
