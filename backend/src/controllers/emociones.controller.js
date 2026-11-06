import { emocionesService } from '../services/emociones.service.js';
import {
  validateCreateEmocion,
  validateEmocionId,
  validateUpdateEmocion,
} from '../validators/emociones.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Capa HTTP del catálogo de emociones. */
export const emocionesController = {
  list: asyncHandler(async (req, res) => {
    const emociones = await emocionesService.list();
    res.json({ data: emociones });
  }),

  create: asyncHandler(async (req, res) => {
    const data = validateCreateEmocion(req.body);
    const emocion = await emocionesService.create(data);
    res.status(201).location(`/api/emociones/${emocion.id}`).json({ data: emocion });
  }),

  update: asyncHandler(async (req, res) => {
    const id = validateEmocionId(req.params.id);
    const data = validateUpdateEmocion(req.body);
    const emocion = await emocionesService.update(id, data);
    res.json({ data: emocion });
  }),

  remove: asyncHandler(async (req, res) => {
    const id = validateEmocionId(req.params.id);
    await emocionesService.remove(id);
    res.status(204).send();
  }),
};
