import { categoriesService } from '../services/categories.service.js';
import {
  validateCategoryId,
  validateCreateCategory,
  validateUpdateCategory,
} from '../validators/categories.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Capa HTTP del catálogo de categorías. */
export const categoriesController = {
  list: asyncHandler(async (req, res) => {
    const categories = await categoriesService.list();
    res.json({ data: categories });
  }),

  create: asyncHandler(async (req, res) => {
    const data = validateCreateCategory(req.body);
    const category = await categoriesService.create(data);
    res.status(201).location(`/api/categories/${category.id}`).json({ data: category });
  }),

  update: asyncHandler(async (req, res) => {
    const id = validateCategoryId(req.params.id);
    const data = validateUpdateCategory(req.body);
    const category = await categoriesService.update(id, data);
    res.json({ data: category });
  }),

  remove: asyncHandler(async (req, res) => {
    const id = validateCategoryId(req.params.id);
    await categoriesService.remove(id);
    res.status(204).send();
  }),
};
