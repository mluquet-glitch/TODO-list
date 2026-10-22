import { tasksRepository } from '../repositories/tasks.repository.js';
import { categoriesService } from './categories.service.js';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../validators/tasks.validator.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Acepta un valor de query repetido (`?status=a&status=b`), separado por comas
 * (`?status=a,b`) o ambos, y devuelve una lista limpia.
 */
function toList(value) {
  if (value === undefined || value === null || value === '') return [];

  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Reglas de negocio de las tareas. No conoce Express (req/res) ni SQL:
 * recibe el usuario autenticado, datos ya validados y orquesta el repositorio.
 */
export const tasksService = {
  async list(userId, { status, priority, categoryIds, search } = {}) {
    const statuses = toList(status);
    const invalidStatus = statuses.find((item) => !TASK_STATUSES.includes(item));
    if (invalidStatus) {
      throw ApiError.badRequest(`status inválido: ${invalidStatus}`);
    }

    const priorities = toList(priority);
    const invalidPriority = priorities.find((item) => !TASK_PRIORITIES.includes(item));
    if (invalidPriority) {
      throw ApiError.badRequest(`priority inválida: ${invalidPriority}`);
    }

    const parsedCategoryIds = toList(categoryIds).map(Number);
    const invalidCategory = parsedCategoryIds.find(
      (id) => !Number.isSafeInteger(id) || id <= 0,
    );
    if (invalidCategory !== undefined) {
      throw ApiError.badRequest('categoryIds debe contener ids válidos');
    }

    const normalizedSearch =
      typeof search === 'string' ? search.trim().slice(0, 100) : '';

    return tasksRepository.findAll({
      userId,
      statuses,
      priorities,
      categoryIds: [...new Set(parsedCategoryIds)],
      search: normalizedSearch || undefined,
    });
  },

  async getById(userId, id) {
    const task = await tasksRepository.findById(id, userId);
    if (!task) throw ApiError.notFound(`No existe una tarea con id ${id}`);
    return task;
  },

  async create(userId, data) {
    await assertParent(data.parentTaskId, userId);
    await categoriesService.assertExist(data.categoryIds ?? []);

    return tasksRepository.create({ userId, ...data });
  },

  async update(userId, id, data) {
    if (data.parentTaskId !== undefined && data.parentTaskId !== null) {
      if (data.parentTaskId === id) {
        throw ApiError.badRequest('Una tarea no puede ser su propia tarea padre');
      }
      await assertParent(data.parentTaskId, userId);
    }

    if (data.categoryIds !== undefined) {
      await categoriesService.assertExist(data.categoryIds);
    }

    const task = await tasksRepository.update(id, userId, data);
    if (!task) throw ApiError.notFound(`No existe una tarea con id ${id}`);
    return task;
  },

  async remove(userId, id) {
    const deleted = await tasksRepository.remove(id, userId);
    if (!deleted) throw ApiError.notFound(`No existe una tarea con id ${id}`);
  },
};

/** Comprueba que la tarea padre exista y pertenezca al mismo usuario. */
async function assertParent(parentTaskId, userId) {
  if (!parentTaskId) return;

  const exists = await tasksRepository.existsForUser(parentTaskId, userId);
  if (!exists) {
    throw ApiError.badRequest('parentTaskId no corresponde a una tarea tuya');
  }
}
