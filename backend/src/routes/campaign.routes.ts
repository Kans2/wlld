import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import * as campaignService from '../services/campaign.service';

const router = Router();

// ─── Validation Schemas ─────────────────────────────────────────
const milestoneSchema = z.object({
  views: z.number().int().positive(),
  payout: z.number().positive(),
});

const createCampaignSchema = z.object({
  name: z.string().min(3).max(100),
  platform: z.enum(['instagram', 'youtube']),
  totalBudget: z.number().positive(),
  milestones: z.array(milestoneSchema).min(1, 'At least one milestone required'),
});

// ─── POST /api/campaigns ────────────────────────────────────────
// Brand only: create a new campaign
router.post(
  '/',
  authenticate,
  roleGuard('brand'),
  validate({ body: createCampaignSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaign = await campaignService.createCampaign({
        ...req.body,
        brandId: req.user!.userId,
      });
      res.status(201).json({ success: true, data: campaign });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/campaigns ─────────────────────────────────────────
// Any authenticated user: list all live campaigns
router.get(
  '/',
  authenticate,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const campaigns = await campaignService.listLiveCampaigns();
      res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/campaigns/my ──────────────────────────────────────
// Brand only: list own campaigns
router.get(
  '/my',
  authenticate,
  roleGuard('brand'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaigns = await campaignService.getBrandCampaigns(
        req.user!.userId
      );
      res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/campaigns/:id ─────────────────────────────────────
// Any authenticated user: get campaign details
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaignId = req.params.id as string;
      const campaign = await campaignService.getCampaignById(campaignId);
      res.status(200).json({ success: true, data: campaign });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
