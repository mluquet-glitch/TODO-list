import { categoriesRepository } from '../repositories/categories.repository.js';
import { ApiError } from '../utils/ApiError.js';

const DEFAULT_COLOR = '#64748b';

/** Convierte «Mi Categoría» en «mi-categoria», sin acentos ni símbolos. */
function slugify(name) {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return slug || 'categoria';
}

/** Busca un slug libre añadiendo -2, -3… si ya está ocupado. */
async function uniqueSlug(base, excludeId = null) {
  let slug = base;
  let suffix = 2;

  while (await categoriesRepository.slugExists(slug, excludeId)) {
    const tail = `-${suffix}`;
    slug = `${base.slice(0, 80 - tail.length)}${tail}`;
    suffix += 1;
  }

  return slug;
}

/**
 * Catálogo global de categorías. Las categorías son compartidas: cada usuario
 * decide cuáles asignar a sus tareas.
 */
export const categoriesService = {
  list() {
    return categoriesRepository.findAll();
  },

  async create(data) {
    const duplicate = await categoriesRepository.findByName(data.name);
    if (duplicate) {
      throw ApiError.conflict(`Ya existe una categoría llamada «${data.name}»`);
    }

    if (data.parentId) {
      const parent = await categoriesRepository.findById(data.parentId);
      if (!parent) {
        throw ApiError.badRequest(`No existe una categoría padre con id ${data.parentId}`);
      }
      if (parent.id === data.parentId && duplicate?.id === data.parentId) {
        throw ApiError.badRequest('Una categoría no puede ser su propio padre');
      }
    }

    return categoriesRepository.create({
      name: data.name,
      slug: await uniqueSlug(slugify(data.name)),
      color: data.color ?? DEFAULT_COLOR,
      parentId: data.parentId ?? null,
    });
  },

  async update(id, data) {
    const current = await categoriesRepository.findById(id);
    if (!current) throw ApiError.notFound(`No existe una categoría con id ${id}`);

    if (data.parentId !== undefined && data.parentId === id) {
      throw ApiError.badRequest('Una categoría no puede ser su propio padre');
    }

    const name = data.name ?? current.name;

    if (data.name !== undefined) {
      const duplicate = await categoriesRepository.findByName(name, id);
      if (duplicate) {
        throw ApiError.conflict(`Ya existe una categoría llamada «${name}»`);
      }
    }

    const slug =
      data.name !== undefined && name !== current.name
        ? await uniqueSlug(slugify(name), id)
        : current.slug;

    return categoriesRepository.update(id, {
      name,
      slug,
      color: data.color ?? current.color,
      parentId: data.parentId !== undefined ? data.parentId : current.parentId,
    });
  },

  async remove(id) {
    const deleted = await categoriesRepository.remove(id);
    if (!deleted) throw ApiError.notFound(`No existe una categoría con id ${id}`);
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
