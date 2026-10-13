import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import * as submissionService from '../services/submission.service';

const router = Router();

// ─── Validation Schemas ─────────────────────────────────────────
const createSubmissionSchema = z.object({
  postLink: z.string().url('Must be a valid URL'),
  campaignId: z.string().min(1, 'Campaign ID is required'),
});

const updateViewsSchema = z.object({
  viewCount: z.number().int().min(0, 'View count cannot be negative'),
});

// ─── POST /api/submissions ──────────────────────────────────────
// Creator only: submit a post link to a campaign
router.post(
  '/',
  authenticate,
  roleGuard('creator'),
  validate({ body: createSubmissionSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const submission = await submissionService.createSubmission({
        postLink: req.body.postLink,
        campaignId: req.body.campaignId,
        creatorId: req.user!.userId,
      });
      res.status(201).json({ success: true, data: submission });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/submissions/my ────────────────────────────────────
// Creator only: list own submissions and total earnings
router.get(
  '/my',
  authenticate,
  roleGuard('creator'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await submissionService.getCreatorSubmissions(
        req.user!.userId
      );
      res.status(200).json({ success: true, data: result.submissions, totalEarnings: result.totalEarnings });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/submissions/campaign/:id ──────────────────────────
// Brand only: list submissions for a campaign
router.get(
  '/campaign/:id',
  authenticate,
  roleGuard('brand'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaignId = req.params.id as string;
      const submissions = await submissionService.getCampaignSubmissions(
        campaignId,
        req.user!.userId
      );
      res.status(200).json({ success: true, data: submissions });
    } catch (error) {
      next(error);
    }
  }
);

// ─── PATCH /api/submissions/:id/views ───────────────────────────
// Public endpoint (no role check): simulates platform data update
router.patch(
  '/:id/views',
  validate({ body: updateViewsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const submissionId = req.params.id as string;
      const result = await submissionService.updateViews(
        submissionId,
        req.body.viewCount
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
