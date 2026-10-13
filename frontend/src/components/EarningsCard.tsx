'use client';

import { Coins, FileCheck2, Activity } from 'lucide-react';
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
      <div className={styles.tile}>
        <div className={styles.tileHeader}>
          <span className={styles.label}>Total Earned</span>
          <div className={`${styles.iconWrap} ${styles.iconBrand}`}>
            <Coins size={16} />
          </div>
        </div>
        <p className={`${styles.value} ${styles.toneGood}`}>₹{totalEarnings.toLocaleString()}</p>
        <p className={styles.sub}>Cumulative milestone payouts</p>
      </div>

      <div className={styles.tile}>
        <div className={styles.tileHeader}>
          <span className={styles.label}>Total Submissions</span>
          <div className={styles.iconWrap}>
            <FileCheck2 size={16} />
          </div>
        </div>
        <p className={styles.value}>{totalSubmissions}</p>
        <p className={styles.sub}>Tracked videos across campaigns</p>
      </div>

      <div className={styles.tile}>
        <div className={styles.tileHeader}>
          <span className={styles.label}>Active Campaigns</span>
          <div className={styles.iconWrap}>
            <Activity size={16} />
          </div>
        </div>
        <p className={styles.value}>{activeCampaigns}</p>
        <p className={styles.sub}>Live brand campaigns joined</p>
      </div>
    </div>
  );
}
