import { api } from './client.js';

const RESOURCE = '/protocolos';

/** Acceso a los endpoints de protocolos y sus pasos. */
export const protocolosApi = {
  async list({ activo, emocionIds } = {}) {
    const params = new URLSearchParams();
    if (activo !== undefined) params.set('activo', activo);

    if (emocionIds !== undefined) {
      const value = Array.isArray(emocionIds)
        ? emocionIds.join(',')
        : String(emocionIds);
      if (value) params.set('emocionIds', value);
    }

    const queryString = params.toString();

    const payload = await api.get(
      `${RESOURCE}${queryString ? `?${queryString}` : ''}`,
    );
    return payload.data;
  },

  async get(id) {
    const payload = await api.get(`${RESOURCE}/${id}`);
    return payload.data;
  },

  async create(protocolo) {
    const payload = await api.post(RESOURCE, protocolo);
    return payload.data;
  },

  async update(id, changes) {
    const payload = await api.patch(`${RESOURCE}/${id}`, changes);
    return payload.data;
  },

  remove(id) {
    return api.delete(`${RESOURCE}/${id}`);
  },

  async createPaso(protocoloId, paso) {
    const payload = await api.post(`${RESOURCE}/${protocoloId}/pasos`, paso);
    return payload.data;
  },

  async updatePaso(protocoloId, pasoId, changes) {
    const payload = await api.patch(
      `${RESOURCE}/${protocoloId}/pasos/${pasoId}`,
      changes,
    );
    return payload.data;
  },

  async removePaso(protocoloId, pasoId) {
    const payload = await api.delete(
      `${RESOURCE}/${protocoloId}/pasos/${pasoId}`,
    );
    return payload.data;
  },
};
