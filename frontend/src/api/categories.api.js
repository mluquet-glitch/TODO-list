import { api } from './client.js';

/** Catálogo de categorías disponibles para asignar y filtrar. */
export const categoriesApi = {
  async list() {
    const payload = await api.get('/categories');
    return payload.data;
  },
};
