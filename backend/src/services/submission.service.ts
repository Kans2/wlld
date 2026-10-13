import mongoose from 'mongoose';
import { Submission, ISubmission } from '../models/Submission';
import { Campaign } from '../models/Campaign';
import { ApiError } from '../utils/apiError';
import {
  calculatePayoutDelta,
  capPayoutToBudget,
  detectSpike,
} from './payout.service';
import { cacheInvalidate } from '../config/redis';

interface CreateSubmissionInput {
  postLink: string;
  campaignId: string;
  creatorId: string;
}

interface ViewUpdateResult {
  submission: ISubmission;
  payoutAwarded: number;
  milestoneReached: number;
  flagged: boolean;
}

/**
 * Submit a post link to a campaign.
 */
export const createSubmission = async (
  input: CreateSubmissionInput
): Promise<ISubmission> => {
  // Verify campaign exists and is live (supports both _id and slug)
  const campaignQuery = mongoose.Types.ObjectId.isValid(input.campaignId)
    ? { $or: [{ _id: input.campaignId }, { slug: input.campaignId }] }
    : { slug: input.campaignId };
  const campaign = await Campaign.findOne(campaignQuery);

  if (!campaign) {
    throw ApiError.notFound('Campaign not found');
  }
  if (campaign.status !== 'live') {
    throw ApiError.badRequest('Campaign is no longer accepting submissions');
  }

  // Check for duplicate submission (also enforced by unique compound index)
  const existingSubmission = await Submission.findOne({
    creator: input.creatorId,
    campaign: campaign._id,
  });
  if (existingSubmission) {
    throw ApiError.conflict('You have already submitted to this campaign');
  }

  const submission = await Submission.create({
    postLink: input.postLink,
    platform: campaign.platform,
    campaign: campaign._id,
    creator: input.creatorId,
  });

  return submission;
};

/**
 * Update view count for a submission and calculate payouts.
 * Uses atomic MongoDB operations for concurrency safety.
 *
 * This is the CRITICAL path — must handle:
 * 1. Multiple milestones crossed in single update
 * 2. Budget exhaustion mid-payout
 * 3. Concurrent updates (no double-pay, no overspend)
 * 4. Spike detection (bonus)
 */
export const updateViews = async (
  submissionId: string,
  newViewCount: number
): Promise<ViewUpdateResult> => {
  // Step 1: Fetch submission with campaign data
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw ApiError.notFound('Submission not found');
  }

  const campaign = await Campaign.findById(submission.campaign);
  if (!campaign) {
    throw ApiError.notFound('Campaign not found');
  }

  // Step 2: Spike detection (bonus)
  const isSpiking = detectSpike(
    submission.previousViewCount,
    newViewCount,
    submission.lastViewUpdate
  );

  // Step 3: Calculate payout delta
  const { milestoneIndex, delta } = calculatePayoutDelta(
    newViewCount,
    campaign.milestones,
    submission.totalPaid
  );

  let payoutAwarded = 0;

  if (delta > 0) {
    // Step 4: Cap to remaining budget
    const remainingBudget = campaign.totalBudget - campaign.budgetSpent;
    const actualPayout = capPayoutToBudget(delta, remainingBudget);

    if (actualPayout > 0) {
      // Step 5: ATOMIC budget deduction with guard
      // This prevents overspend from concurrent requests
      const updatedCampaign = await Campaign.findOneAndUpdate(
        {
          _id: campaign._id,
          // Guard: ensure budget won't exceed totalBudget
          $expr: {
            $lte: [
              { $add: ['$budgetSpent', actualPayout] },
              '$totalBudget',
            ],
          },
        },
        {
          $inc: { budgetSpent: actualPayout },
        },
        { new: true }
      );

      if (updatedCampaign) {
        payoutAwarded = actualPayout;

        // Check if campaign budget is fully spent
        if (updatedCampaign.budgetSpent >= updatedCampaign.totalBudget) {
          updatedCampaign.status = 'completed';
          await updatedCampaign.save();
          await cacheInvalidate('campaigns:*');
        }
      }
      // If updatedCampaign is null, the budget guard failed (race condition caught)
      // In that case, payoutAwarded stays 0
    }
  }

  // Step 6: Update submission
  const updatedSubmission = await Submission.findByIdAndUpdate(
    submissionId,
    {
      viewCount: newViewCount,
      currentMilestoneIndex: milestoneIndex,
      $inc: { totalPaid: payoutAwarded },
      previousViewCount: submission.viewCount,
      lastViewUpdate: new Date(),
      ...(isSpiking && { flagged: true }),
    },
    { new: true }
  ).populate('campaign', 'name platform milestones totalBudget budgetSpent');

  if (!updatedSubmission) {
    throw ApiError.internal('Failed to update submission');
  }

  return {
    submission: updatedSubmission,
    payoutAwarded,
    milestoneReached: milestoneIndex,
    flagged: isSpiking || submission.flagged,
  };
};

/**
 * Get all submissions by a creator.
 */
export const getCreatorSubmissions = async (
  creatorId: string
): Promise<{ submissions: ISubmission[]; totalEarnings: number }> => {
  const submissions = await Submission.find({ creator: creatorId })
    .populate('campaign', 'name platform milestones totalBudget budgetSpent status')
    .sort({ createdAt: -1 });

  const totalEarnings = submissions.reduce(
    (sum, sub) => sum + sub.totalPaid,
    0
  );

  return { submissions, totalEarnings };
};

/**
 * Get all submissions for a campaign (brand view).
 */
export const getCampaignSubmissions = async (
  identifier: string,
  brandId: string
): Promise<ISubmission[]> => {
  // Verify campaign belongs to this brand (supports both _id and slug)
  const campaignQuery = mongoose.Types.ObjectId.isValid(identifier)
    ? { $or: [{ _id: identifier, brand: brandId }, { slug: identifier, brand: brandId }] }
    : { slug: identifier, brand: brandId };

  const campaign = await Campaign.findOne(campaignQuery);

  if (!campaign) {
    throw ApiError.notFound('Campaign not found or access denied');
  }

  return Submission.find({ campaign: campaign._id })
    .populate('creator', 'name email')
    .sort({ createdAt: -1 });
};
