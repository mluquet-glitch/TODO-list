import { useCallback, useEffect, useState } from 'react';
import { categoriesApi } from '../api/categories.api.js';

/** Convierte un error de la API en un mensaje legible. */
function toMessage(error, fallback) {
  if (Array.isArray(error?.details) && error.details.length > 0) {
    return `${error.message}: ${error.details.join(' · ')}`;
  }
  return error?.message || fallback;
}

function byName(a, b) {
  return a.name.localeCompare(b.name, 'es');
}

/** Carga el catálogo y expone las operaciones CRUD de categorías. */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setCategories(await categoriesApi.list());
    } catch (err) {
      setError(toMessage(err, 'No se pudieron cargar las categorías'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = useCallback(async (operation, fallbackMessage) => {
    setSaving(true);
    setError(null);

    try {
      return await operation();
    } catch (err) {
      setError(toMessage(err, fallbackMessage));
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const createCategory = useCallback(
    (payload) =>
      run(async () => {
        const created = await categoriesApi.create(payload);
        setCategories((current) => [...current, created].sort(byName));
        return created;
      }, 'No se pudo crear la categoría'),
    [run],
  );

  const updateCategory = useCallback(
    (id, changes) =>
      run(async () => {
        const updated = await categoriesApi.update(id, changes);
        setCategories((current) =>
          current.map((category) => (category.id === id ? updated : category)).sort(byName),
        );
        return updated;
      }, 'No se pudo actualizar la categoría'),
    [run],
  );

  const removeCategory = useCallback(
    (id) =>
      run(async () => {
        await categoriesApi.remove(id);
        setCategories((current) => current.filter((category) => category.id !== id));
        return true;
      }, 'No se pudo eliminar la categoría'),
    [run],
  );

  return {
    categories,
    loading,
    saving,
    error,
    createCategory,
    updateCategory,
    removeCategory,
    refresh: load,
    clearError: () => setError(null),
  };
}
