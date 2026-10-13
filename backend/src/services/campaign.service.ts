import { Campaign, ICampaign, IMilestone } from '../models/Campaign';
import { ApiError } from '../utils/apiError';
import { cacheGet, cacheInvalidate } from '../config/redis';

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
 * Get campaign by ID with budget info.
 */
export const getCampaignById = async (
  campaignId: string
): Promise<ICampaign> => {
  const campaign = await Campaign.findById(campaignId)
    .populate('brand', 'name email');

  if (!campaign) {
    throw ApiError.notFound('Campaign not found');
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
