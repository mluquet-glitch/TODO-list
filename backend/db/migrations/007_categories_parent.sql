-- 007_categories_parent.sql
-- Permite que una categoría tenga una categoría padre (autoreferencia).
-- Así se pueden organizar las categorías en jerarquía (árbol).

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id BIGINT NULL;

ALTER TABLE categories
  ADD CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id)
    REFERENCES categories(id)
    ON DELETE SET NULL;

ALTER TABLE categories
  ADD CONSTRAINT chk_categories_parent_not_self
    CHECK (parent_id IS NULL OR parent_id <> id);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id
  ON categories (parent_id);

COMMENT ON COLUMN categories.parent_id IS 'Categoría padre, para organizar en jerarquía. NULL si es categoría raíz.';
