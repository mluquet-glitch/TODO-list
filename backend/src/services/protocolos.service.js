import { protocolosRepository } from '../repositories/protocolos.repository.js';
import { ApiError } from '../utils/ApiError.js';

async function getProtocoloOrThrow(id) {
  const protocolo = await protocolosRepository.findById(id);
  if (!protocolo) {
    throw ApiError.notFound(`No existe un protocolo con id ${id}`);
  }
  return protocolo;
}

/** Reglas de negocio de protocolos y pasos. */
export const protocolosService = {
  list() {
    return protocolosRepository.findAll();
  },

  getById(id) {
    return getProtocoloOrThrow(id);
  },

  async create(data) {
    const created = await protocolosRepository.create(data);
    return getProtocoloOrThrow(created.id);
  },

  async update(id, data) {
    const current = await getProtocoloOrThrow(id);
    const updated = await protocolosRepository.update(id, {
      nombre: data.nombre ?? current.nombre,
      disparador:
        data.disparador !== undefined ? data.disparador : current.disparador,
    });

    if (!updated) {
      throw ApiError.notFound(`No existe un protocolo con id ${id}`);
    }

    return getProtocoloOrThrow(id);
  },

  async remove(id) {
    const deleted = await protocolosRepository.remove(id);
    if (!deleted) {
      throw ApiError.notFound(`No existe un protocolo con id ${id}`);
    }
  },

  async createPaso(protocoloId, data) {
    await getProtocoloOrThrow(protocoloId);
    await protocolosRepository.createPaso({ protocoloId, ...data });
    return getProtocoloOrThrow(protocoloId);
  },

  async updatePaso(protocoloId, pasoId, data) {
    const protocolo = await getProtocoloOrThrow(protocoloId);
    const paso = protocolo.pasos.find((item) => item.id === pasoId);

    if (!paso) {
      throw ApiError.notFound(
        `No existe un paso con id ${pasoId} en el protocolo ${protocoloId}`,
      );
    }

    await protocolosRepository.updatePaso(pasoId, protocoloId, {
      nombre: data.nombre ?? paso.nombre,
      descripcion:
        data.descripcion !== undefined ? data.descripcion : paso.descripcion,
    });

    return getProtocoloOrThrow(protocoloId);
  },

  async removePaso(protocoloId, pasoId) {
    await getProtocoloOrThrow(protocoloId);

    const deleted = await protocolosRepository.removePaso(pasoId, protocoloId);
    if (!deleted) {
      throw ApiError.notFound(
        `No existe un paso con id ${pasoId} en el protocolo ${protocoloId}`,
      );
    }

    return getProtocoloOrThrow(protocoloId);
  },
};
