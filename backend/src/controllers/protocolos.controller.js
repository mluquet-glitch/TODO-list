import { protocolosService } from '../services/protocolos.service.js';
import {
  validateCreatePaso,
  validateCreateProtocolo,
  validatePasoId,
  validateProtocoloId,
  validateReordenarPasos,
  validateUpdatePaso,
  validateUpdateProtocolo,
} from '../validators/protocolos.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Capa HTTP de protocolos y sus pasos. */
export const protocolosController = {
  list: asyncHandler(async (req, res) => {
    const protocolos = await protocolosService.list({
      activo: req.query.activo,
      emocionIds: req.query.emocionIds,
    });
    res.json({ data: protocolos });
  }),

  get: asyncHandler(async (req, res) => {
    const id = validateProtocoloId(req.params.id);
    const protocolo = await protocolosService.getById(id);
    res.json({ data: protocolo });
  }),

  create: asyncHandler(async (req, res) => {
    const data = validateCreateProtocolo(req.body);
    const protocolo = await protocolosService.create(data);
    res
      .status(201)
      .location(`/api/protocolos/${protocolo.id}`)
      .json({ data: protocolo });
  }),

  update: asyncHandler(async (req, res) => {
    const id = validateProtocoloId(req.params.id);
    const data = validateUpdateProtocolo(req.body);
    const protocolo = await protocolosService.update(id, data);
    res.json({ data: protocolo });
  }),

  remove: asyncHandler(async (req, res) => {
    const id = validateProtocoloId(req.params.id);
    await protocolosService.remove(id);
    res.status(204).send();
  }),

  createPaso: asyncHandler(async (req, res) => {
    const protocoloId = validateProtocoloId(req.params.protocoloId);
    const data = validateCreatePaso(req.body);
    const protocolo = await protocolosService.createPaso(protocoloId, data);
    res.status(201).json({ data: protocolo });
  }),

  updatePaso: asyncHandler(async (req, res) => {
    const protocoloId = validateProtocoloId(req.params.protocoloId);
    const pasoId = validatePasoId(req.params.pasoId);
    const data = validateUpdatePaso(req.body);
    const protocolo = await protocolosService.updatePaso(
      protocoloId,
      pasoId,
      data,
    );
    res.json({ data: protocolo });
  }),

  removePaso: asyncHandler(async (req, res) => {
    const protocoloId = validateProtocoloId(req.params.protocoloId);
    const pasoId = validatePasoId(req.params.pasoId);
    const protocolo = await protocolosService.removePaso(protocoloId, pasoId);
    res.json({ data: protocolo });
  }),

  reordenarPasos: asyncHandler(async (req, res) => {
    const protocoloId = validateProtocoloId(req.params.protocoloId);
    const { pasoIds } = validateReordenarPasos(req.body);
    const protocolo = await protocolosService.reordenarPasos(
      protocoloId,
      pasoIds,
    );
    res.json({ data: protocolo });
  }),
};
