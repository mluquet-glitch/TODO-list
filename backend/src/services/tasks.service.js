import { tasksRepository } from '../repositories/tasks.repository.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../validators/tasks.validator.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Reglas de negocio de las tareas. No conoce Express (req/res) ni SQL:
 * recibe el usuario autenticado, datos ya validados y orquesta el repositorio.
 */
export const tasksService = {
  async list(userId, { status, search, priority } = {}) {
    if (status && !TASK_STATUSES.includes(status)) {
      throw ApiError.badRequest(`status debe ser uno de: ${TASK_STATUSES.join(', ')}`);
    }

    if (priority && !TASK_PRIORITIES.includes(priority)) {
      throw ApiError.badRequest(`priority debe ser una de: ${TASK_PRIORITIES.join(', ')}`);
    }

    const normalizedSearch = typeof search === 'string' ? search.trim().slice(0, 100) : '';

    return tasksRepository.findAll({
      userId,
      status: status || undefined,
      priority: priority || undefined,
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
    return tasksRepository.create({ userId, ...data });
  },

  async update(userId, id, data) {
    if (data.parentTaskId !== undefined && data.parentTaskId !== null) {
      if (data.parentTaskId === id) {
        throw ApiError.badRequest('Una tarea no puede ser su propia tarea padre');
      }
      await assertParent(data.parentTaskId, userId);
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
