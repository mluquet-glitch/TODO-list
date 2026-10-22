import { api } from './client.js';

const RESOURCE = '/tasks';

/**
 * Funciones de acceso a los endpoints de tareas.
 * Devuelven directamente el objeto/array desempaquetado de `{ data }`.
 */
export const tasksApi = {
  async list({ status, search } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const queryString = params.toString();

    const payload = await api.get(`${RESOURCE}${queryString ? `?${queryString}` : ''}`);
    return payload.data;
  },

  async get(id) {
    const payload = await api.get(`${RESOURCE}/${id}`);
    return payload.data;
  },

  async create(task) {
    const payload = await api.post(RESOURCE, task);
    return payload.data;
  },

  async update(id, changes) {
    const payload = await api.patch(`${RESOURCE}/${id}`, changes);
    return payload.data;
  },

  remove(id) {
    return api.delete(`${RESOURCE}/${id}`);
  },
};
