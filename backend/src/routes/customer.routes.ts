import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerFollowUp,
} from '../controllers/customer.controller';
import { authenticate, authorize, Role } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  customerSchema,
  customerUpdateSchema,
  customerFollowUpSchema,
} from '../validations/schemas';

const router = Router();

router.use(authenticate);

// List/Search & Details are accessible by all authenticated users
router.get('/', getCustomers);
router.get('/:id', getCustomerById);

// Modify access rules
router.post(
  '/',
  authorize([Role.ADMIN, Role.SALES]),
  validate(customerSchema),
  createCustomer
);
router.put(
  '/:id',
  authorize([Role.ADMIN, Role.SALES]),
  validate(customerUpdateSchema),
  updateCustomer
);
router.delete(
  '/:id',
  authorize([Role.ADMIN]),
  deleteCustomer
);

// Follow-ups
router.post(
  '/:id/follow-up',
  authorize([Role.ADMIN, Role.SALES]),
  validate(customerFollowUpSchema),
  addCustomerFollowUp
);

export default router;
