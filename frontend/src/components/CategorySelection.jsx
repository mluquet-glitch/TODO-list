import { useMemo, useState } from 'react';

/**
 * Selección jerárquica de categorías para formularios de tarea.
 * Se usan botones (no checkboxes).
 *
 * Comportamiento:
 * - Inicialmente solo se muestran las categorías raíz, en una fila que
 *   hace wrap cuando no cabe.
 * - Al hacer clic en una categoría con hijas, sus subcategorías se añaden
 *   a la misma lista, justo después de ella.
 * - Las subcategorías con hijas hacen lo mismo: sus hijas se insertan
 *   después de ellas en la misma lista.
 * - Una categoría sin hijas se selecciona/deselecciona al hacer clic.
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
  const selectedIds = new Set(value);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

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

  function toggleExpand(category) {
    const siblings = childrenByParent.get(category.parentId ?? null) ?? [];

    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(category.id)) {
        removeSubtree(next, category.id);
        return next;
      }

      // Solo una rama desplegada por nivel, para que la lista no se mezcle.
      for (const sibling of siblings) {
        if (sibling.id !== category.id) removeSubtree(next, sibling.id);
      }

      next.add(category.id);
      return next;
    });
  }

  function removeSubtree(target, categoryId) {
    target.delete(categoryId);
    const children = childrenByParent.get(categoryId) ?? [];
    for (const child of children) removeSubtree(target, child.id);
  }

  function handleCategoryClick(category) {
    const children = childrenByParent.get(category.id) ?? [];

    // Las categorías con hijas insertan sus hijas en la lista.
    // Las categorías hoja (sin hijas) se seleccionan como categoría de la tarea.
    if (children.length > 0) {
      toggleExpand(category);
    } else {
      toggleCategory(category.id);
    }
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
          expandedIds={expandedIds}
          onSelect={handleCategoryClick}
        />
      ))}
    </div>
  );
}

function CategoryNode({
  category,
  depth,
  childrenByParent,
  selectedIds,
  expandedIds,
  onSelect,
}) {
  const children = childrenByParent.get(category.id) ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(category.id);
  const isSelected = selectedIds.has(category.id);
  const isSubcategory = depth > 0;

  return (
    <>
      <button
        type="button"
        className={`category-button ${
          isSubcategory ? 'category-button--sub' : ''
        } ${isSelected ? 'category-button--active' : ''} ${
          isExpanded ? 'category-button--expanded' : ''
        }`}
        onClick={() => onSelect(category)}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-pressed={hasChildren ? undefined : isSelected}
      >
        <span
          className="category-button__dot"
          style={{ backgroundColor: category.color }}
          aria-hidden="true"
        />
        <span className="category-button__label">{category.name}</span>
        {hasChildren && (
          <span className="category-button__caret" aria-hidden="true">
            {isExpanded ? '▾' : '▸'}
          </span>
        )}
      </button>

      {hasChildren &&
        isExpanded &&
        children.map((child) => (
          <CategoryNode
            key={child.id}
            category={child}
            depth={depth + 1}
            childrenByParent={childrenByParent}
            selectedIds={selectedIds}
            expandedIds={expandedIds}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}
