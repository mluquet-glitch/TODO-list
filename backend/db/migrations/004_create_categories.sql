-- 004_create_categories.sql
-- Catálogo de categorías y relación muchos-a-muchos con tareas.
-- Una tarea puede tener varias categorías y una categoría varias tareas.

CREATE TABLE categories (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(80) NOT NULL,
  slug       VARCHAR(80) NOT NULL,
  color      VARCHAR(20) NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_categories_name UNIQUE (name),
  CONSTRAINT uq_categories_slug UNIQUE (slug)
);

COMMENT ON TABLE categories IS 'Catálogo de categorías compartidas por las tareas';

CREATE TABLE task_categories (
  task_id     BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (task_id, category_id),

  CONSTRAINT fk_task_categories_task
    FOREIGN KEY (task_id)
    REFERENCES tasks(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_task_categories_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE CASCADE
);

COMMENT ON TABLE task_categories IS 'Relación N:M entre tareas y categorías';

-- La PK cubre las búsquedas por task_id; este índice cubre las de category_id.
CREATE INDEX idx_task_categories_category ON task_categories (category_id);
