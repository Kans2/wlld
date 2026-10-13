import { IMilestone } from '../models/Campaign';

// ─── Spike detection config ───
const SPIKE_THRESHOLD_VIEWS_PER_SECOND = 100; // Flag if views grow faster than 100/sec
const MIN_TIME_DELTA_SECONDS = 1; // Avoid division by zero

/**
 * Calculate the highest milestone index crossed for a given view count.
 * Milestones MUST be sorted ascending by views.
 *
 * Returns -1 if no milestone is crossed.
 */
export const calculateMilestoneIndex = (
  viewCount: number,
  milestones: IMilestone[]
): number => {
  let highestIndex = -1;

  for (let i = 0; i < milestones.length; i++) {
    if (viewCount >= milestones[i].views) {
      highestIndex = i;
    } else {
      break; // Milestones are sorted, so no need to continue
    }
  }

  return highestIndex;
};

/**
 * Calculate the payout for a given milestone index.
 * The payout is the SINGLE value of the highest crossed milestone (not cumulative).
 *
 * Returns 0 if no milestone is crossed.
 */
export const calculatePayoutForMilestone = (
  milestoneIndex: number,
  milestones: IMilestone[]
): number => {
  if (milestoneIndex < 0 || milestoneIndex >= milestones.length) {
    return 0;
  }
  return milestones[milestoneIndex].payout;
};

/**
 * Calculate the incremental payout delta (what still needs to be paid).
 *
 * newPayout = highest milestone payout for current view count
 * delta = newPayout - alreadyPaid
 *
 * Delta can be 0 (same milestone) but never negative (no clawbacks).
 */
export const calculatePayoutDelta = (
  viewCount: number,
  milestones: IMilestone[],
  alreadyPaid: number
): { milestoneIndex: number; newPayout: number; delta: number } => {
  const milestoneIndex = calculateMilestoneIndex(viewCount, milestones);
  const newPayout = calculatePayoutForMilestone(milestoneIndex, milestones);

  // No clawback: delta is at least 0
  const delta = Math.max(0, newPayout - alreadyPaid);

  return { milestoneIndex, newPayout, delta };
};

/**
 * Cap the payout delta to the remaining campaign budget.
 * Returns the actual amount that can be paid.
 */
export const capPayoutToBudget = (
  payoutDelta: number,
  remainingBudget: number
): number => {
  if (remainingBudget <= 0) return 0;
  return Math.min(payoutDelta, remainingBudget);
};

/**
 * Detect if views are spiking unusually fast (bonus feature).
 * Returns true if the growth rate exceeds the threshold.
 */
export const detectSpike = (
  previousViews: number,
  newViews: number,
  lastUpdateTime: Date | null
): boolean => {
  if (!lastUpdateTime) return false;

  const timeDeltaMs = Date.now() - lastUpdateTime.getTime();
  const timeDeltaSeconds = Math.max(
    timeDeltaMs / 1000,
    MIN_TIME_DELTA_SECONDS
  );

  const viewDelta = newViews - previousViews;
  if (viewDelta <= 0) return false;

  const viewsPerSecond = viewDelta / timeDeltaSeconds;
  return viewsPerSecond > SPIKE_THRESHOLD_VIEWS_PER_SECOND;
};
