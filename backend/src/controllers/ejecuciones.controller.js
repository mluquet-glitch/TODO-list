import { ejecucionesService } from '../services/ejecuciones.service.js';
import {
  validateCreateEjecucion,
  validateEjecucionId,
} from '../validators/ejecuciones.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Capa HTTP de las ejecuciones de protocolos. */
export const ejecucionesController = {
  list: asyncHandler(async (req, res) => {
    const ejecuciones = await ejecucionesService.list();
    res.json({ data: ejecuciones });
  }),

  get: asyncHandler(async (req, res) => {
    const id = validateEjecucionId(req.params.id);
    const ejecucion = await ejecucionesService.getById(id);
    res.json({ data: ejecucion });
  }),

  create: asyncHandler(async (req, res) => {
    const data = validateCreateEjecucion(req.body);
    const ejecucion = await ejecucionesService.create(data);
    res
      .status(201)
      .location(`/api/ejecuciones/${ejecucion.id}`)
      .json({ data: ejecucion });
  }),

  remove: asyncHandler(async (req, res) => {
    const id = validateEjecucionId(req.params.id);
    await ejecucionesService.remove(id);
    res.status(204).send();
  }),
};
