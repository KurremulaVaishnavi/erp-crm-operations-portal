import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { authenticate, authorize, Role } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { productSchema, productUpdateSchema } from '../validations/schemas';

const router = Router();

router.use(authenticate);

// Listing & details accessible by all authenticated roles
router.get('/', getProducts);
router.get('/:id', getProductById);

// Create, Edit, Delete require Admin or Warehouse roles
router.post(
  '/',
  authorize([Role.ADMIN, Role.WAREHOUSES]),
  validate(productSchema),
  createProduct
);
router.put(
  '/:id',
  authorize([Role.ADMIN, Role.WAREHOUSES]),
  validate(productUpdateSchema),
  updateProduct
);
router.delete(
  '/:id',
  authorize([Role.ADMIN, Role.WAREHOUSES]),
  deleteProduct
);

export default router;
