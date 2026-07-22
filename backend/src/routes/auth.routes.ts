import { Router } from 'express';
import { login, logout, getMe, register } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validations/schemas';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), login);

// Admin-only signup/registration route
router.post('/register', validate(registerSchema), register);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
