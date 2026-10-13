import { capPayoutToBudget, calculatePayoutDelta } from '../src/services/payout.service';

const milestones = [
  { views: 10000, payout: 500 },
  { views: 50000, payout: 2000 },
  { views: 100000, payout: 5000 },
];

describe('Budget Cap Logic', () => {
  // ─── capPayoutToBudget ─────────────────────────────────────
  describe('capPayoutToBudget', () => {
    it('should return full payout when budget is sufficient', () => {
      expect(capPayoutToBudget(500, 10000)).toBe(500);
    });

    it('should cap payout to remaining budget when insufficient', () => {
      expect(capPayoutToBudget(5000, 3000)).toBe(3000);
    });

    it('should return 0 when remaining budget is 0', () => {
      expect(capPayoutToBudget(500, 0)).toBe(0);
    });

    it('should return 0 when remaining budget is negative', () => {
      expect(capPayoutToBudget(500, -100)).toBe(0);
    });

    it('should return exact remaining when payout equals remaining', () => {
      expect(capPayoutToBudget(1000, 1000)).toBe(1000);
    });
  });

  // ─── Budget Integration Tests ──────────────────────────────
  describe('Budget enforcement with payout calculation', () => {
    it('scenario: campaign with ₹1000 budget, creator hits ₹2000 milestone', () => {
      const result = calculatePayoutDelta(50000, milestones, 0);
      const capped = capPayoutToBudget(result.delta, 1000);

      expect(result.delta).toBe(2000); // Would want 2000
      expect(capped).toBe(1000); // But only 1000 available
    });

    it('scenario: budget partially spent, another creator hits milestone', () => {
      const totalBudget = 5000;
      const budgetSpent = 4500; // Only 500 remaining
      const remaining = totalBudget - budgetSpent;

      const result = calculatePayoutDelta(50000, milestones, 0);
      const capped = capPayoutToBudget(result.delta, remaining);

      expect(result.delta).toBe(2000); // Would want 2000
      expect(capped).toBe(500); // But only 500 left
    });

    it('scenario: budget fully spent, no more payouts', () => {
      const remaining = 0;

      const result = calculatePayoutDelta(100000, milestones, 0);
      const capped = capPayoutToBudget(result.delta, remaining);

      expect(result.delta).toBe(5000);
      expect(capped).toBe(0); // Nothing left
    });

    it('scenario: incremental payout after first milestone paid', () => {
      // Creator already paid 500 (milestone 0), now hits milestone 1
      const result = calculatePayoutDelta(50000, milestones, 500);
      const capped = capPayoutToBudget(result.delta, 10000);

      expect(result.delta).toBe(1500); // 2000 - 500 already paid
      expect(capped).toBe(1500); // Enough budget
    });

    it('scenario: incremental payout capped by remaining budget', () => {
      // Creator already paid 500, hits milestone 1, but only 1000 left
      const result = calculatePayoutDelta(50000, milestones, 500);
      const capped = capPayoutToBudget(result.delta, 1000);

      expect(result.delta).toBe(1500); // Would want 1500
      expect(capped).toBe(1000); // But only 1000 left
    });

    it('scenario: multiple creators in same campaign', () => {
      const totalBudget = 6000;
      let budgetSpent = 0;

      // Creator 1 hits 50K views → payout 2000
      const r1 = calculatePayoutDelta(50000, milestones, 0);
      const p1 = capPayoutToBudget(r1.delta, totalBudget - budgetSpent);
      budgetSpent += p1;
      expect(p1).toBe(2000);
      expect(budgetSpent).toBe(2000);

      // Creator 2 hits 100K views → payout 5000, but only 4000 left
      const r2 = calculatePayoutDelta(100000, milestones, 0);
      const p2 = capPayoutToBudget(r2.delta, totalBudget - budgetSpent);
      budgetSpent += p2;
      expect(p2).toBe(4000); // Capped
      expect(budgetSpent).toBe(6000); // Fully spent

      // Creator 3 hits 10K views → payout 500, but nothing left
      const r3 = calculatePayoutDelta(10000, milestones, 0);
      const p3 = capPayoutToBudget(r3.delta, totalBudget - budgetSpent);
      expect(p3).toBe(0); // No budget left
    });
  });
});
