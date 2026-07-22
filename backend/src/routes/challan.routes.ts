import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  deleteChallan,
} from '../controllers/challan.controller';
import { authenticate, authorize, Role } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { challanSchema, updateChallanStatusSchema } from '../validations/schemas';

const router = Router();

router.use(authenticate);

// View list and details
router.get('/', getChallans);
router.get('/:id', getChallanById);

// Create Challan (DRAFT by default)
router.post(
  '/',
  authorize([Role.ADMIN, Role.SALES]),
  validate(challanSchema),
  createChallan
);

// Update status (e.g., CONFIRM or CANCEL)
router.put(
  '/:id',
  authorize([Role.ADMIN, Role.SALES, Role.WAREHOUSES, Role.ACCOUNTS]),
  validate(updateChallanStatusSchema),
  updateChallanStatus
);

// Delete draft challans
router.delete(
  '/:id',
  authorize([Role.ADMIN, Role.SALES]),
  deleteChallan
);

export default router;
