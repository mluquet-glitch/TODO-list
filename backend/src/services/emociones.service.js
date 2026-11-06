import { emocionesRepository } from '../repositories/emociones.repository.js';
import { ApiError } from '../utils/ApiError.js';

/** Catálogo global de emociones compartidas por los protocolos. */
export const emocionesService = {
  list() {
    return emocionesRepository.findAll();
  },

  async create(data) {
    const duplicate = await emocionesRepository.findByName(data.nombre);
    if (duplicate) {
      throw ApiError.conflict(`Ya existe una emoción llamada «${data.nombre}»`);
    }

    return emocionesRepository.create({ nombre: data.nombre });
  },

  async update(id, data) {
    const current = await emocionesRepository.findById(id);
    if (!current) {
      throw ApiError.notFound(`No existe una emoción con id ${id}`);
    }

    const nombre = data.nombre ?? current.nombre;

    if (data.nombre !== undefined) {
      const duplicate = await emocionesRepository.findByName(nombre, id);
      if (duplicate) {
        throw ApiError.conflict(`Ya existe una emoción llamada «${nombre}»`);
      }
    }

    return emocionesRepository.update(id, { nombre });
  },

  async remove(id) {
    const deleted = await emocionesRepository.remove(id);
    if (!deleted) {
      throw ApiError.notFound(`No existe una emoción con id ${id}`);
    }
  },

  /** Verifica que todos los ids recibidos existan antes de vincularlos. */
  async assertExist(ids = []) {
    if (ids.length === 0) return;

    const found = await emocionesRepository.findByIds(ids);
    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((emocion) => emocion.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw ApiError.badRequest(
        'emocionIds contiene emociones inexistentes',
        missing.map((id) => `No existe la emoción con id ${id}`),
      );
    }
  },
};
