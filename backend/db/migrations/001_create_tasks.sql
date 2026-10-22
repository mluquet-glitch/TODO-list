-- 001_create_tasks.sql
-- Tabla principal de la aplicación, trigger de updated_at e índices de consulta.

-- gen_random_uuid() es nativo desde PostgreSQL 13.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       varchar(120) NOT NULL,
  description text,
  status      varchar(20) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'in_progress', 'done')),
  due_date    date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE tasks IS 'Tareas gestionadas por la aplicación';

-- Mantiene updated_at sincronizado en cada UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_set_updated_at ON tasks;
CREATE TRIGGER tasks_set_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Índices para los filtros y el orden habitual del listado.
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at DESC);
