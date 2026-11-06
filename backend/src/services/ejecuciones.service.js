import { ejecucionesRepository } from '../repositories/ejecuciones.repository.js';
import { protocolosRepository } from '../repositories/protocolos.repository.js';
import { ApiError } from '../utils/ApiError.js';

/** Reglas de negocio de las ejecuciones de protocolos. */
export const ejecucionesService = {
  list() {
    return ejecucionesRepository.findAll();
  },

  async getById(id) {
    const ejecucion = await ejecucionesRepository.findById(id);
    if (!ejecucion) {
      throw ApiError.notFound(`No existe una ejecución con id ${id}`);
    }
    return ejecucion;
  },

  async create({ protocoloId }) {
    const protocolo = await protocolosRepository.findById(protocoloId);
    if (!protocolo) {
      throw ApiError.badRequest(
        `No existe un protocolo con id ${protocoloId}`,
      );
    }

    const id = await ejecucionesRepository.create({ protocoloId });
    return ejecucionesRepository.findById(id);
  },

  async remove(id) {
    const deleted = await ejecucionesRepository.remove(id);
    if (!deleted) {
      throw ApiError.notFound(`No existe una ejecución con id ${id}`);
    }
  },
};
