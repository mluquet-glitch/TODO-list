import { api } from './client.js';

/** Catálogo de emociones disponibles para vincular, filtrar y gestionar. */
export const emocionesApi = {
  async list() {
    const payload = await api.get('/emociones');
    return payload.data;
  },

  async create(emocion) {
    const payload = await api.post('/emociones', emocion);
    return payload.data;
  },

  async update(id, changes) {
    const payload = await api.patch(`/emociones/${id}`, changes);
    return payload.data;
  },

  remove(id) {
    return api.delete(`/emociones/${id}`);
  },
};
