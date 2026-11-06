import { useCallback, useEffect, useState } from 'react';
import { emocionesApi } from '../api/emociones.api.js';

/** Convierte un error de la API en un mensaje legible. */
function toMessage(error, fallback) {
  if (Array.isArray(error?.details) && error.details.length > 0) {
    return `${error.message}: ${error.details.join(' · ')}`;
  }
  return error?.message || fallback;
}

function byName(a, b) {
  return a.nombre.localeCompare(b.nombre, 'es');
}

/** Carga el catálogo y expone las operaciones CRUD de emociones. */
export function useEmociones() {
  const [emociones, setEmociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setEmociones(await emocionesApi.list());
    } catch (err) {
      setError(toMessage(err, 'No se pudieron cargar las emociones'));
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

  const createEmocion = useCallback(
    (payload) =>
      run(async () => {
        const created = await emocionesApi.create(payload);
        setEmociones((current) => [...current, created].sort(byName));
        return created;
      }, 'No se pudo crear la emoción'),
    [run],
  );

  const updateEmocion = useCallback(
    (id, changes) =>
      run(async () => {
        const updated = await emocionesApi.update(id, changes);
        setEmociones((current) =>
          current
            .map((emocion) => (emocion.id === id ? updated : emocion))
            .sort(byName),
        );
        return updated;
      }, 'No se pudo actualizar la emoción'),
    [run],
  );

  const removeEmocion = useCallback(
    (id) =>
      run(async () => {
        await emocionesApi.remove(id);
        setEmociones((current) => current.filter((emocion) => emocion.id !== id));
        return true;
      }, 'No se pudo eliminar la emoción'),
    [run],
  );

  return {
    emociones,
    loading,
    saving,
    error,
    createEmocion,
    updateEmocion,
    removeEmocion,
    refresh: load,
    clearError: () => setError(null),
  };
}
