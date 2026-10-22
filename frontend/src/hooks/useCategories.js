import { useEffect, useState } from 'react';
import { categoriesApi } from '../api/categories.api.js';

/** Carga el catálogo de categorías una sola vez al montar. */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    categoriesApi
      .list()
      .then((list) => {
        if (active) setCategories(list);
      })
      .catch((err) => {
        if (active) {
          setError(err.message ?? 'No se pudieron cargar las categorías');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { categories, loading, error };
}
