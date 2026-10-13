import {
  calculateMilestoneIndex,
  calculatePayoutForMilestone,
  calculatePayoutDelta,
  capPayoutToBudget,
  detectSpike,
} from '../src/services/payout.service';

// ─── Test Data ──────────────────────────────────────────────────
const milestones = [
  { views: 10000, payout: 500 },
  { views: 50000, payout: 2000 },
  { views: 100000, payout: 5000 },
];

describe('Payout Service', () => {
  // ─── calculateMilestoneIndex ────────────────────────────────
  describe('calculateMilestoneIndex', () => {
    it('should return -1 when no milestone is crossed', () => {
      expect(calculateMilestoneIndex(0, milestones)).toBe(-1);
      expect(calculateMilestoneIndex(9999, milestones)).toBe(-1);
    });

    it('should return 0 when first milestone is exactly met', () => {
      expect(calculateMilestoneIndex(10000, milestones)).toBe(0);
    });

    it('should return 0 when views are between first and second milestone', () => {
      expect(calculateMilestoneIndex(25000, milestones)).toBe(0);
    });

    it('should return 1 when second milestone is crossed', () => {
      expect(calculateMilestoneIndex(50000, milestones)).toBe(1);
      expect(calculateMilestoneIndex(75000, milestones)).toBe(1);
    });

    it('should return last index when all milestones are crossed', () => {
      expect(calculateMilestoneIndex(100000, milestones)).toBe(2);
      expect(calculateMilestoneIndex(500000, milestones)).toBe(2);
    });

    it('should return -1 for empty milestones', () => {
      expect(calculateMilestoneIndex(100000, [])).toBe(-1);
    });
  });

  // ─── calculatePayoutForMilestone ────────────────────────────
  describe('calculatePayoutForMilestone', () => {
    it('should return 0 for index -1 (no milestone)', () => {
      expect(calculatePayoutForMilestone(-1, milestones)).toBe(0);
    });

    it('should return correct payout for each milestone', () => {
      expect(calculatePayoutForMilestone(0, milestones)).toBe(500);
      expect(calculatePayoutForMilestone(1, milestones)).toBe(2000);
      expect(calculatePayoutForMilestone(2, milestones)).toBe(5000);
    });

    it('should return 0 for out-of-bounds index', () => {
      expect(calculatePayoutForMilestone(5, milestones)).toBe(0);
    });
  });

  // ─── calculatePayoutDelta ──────────────────────────────────
  describe('calculatePayoutDelta', () => {
    it('should return full payout when nothing has been paid', () => {
      const result = calculatePayoutDelta(10000, milestones, 0);
      expect(result.milestoneIndex).toBe(0);
      expect(result.newPayout).toBe(500);
      expect(result.delta).toBe(500);
    });

    it('should return incremental delta when upgrading milestones', () => {
      // Creator was at milestone 0 (paid 500), now crosses milestone 1
      const result = calculatePayoutDelta(50000, milestones, 500);
      expect(result.milestoneIndex).toBe(1);
      expect(result.newPayout).toBe(2000);
      expect(result.delta).toBe(1500); // 2000 - 500
    });

    it('should return 0 delta for same milestone (no double pay)', () => {
      const result = calculatePayoutDelta(15000, milestones, 500);
      expect(result.milestoneIndex).toBe(0);
      expect(result.newPayout).toBe(500);
      expect(result.delta).toBe(0);
    });

    it('should handle jumping multiple milestones in one update', () => {
      // Goes from 0 views to 100K in one update
      const result = calculatePayoutDelta(100000, milestones, 0);
      expect(result.milestoneIndex).toBe(2);
      expect(result.newPayout).toBe(5000);
      expect(result.delta).toBe(5000);
    });

    it('should never return negative delta (no clawback)', () => {
      // Views decreased but we already paid 2000
      const result = calculatePayoutDelta(5000, milestones, 2000);
      expect(result.milestoneIndex).toBe(-1);
      expect(result.newPayout).toBe(0);
      expect(result.delta).toBe(0); // No clawback
    });

    it('should handle partial payment scenario', () => {
      // Already partially paid (e.g. due to budget cap)
      const result = calculatePayoutDelta(50000, milestones, 300);
      expect(result.delta).toBe(1700); // 2000 - 300
    });
  });

  // ─── Spike Detection ───────────────────────────────────────
  describe('detectSpike', () => {
    it('should return false when lastUpdateTime is null', () => {
      expect(detectSpike(0, 10000, null)).toBe(false);
    });

    it('should return false for normal growth rate', () => {
      const lastUpdate = new Date(Date.now() - 3600000); // 1 hour ago
      expect(detectSpike(0, 10000, lastUpdate)).toBe(false);
    });

    it('should return true for extremely fast growth', () => {
      const lastUpdate = new Date(Date.now() - 1000); // 1 second ago
      expect(detectSpike(0, 1000000, lastUpdate)).toBe(true);
    });

    it('should return false when views decrease', () => {
      const lastUpdate = new Date(Date.now() - 1000);
      expect(detectSpike(10000, 5000, lastUpdate)).toBe(false);
    });
  });
});
