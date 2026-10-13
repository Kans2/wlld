'use client';

import { Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './BudgetBar.module.css';

interface BudgetBarProps {
  totalBudget: number;
  budgetSpent: number;
  status?: 'live' | 'completed';
}

export default function BudgetBar({ totalBudget, budgetSpent, status }: BudgetBarProps) {
  const remaining = Math.max(0, totalBudget - budgetSpent);
  const spentPercent = totalBudget > 0 ? Math.min(100, (budgetSpent / totalBudget) * 100) : 0;
  const isExhausted = remaining <= 0;

  return (
    <div className={styles.budgetContainer}>
      <div className={styles.headerRow}>
        <div className={styles.title}>
          <Wallet size={16} className={styles.titleIcon} />
          <span>Campaign Budget Allocation</span>
        </div>
        <span className={`${styles.badge} ${isExhausted ? styles.badgeExhausted : styles.badgeLive}`}>
          {isExhausted ? (
            <>
              <AlertCircle size={12} />
              <span>Budget Exhausted</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={12} />
              <span>{status?.toUpperCase() || 'LIVE'}</span>
            </>
          )}
        </span>
      </div>

      <div className={styles.track}>
        <div
          className={`${styles.fill} ${spentPercent > 80 ? styles.fillWarn : ''}`}
          style={{ width: `${spentPercent}%` }}
        />
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Budget</span>
          <span className={styles.statValue}>₹{totalBudget.toLocaleString()}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Budget Spent</span>
          <span className={`${styles.statValue} ${styles.statValueSpent}`}>
            ₹{budgetSpent.toLocaleString()} ({Math.round(spentPercent)}%)
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Remaining</span>
          <span className={`${styles.statValue} ${styles.statValueRemaining}`}>
            ₹{remaining.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
