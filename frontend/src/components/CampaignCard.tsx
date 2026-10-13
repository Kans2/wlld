'use client';

import { Campaign } from '@/types';
import { ArrowRight } from 'lucide-react';
import { Instagram, Youtube } from '@/components/icons';
import styles from './CampaignCard.module.css';

interface CampaignCardProps {
  campaign: Campaign;
  onClick?: () => void;
  showBudget?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export default function CampaignCard({
  campaign,
  onClick,
  showBudget = false,
  actionLabel,
  onAction,
}: CampaignCardProps) {
  const budgetPercent = (campaign.budgetSpent / campaign.totalBudget) * 100;
  const remaining = campaign.totalBudget - campaign.budgetSpent;

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <div className={styles.platform_badge} data-platform={campaign.platform}>
          {campaign.platform === 'instagram' ? (
            <Instagram size={13} className={styles.platform_icon} />
          ) : (
            <Youtube size={13} className={styles.platform_icon} />
          )}
          <span>{campaign.platform}</span>
        </div>
        <span className={styles.status} data-status={campaign.status}>
          {campaign.status}
        </span>
      </div>

      <h3 className={styles.name}>{campaign.name}</h3>

      {showBudget && (
        <div className={styles.budget_section}>
          <div className={styles.budget_header}>
            <span className={styles.budget_label}>Budget</span>
            <span className={styles.budget_value}>
              ₹{remaining.toLocaleString()} remaining
            </span>
          </div>
          <div className={styles.progress_track}>
            <div
              className={styles.progress_fill}
              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              data-danger={budgetPercent > 80 ? 'true' : 'false'}
            />
          </div>
          <div className={styles.budget_details}>
            <span>₹{campaign.budgetSpent.toLocaleString()} spent</span>
            <span>₹{campaign.totalBudget.toLocaleString()} total</span>
          </div>
        </div>
      )}

      <div className={styles.milestones}>
        <span className={styles.milestone_label}>Milestones</span>
        <div className={styles.milestone_list}>
          {campaign.milestones.map((m, i) => (
            <span key={i} className={styles.milestone_tag}>
              {m.views >= 1000 ? `${m.views / 1000}K` : m.views} views → ₹{m.payout.toLocaleString()}
            </span>
          ))}
        </div>
      </div>

      {actionLabel && onAction && (
        <button
          className={styles.action_btn}
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
        >
          <span>{actionLabel}</span>
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
