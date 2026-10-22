-- 002_create_tasks.sql
-- Esquema alineado con docs/Database.sql + propietario (user_id) para aislar
-- las tareas de cada usuario.

CREATE TABLE tasks (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  status         VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority       VARCHAR(50) NOT NULL DEFAULT 'medium',

  -- La tarea padre (subtareas)
  parent_task_id BIGINT NULL,

  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_tasks_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_parent_task
    FOREIGN KEY (parent_task_id)
    REFERENCES tasks(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_tasks_status
    CHECK (status IN ('pending', 'in_progress', 'done')),

  CONSTRAINT chk_tasks_priority
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

COMMENT ON TABLE tasks IS 'Tareas gestionadas por la aplicación, aisladas por usuario';

CREATE TRIGGER tasks_set_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Índices para el listado por usuario y los filtros habituales.
CREATE INDEX idx_tasks_user_created_at ON tasks (user_id, created_at DESC);
CREATE INDEX idx_tasks_user_status ON tasks (user_id, status);
CREATE INDEX idx_tasks_parent_task ON tasks (parent_task_id);
