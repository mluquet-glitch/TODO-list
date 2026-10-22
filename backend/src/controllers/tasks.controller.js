import { tasksService } from '../services/tasks.service.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validateTaskId,
} from '../validators/tasks.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Capa HTTP: lee la request, delega en el servicio y da forma a la response.
 * `req.user` lo coloca el middleware `requireAuth`.
 */
export const tasksController = {
  list: asyncHandler(async (req, res) => {
    const tasks = await tasksService.list(req.user.id, {
      status: req.query.status,
      priority: req.query.priority,
      search: req.query.search,
    });
    res.json({ data: tasks });
  }),

  get: asyncHandler(async (req, res) => {
    const id = validateTaskId(req.params.id);
    const task = await tasksService.getById(req.user.id, id);
    res.json({ data: task });
  }),

  create: asyncHandler(async (req, res) => {
    const data = validateCreateTask(req.body);
    const task = await tasksService.create(req.user.id, data);
    res.status(201).location(`/api/tasks/${task.id}`).json({ data: task });
  }),

  update: asyncHandler(async (req, res) => {
    const id = validateTaskId(req.params.id);
    const data = validateUpdateTask(req.body);
    const task = await tasksService.update(req.user.id, id, data);
    res.json({ data: task });
  }),

  remove: asyncHandler(async (req, res) => {
    const id = validateTaskId(req.params.id);
    await tasksService.remove(req.user.id, id);
    res.status(204).send();
  }),
};
