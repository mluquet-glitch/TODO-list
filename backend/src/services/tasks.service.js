import { tasksRepository } from '../repositories/tasks.repository.js';
import { TASK_STATUSES } from '../validators/tasks.validator.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Reglas de negocio de las tareas. No conoce Express (req/res) ni SQL:
 * recibe datos ya validados y orquesta el repositorio.
 */
export const tasksService = {
  async list({ status, search } = {}) {
    if (status && !TASK_STATUSES.includes(status)) {
      throw ApiError.badRequest(`status debe ser uno de: ${TASK_STATUSES.join(', ')}`);
    }

    const normalizedSearch = typeof search === 'string' ? search.trim().slice(0, 100) : '';

    return tasksRepository.findAll({
      status: status || undefined,
      search: normalizedSearch || undefined,
    });
  },

  async getById(id) {
    const task = await tasksRepository.findById(id);
    if (!task) throw ApiError.notFound(`No existe una tarea con id ${id}`);
    return task;
  },

  create(data) {
    return tasksRepository.create(data);
  },

  async update(id, data) {
    const task = await tasksRepository.update(id, data);
    if (!task) throw ApiError.notFound(`No existe una tarea con id ${id}`);
    return task;
  },

  async remove(id) {
    const deleted = await tasksRepository.remove(id);
    if (!deleted) throw ApiError.notFound(`No existe una tarea con id ${id}`);
  },
};
