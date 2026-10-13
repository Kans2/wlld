import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import * as authService from '../services/auth.service';

const router = Router();

// ─── Validation Schemas ─────────────────────────────────────────
const signupSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['brand', 'creator']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── POST /api/auth/signup ──────────────────────────────────────
router.post(
  '/signup',
  validate({ body: signupSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.signup(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── POST /api/auth/login ───────────────────────────────────────
router.post(
  '/login',
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/auth/me ───────────────────────────────────────────
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
