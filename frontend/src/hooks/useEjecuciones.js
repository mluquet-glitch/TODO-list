import { useCallback, useEffect, useState } from 'react';
import { ejecucionesApi } from '../api/ejecuciones.api.js';

function toMessage(error, fallback) {
  if (Array.isArray(error?.details) && error.details.length > 0) {
    return `${error.message}: ${error.details.join(' · ')}`;
  }
  return error?.message || fallback;
}

function sortByDate(list) {
  return [...list].sort(
    (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
  );
}

/** Carga las ejecuciones y expone su creación y eliminación. */
export function useEjecuciones() {
  const [ejecuciones, setEjecuciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setEjecuciones(await ejecucionesApi.list());
    } catch (err) {
      setError(toMessage(err, 'No se pudieron cargar las ejecuciones'));
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

  const createEjecucion = useCallback(
    (protocoloId) =>
      run(async () => {
        const created = await ejecucionesApi.create(protocoloId);
        setEjecuciones((current) =>
          sortByDate([created, ...current.filter((item) => item.id !== created.id)]),
        );
        return created;
      }, 'No se pudo ejecutar el protocolo'),
    [run],
  );

  const removeEjecucion = useCallback(
    (id) =>
      run(async () => {
        await ejecucionesApi.remove(id);
        setEjecuciones((current) => current.filter((item) => item.id !== id));
        return true;
      }, 'No se pudo eliminar la ejecución'),
    [run],
  );

  return {
    ejecuciones,
    loading,
    saving,
    error,
    createEjecucion,
    removeEjecucion,
    refresh: load,
    clearError: () => setError(null),
  };
}
