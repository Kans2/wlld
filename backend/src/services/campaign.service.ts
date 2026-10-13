import mongoose from 'mongoose';
import { Campaign, ICampaign, IMilestone } from '../models/Campaign';
import { ApiError } from '../utils/apiError';
import { cacheGet, cacheInvalidate } from '../config/redis';
import { generateSlug } from '../utils/slugify';

interface CreateCampaignInput {
  name: string;
  platform: 'instagram' | 'youtube';
  totalBudget: number;
  milestones: IMilestone[];
  brandId: string;
}

/**
 * Create a new campaign.
 * Validates milestones: payouts must increase with views, highest payout must not exceed budget.
 */
export const createCampaign = async (
  input: CreateCampaignInput
): Promise<ICampaign> => {
  // Sort milestones ascending by views
  const sortedMilestones = [...input.milestones].sort(
    (a, b) => a.views - b.views
  );

  // Validate: payout should increase with view thresholds
  for (let i = 1; i < sortedMilestones.length; i++) {
    if (sortedMilestones[i].payout <= sortedMilestones[i - 1].payout) {
      throw ApiError.badRequest(
        'Milestone payouts must increase with view thresholds'
      );
    }
  }

  // Validate: highest single payout must not exceed total budget
  const highestPayout = sortedMilestones[sortedMilestones.length - 1].payout;
  if (highestPayout > input.totalBudget) {
    throw ApiError.badRequest(
      'Highest milestone payout cannot exceed total budget'
    );
  }

  const campaign = await Campaign.create({
    name: input.name,
    slug: generateSlug(input.name),
    platform: input.platform,
    totalBudget: input.totalBudget,
    milestones: sortedMilestones,
    brand: input.brandId,
  });

  // Invalidate campaign list cache
  await cacheInvalidate('campaigns:*');

  return campaign;
};

/**
 * List all live campaigns. Cached with Redis if available.
 */
export const listLiveCampaigns = async (): Promise<ICampaign[]> => {
  return cacheGet('campaigns:live', 60, async () => {
    return Campaign.find({ status: 'live' })
      .populate('brand', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  });
};

/**
 * Get campaign by ID or Slug with budget info.
 */
export const getCampaignById = async (
  identifier: string
): Promise<ICampaign> => {
  const query = mongoose.Types.ObjectId.isValid(identifier)
    ? { $or: [{ _id: identifier }, { slug: identifier }] }
    : { slug: identifier };

  const campaign = await Campaign.findOne(query)
    .populate('brand', 'name email');

  if (!campaign) {
    throw ApiError.notFound('Campaign not found');
  }

  // If an existing campaign has no slug yet, auto-populate and save it
  if (!campaign.slug && campaign.name) {
    campaign.slug = generateSlug(campaign.name);
    await campaign.save().catch(() => {});
  }

  return campaign;
};

/**
 * List campaigns owned by a specific brand.
 */
export const getBrandCampaigns = async (
  brandId: string
): Promise<ICampaign[]> => {
  return Campaign.find({ brand: brandId })
    .sort({ createdAt: -1 })
    .lean();
};
