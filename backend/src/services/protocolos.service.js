import { protocolosRepository } from '../repositories/protocolos.repository.js';
import { emocionesService } from './emociones.service.js';
import { ApiError } from '../utils/ApiError.js';

async function getProtocoloOrThrow(id) {
  const protocolo = await protocolosRepository.findById(id);
  if (!protocolo) {
    throw ApiError.notFound(`No existe un protocolo con id ${id}`);
  }
  return protocolo;
}

/**
 * Normaliza el filtro `activo` de la query.
 * Por defecto solo se listan activos; `all`/`todos` devuelve ambos estados.
 */
function normalizeActivoFilter(value) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === undefined || raw === null || raw === '') return true;
  if (typeof raw === 'boolean') return raw;

  const normalized = String(raw).trim().toLowerCase();

  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  if (normalized === 'all' || normalized === 'todos') return null;

  throw ApiError.badRequest(
    'activo debe ser true, false, all o todos',
  );
}

/**
 * Acepta `?emocionIds=1,2` o varios parámetros repetidos y devuelve ids únicos.
 */
function normalizeEmocionIdsFilter(value) {
  if (value === undefined || value === null || value === '') return [];

  const raw = Array.isArray(value) ? value.join(',') : String(value);
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');

  const ids = parts.map((part) => {
    const id = Number(part);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw ApiError.badRequest(
        'emocionIds debe contener ids de emoción enteros positivos',
      );
    }
    return id;
  });

  return [...new Set(ids)];
}

/** Reglas de negocio de protocolos, pasos y emociones vinculadas. */
export const protocolosService = {
  list({ activo, emocionIds } = {}) {
    return protocolosRepository.findAll({
      activo: normalizeActivoFilter(activo),
      emocionIds: normalizeEmocionIdsFilter(emocionIds),
    });
  },

  getById(id) {
    return getProtocoloOrThrow(id);
  },

  async create(data) {
    await emocionesService.assertExist(data.emocionIds ?? []);
    return protocolosRepository.create(data);
  },

  async update(id, data) {
    const current = await getProtocoloOrThrow(id);

    if (data.emocionIds !== undefined) {
      await emocionesService.assertExist(data.emocionIds);
    }

    const updated = await protocolosRepository.update(id, {
      nombre: data.nombre ?? current.nombre,
      disparador:
        data.disparador !== undefined ? data.disparador : current.disparador,
      activo: data.activo !== undefined ? data.activo : current.activo,
      ...(data.emocionIds !== undefined ? { emocionIds: data.emocionIds } : {}),
    });

    if (!updated) {
      throw ApiError.notFound(`No existe un protocolo con id ${id}`);
    }

    return updated;
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

  async reordenarPasos(protocoloId, pasoIds) {
    await getProtocoloOrThrow(protocoloId);

    const protocolo = await protocolosRepository.reordenarPasos(
      protocoloId,
      pasoIds,
    );
    if (!protocolo) {
      throw ApiError.badRequest(
        'Uno o más pasos no pertenecen a este protocolo',
      );
    }
    return protocolo;
  },
};
