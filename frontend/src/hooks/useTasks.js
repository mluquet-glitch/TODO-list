import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from '../api/tasks.api.js';

/** Convierte un error de la API en un mensaje legible (incluye detalles de validación). */
function toMessage(error, fallback) {
  if (Array.isArray(error?.details) && error.details.length > 0) {
    return `${error.message}: ${error.details.join(' · ')}`;
  }
  return error?.message || fallback;
}

/**
 * Hook con todo el estado de las tareas: carga inicial y operaciones CRUD.
 * Mantiene la lista sincronizada sin recargar toda la página.
 */
export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setTasks(await tasksApi.list());
    } catch (err) {
      setError(toMessage(err, 'No se pudieron cargar las tareas'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Ejecuta una operación de escritura con estado `saving` y error centralizado. */
  const run = useCallback(async (operation, fallbackMessage) => {
    setSaving(true);
    setError(null);

    try {
      await operation();
      return true;
    } catch (err) {
      setError(toMessage(err, fallbackMessage));
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const createTask = useCallback(
    (payload) =>
      run(async () => {
        const created = await tasksApi.create(payload);
        setTasks((current) => [created, ...current]);
      }, 'No se pudo crear la tarea'),
    [run],
  );

  const updateTask = useCallback(
    (id, changes) =>
      run(async () => {
        const updated = await tasksApi.update(id, changes);
        setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
      }, 'No se pudo actualizar la tarea'),
    [run],
  );

  const removeTask = useCallback(
    (id) =>
      run(async () => {
        await tasksApi.remove(id);
        setTasks((current) => current.filter((task) => task.id !== id));
      }, 'No se pudo eliminar la tarea'),
    [run],
  );

  return {
    tasks,
    loading,
    saving,
    error,
    createTask,
    updateTask,
    removeTask,
    refresh: load,
    clearError: () => setError(null),
  };
}
