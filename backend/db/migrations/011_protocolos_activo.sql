-- 011_protocolos_activo.sql
-- Añade el estado activo/inactivo a los protocolos.
-- Los protocolos existentes quedan activos por defecto.

ALTER TABLE protocolos
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN protocolos.activo IS 'Indica si el protocolo está activo y disponible por defecto';

CREATE INDEX IF NOT EXISTS idx_protocolos_activo ON protocolos (activo);
