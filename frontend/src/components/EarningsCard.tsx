'use client';

import styles from './EarningsCard.module.css';

interface EarningsCardProps {
  totalEarnings: number;
  totalSubmissions: number;
  activeCampaigns: number;
}

export default function EarningsCard({
  totalEarnings,
  totalSubmissions,
  activeCampaigns,
}: EarningsCardProps) {
  return (
    <div className={styles.grid}>
      <div className={`${styles.card} ${styles.earningsGlow}`}>
        <div className={styles.iconWrapper}>💸</div>
        <div className={styles.content}>
          <span className={styles.label}>Total Earned</span>
          <span className={styles.value}>₹{totalEarnings.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.iconWrapper}>🎬</div>
        <div className={styles.content}>
          <span className={styles.label}>Total Submissions</span>
          <span className={styles.value}>{totalSubmissions}</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.iconWrapper}>⚡</div>
        <div className={styles.content}>
          <span className={styles.label}>Active Campaigns</span>
          <span className={styles.value}>{activeCampaigns}</span>
        </div>
      </div>
    </div>
  );
}
