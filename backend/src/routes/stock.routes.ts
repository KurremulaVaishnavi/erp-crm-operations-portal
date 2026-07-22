import { Router } from 'express';
import {
  getStockMovements,
  createStockMovement,
} from '../controllers/stock.controller';
import { authenticate, authorize, Role } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { stockMovementSchema } from '../validations/schemas';

const router = Router();

router.use(authenticate);

// View stock movements
router.get('/', getStockMovements);

// Manually log stock adjustment (requires Admin or Warehouse role)
router.post(
  '/',
  authorize([Role.ADMIN, Role.WAREHOUSES]),
  validate(stockMovementSchema),
  createStockMovement
);

export default router;
