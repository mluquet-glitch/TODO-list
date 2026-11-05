import { useEffect, useMemo } from 'react';

/**
 * Selección jerárquica de categorías para formularios de tarea.
 * Se usan botones (no checkboxes).
 *
 * Comportamiento:
 * - Inicialmente solo se muestran las categorías raíz, en una fila que
 *   hace wrap cuando no cabe.
 * - Al seleccionar una categoría con hijas, sus subcategorías se añaden
 *   a la misma lista, justo después de ella.
 * - Si una subcategoría está seleccionada, su padre (y abuelos) también
 *   quedan seleccionados y enlazados a la tarea.
 * - Deseleccionar un padre quita también sus hijas seleccionadas.
 * - Cualquier categoría (con o sin hijas) se puede seleccionar/deseleccionar
 *   al hacer clic.
 * - Las subcategorías tienen un fondo distinto al de las categorías padre.
 * - Cada categoría ocupa solo el ancho de su contenido (no el 100%).
 * - `value` es el array de ids actualmente seleccionados.
 * - `onChange` recibe el array completo de ids seleccionados.
 */
export default function CategorySelection({
  categories = [],
  value = [],
  onChange,
}) {
  const { childrenByParent, parentById } = useMemo(() => {
    const children = new Map();
    const parents = new Map();

    for (const category of categories) {
      const parentId = category.parentId ?? null;
      const list = children.get(parentId) ?? [];
      list.push(category);
      children.set(parentId, list);
      parents.set(category.id, parentId);
    }

    return { childrenByParent: children, parentById: parents };
  }, [categories]);

  // Si una categoría hija está seleccionada, sus padres también deben estarlo.
  const normalizedValue = useMemo(
    () => withAncestors(value, parentById),
    [value, parentById],
  );
  const selectedIds = new Set(normalizedValue);

  // Propaga la normalización al formulario para que se guarden los padres.
  useEffect(() => {
    if (normalizedValue.length !== value.length) {
      onChange(normalizedValue);
    }
  }, [normalizedValue, value, onChange]);

  const rootCategories = categories.filter((category) => !category.parentId);

  function toggleCategory(categoryId) {
    const next = new Set(selectedIds);

    if (next.has(categoryId)) {
      next.delete(categoryId);
      removeDescendants(next, categoryId, childrenByParent);
    } else {
      next.add(categoryId);
      addAncestors(next, categoryId, parentById);
    }

    onChange([...next].sort((a, b) => a - b));
  }

  return (
    <div className="category-selection">
      {rootCategories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          depth={0}
          childrenByParent={childrenByParent}
          selectedIds={selectedIds}
          onSelect={toggleCategory}
        />
      ))}
    </div>
  );
}

function addAncestors(target, categoryId, parentById) {
  let parentId = parentById.get(categoryId) ?? null;

  while (parentId != null && parentById.has(parentId)) {
    target.add(parentId);
    parentId = parentById.get(parentId) ?? null;
  }
}

function removeDescendants(target, categoryId, childrenByParent) {
  const children = childrenByParent.get(categoryId) ?? [];
  for (const child of children) {
    target.delete(child.id);
    removeDescendants(target, child.id, childrenByParent);
  }
}

function withAncestors(ids, parentById) {
  const result = new Set(ids);

  for (const id of ids) {
    let parentId = parentById.get(id) ?? null;
    while (parentId != null && parentById.has(parentId)) {
      result.add(parentId);
      parentId = parentById.get(parentId) ?? null;
    }
  }

  return [...result].sort((a, b) => a - b);
}

function CategoryNode({
  category,
  depth,
  childrenByParent,
  selectedIds,
  onSelect,
}) {
  const children = childrenByParent.get(category.id) ?? [];
  const hasChildren = children.length > 0;
  const isSelected = selectedIds.has(category.id);
  const isSubcategory = depth > 0;
  const showChildren =
    hasChildren && (isSelected || hasSelectedDescendant(category));

  function hasSelectedDescendant(node) {
    return (childrenByParent.get(node.id) ?? []).some(
      (child) =>
        selectedIds.has(child.id) || hasSelectedDescendant(child),
    );
  }

  return (
    <>
      <button
        type="button"
        className={`category-button ${
          isSubcategory ? 'category-button--sub' : ''
        } ${isSelected ? 'category-button--active' : ''}`}
        onClick={() => onSelect(category.id)}
        aria-pressed={isSelected}
        aria-expanded={hasChildren ? showChildren : undefined}
      >
        <span
          className="category-button__dot"
          style={{ backgroundColor: category.color }}
          aria-hidden="true"
        />
        <span className="category-button__label">{category.name}</span>
        {hasChildren && (
          <span className="category-button__caret" aria-hidden="true">
            {showChildren ? '▾' : '▸'}
          </span>
        )}
      </button>

      {showChildren &&
        children.map((child) => (
          <CategoryNode
            key={child.id}
            category={child}
            depth={depth + 1}
            childrenByParent={childrenByParent}
            selectedIds={selectedIds}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}
