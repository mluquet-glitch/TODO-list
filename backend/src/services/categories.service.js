import { categoriesRepository } from '../repositories/categories.repository.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Catálogo global de categorías. Las categorías son compartidas: cada usuario
 * decide cuáles asignar a sus tareas.
 */
export const categoriesService = {
  list() {
    return categoriesRepository.findAll();
  },

  /** Verifica que todos los ids recibidos existan antes de asignarlos. */
  async assertExist(ids = []) {
    if (ids.length === 0) return;

    const found = await categoriesRepository.findByIds(ids);
    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((category) => category.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw ApiError.badRequest(
        'categoryIds contiene categorías inexistentes',
        missing.map((id) => `No existe la categoría con id ${id}`),
      );
    }
  },
};
