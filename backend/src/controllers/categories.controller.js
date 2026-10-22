import { categoriesService } from '../services/categories.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** GET /api/categories — catálogo disponible para asignar y filtrar. */
export const categoriesController = {
  list: asyncHandler(async (req, res) => {
    const categories = await categoriesService.list();
    res.json({ data: categories });
  }),
};
