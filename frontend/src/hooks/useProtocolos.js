import { useCallback, useEffect, useState } from 'react';
import { protocolosApi } from '../api/protocolos.api.js';

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

function upsert(list, protocolo) {
  const exists = list.some((item) => item.id === protocolo.id);
  const next = exists
    ? list.map((item) => (item.id === protocolo.id ? protocolo : item))
    : [...list, protocolo];
  return next.sort(byName);
}

/** Carga los protocolos y expone el CRUD de protocolos y pasos. */
export function useProtocolos() {
  const [protocolos, setProtocolos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setProtocolos(await protocolosApi.list());
    } catch (err) {
      setError(toMessage(err, 'No se pudieron cargar los protocolos'));
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

  const createProtocolo = useCallback(
    (payload) =>
      run(async () => {
        const created = await protocolosApi.create(payload);
        setProtocolos((current) => upsert(current, created));
        return created;
      }, 'No se pudo crear el protocolo'),
    [run],
  );

  const updateProtocolo = useCallback(
    (id, changes) =>
      run(async () => {
        const updated = await protocolosApi.update(id, changes);
        setProtocolos((current) => upsert(current, updated));
        return updated;
      }, 'No se pudo actualizar el protocolo'),
    [run],
  );

  const removeProtocolo = useCallback(
    (id) =>
      run(async () => {
        await protocolosApi.remove(id);
        setProtocolos((current) => current.filter((item) => item.id !== id));
        return true;
      }, 'No se pudo eliminar el protocolo'),
    [run],
  );

  const createPaso = useCallback(
    (protocoloId, paso) =>
      run(async () => {
        const updated = await protocolosApi.createPaso(protocoloId, paso);
        setProtocolos((current) => upsert(current, updated));
        return updated;
      }, 'No se pudo crear el paso'),
    [run],
  );

  const updatePaso = useCallback(
    (protocoloId, pasoId, changes) =>
      run(async () => {
        const updated = await protocolosApi.updatePaso(
          protocoloId,
          pasoId,
          changes,
        );
        setProtocolos((current) => upsert(current, updated));
        return updated;
      }, 'No se pudo actualizar el paso'),
    [run],
  );

  const removePaso = useCallback(
    (protocoloId, pasoId) =>
      run(async () => {
        const updated = await protocolosApi.removePaso(protocoloId, pasoId);
        setProtocolos((current) => upsert(current, updated));
        return updated;
      }, 'No se pudo eliminar el paso'),
    [run],
  );

  return {
    protocolos,
    loading,
    saving,
    error,
    createProtocolo,
    updateProtocolo,
    removeProtocolo,
    createPaso,
    updatePaso,
    removePaso,
    refresh: load,
    clearError: () => setError(null),
  };
}
