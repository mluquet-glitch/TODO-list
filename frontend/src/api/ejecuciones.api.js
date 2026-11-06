import { api } from './client.js';

const RESOURCE = '/ejecuciones';

/** Acceso a los endpoints de ejecuciones de protocolos. */
export const ejecucionesApi = {
  async list() {
    const payload = await api.get(RESOURCE);
    return payload.data;
  },

  async get(id) {
    const payload = await api.get(`${RESOURCE}/${id}`);
    return payload.data;
  },

  async create(protocoloId) {
    const payload = await api.post(RESOURCE, { protocoloId });
    return payload.data;
  },

  remove(id) {
    return api.delete(`${RESOURCE}/${id}`);
  },
};
