import { useMemo, useState } from 'react';

/**
 * Selección jerárquica de categorías para formularios de tarea.
 * Se usan botones (no checkboxes).
 *
 * Comportamiento:
 * - Inicialmente solo se muestran las categorías raíz en fila horizontal.
 * - Al hacer clic en una categoría raíz se expanden sus subcategorías
 *   como botones seleccionables a su derecha.
 * - Si una subcategoría tiene hijas, al hacer clic en ella se expanden sus hijas.
 * - Cada categoría (padre o hija) es un botón que se puede seleccionar como
 *   categoría de la tarea.
 * - `value` es el array de ids actualmente seleccionados.
 * - `onChange` recibe el array completo de ids seleccionados.
 */
export default function CategorySelection({
  categories = [],
  value = [],
  onChange,
}) {
  const selectedIds = new Set(value);
  const [expandedId, setExpandedId] = useState(null);

  const childrenByParent = useMemo(() => {
    const map = new Map();
    for (const category of categories) {
      const parentId = category.parentId ?? null;
      const list = map.get(parentId) ?? [];
      list.push(category);
      map.set(parentId, list);
    }
    return map;
  }, [categories]);

  const rootCategories = categories.filter((category) => !category.parentId);

  function toggleCategory(categoryId) {
    const next = new Set(selectedIds);
    if (next.has(categoryId)) {
      next.delete(categoryId);
    } else {
      next.add(categoryId);
    }
    onChange([...next].sort((a, b) => a - b));
  }

  function toggleExpand(categoryId) {
    setExpandedId((current) => (current === categoryId ? null : categoryId));
  }

  const expandedCategoryId = expandedId;

  return (
    <div className="category-selection">
      <div className="category-selection__row">
        {rootCategories.map((category) => (
          <div key={category.id} className="category-selection__group">
            <button
              type="button"
              className={`category-button ${
                selectedIds.has(category.id) ? 'category-button--active' : ''
              } ${expandedCategoryId === category.id ? 'category-button--expanded' : ''}`}
              onClick={() => toggleExpand(category.id)}
            >
              <span
                className="category-button__dot"
                style={{ backgroundColor: category.color }}
                aria-hidden="true"
              />
              {category.name}
            </button>

            {expandedCategoryId === category.id && (
              <div className="category-selection__children">
                {renderChildren(category.id)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  function renderChildren(parentId) {
    const children = childrenByParent.get(parentId) ?? [];

    if (children.length === 0) return null;

    return (
      <div className="category-selection__children">
        {children.map((child) => {
          const grandChildren = childrenByParent.get(child.id) ?? [];
          const hasGrandChildren = grandChildren.length > 0;
          const isExpanded = expandedCategoryId === child.id;

          return (
            <div key={child.id} className="category-selection__child-group">
              <button
                type="button"
                className={`category-button category-button--sub ${
                  selectedIds.has(child.id) ? 'category-button--active' : ''
                } ${isExpanded ? 'category-button--expanded' : ''}`}
                onClick={() => {
                  if (hasGrandChildren) {
                    toggleExpand(child.id);
                  } else {
                    toggleCategory(child.id);
                  }
                }}
              >
                <span
                  className="category-button__dot"
                  style={{ backgroundColor: child.color }}
                  aria-hidden="true"
                />
                {child.name}
              </button>

              {isExpanded && hasGrandChildren && (
                <div className="category-selection__grandchildren">
                  {renderChildren(child.id)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
