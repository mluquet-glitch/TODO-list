import { api } from './client.js';

/** Catálogo de categorías disponibles para asignar, filtrar y gestionar. */
export const categoriesApi = {
  async list() {
    const payload = await api.get('/categories');
    return payload.data;
  },

  async create(category) {
    const payload = await api.post('/categories', category);
    return payload.data;
  },

  async update(id, changes) {
    const payload = await api.patch(`/categories/${id}`, changes);
    return payload.data;
  },

  remove(id) {
    return api.delete(`/categories/${id}`);
  },
};
