'use client';

import { useState } from 'react';
import { Submission } from '@/types';
import { api } from '@/lib/api';
import styles from './SubmissionList.module.css';

interface SubmissionListProps {
  submissions: Submission[];
  onRefresh?: () => void;
  showSimulator?: boolean;
}

export default function SubmissionList({
  submissions,
  onRefresh,
  showSimulator = true,
}: SubmissionListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [customViews, setCustomViews] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdateViews = async (id: string, newViews: number) => {
    try {
      setUpdatingId(id);
      setErrorMsg(null);
      await api.updateViews(id, newViews);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to update views');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  if (!submissions || submissions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📭</div>
        <p>No submissions yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {errorMsg && <div className="error-message">{errorMsg}</div>}

      {submissions.map((sub) => {
        const milestoneIndex = sub.currentMilestoneIndex;
        const currentMilestone =
          milestoneIndex >= 0 && sub.campaign?.milestones?.[milestoneIndex]
            ? sub.campaign.milestones[milestoneIndex]
            : null;

        return (
          <div key={sub._id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.postInfo}>
                <a
                  href={sub.postLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.postLink}
                >
                  🔗 {sub.postLink}
                </a>
                <div className={styles.postMeta}>
                  <span className={styles.platformTag}>
                    {sub.platform === 'instagram' ? '📸' : '🎬'} {sub.platform}
                  </span>
                  <span>•</span>
                  <span>Creator: {sub.creator?.name || 'Anonymous'}</span>
                  <span>•</span>
                  <span>Submitted: {new Date(sub.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className={styles.badges}>
                {sub.flagged && (
                  <span className={styles.spikeBadge} title="Spike Detection Triggered: Views grew unusually fast!">
                    ⚠️ Spike Detected
                  </span>
                )}
                <span className={styles.milestoneBadge}>
                  {currentMilestone
                    ? `Tier ${milestoneIndex + 1}: ${currentMilestone.views.toLocaleString()} views`
                    : 'Tier 0: No milestone reached'}
                </span>
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Current Views</span>
                <span className={styles.statValue}>{(sub.viewCount || 0).toLocaleString()}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Payout Earned</span>
                <span className={`${styles.statValue} ${styles.paidValue}`}>
                  ₹{(sub.totalPaid || 0).toLocaleString()}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Next Milestone Target</span>
                <span className={styles.statValue}>
                  {(() => {
                    const nextM = sub.campaign?.milestones?.[milestoneIndex + 1];
                    if (!nextM) return 'Max Tier Reached 🏆';
                    return `${nextM.views.toLocaleString()} views (₹${nextM.payout.toLocaleString()})`;
                  })()}
                </span>
              </div>
            </div>

            {showSimulator && (
              <div className={styles.simulatorBox}>
                <div className={styles.simHeader}>
                  <span>⚡ Platform View Simulator (Live Test)</span>
                  <span>{updatingId === sub._id ? 'Updating views & recalculating payout...' : ''}</span>
                </div>

                <div className={styles.simControls}>
                  <button
                    className={styles.simBtn}
                    disabled={updatingId === sub._id}
                    onClick={() => handleUpdateViews(sub._id, (sub.viewCount || 0) + 5000)}
                  >
                    +5K views
                  </button>
                  <button
                    className={styles.simBtn}
                    disabled={updatingId === sub._id}
                    onClick={() => handleUpdateViews(sub._id, (sub.viewCount || 0) + 25000)}
                  >
                    +25K views
                  </button>
                  <button
                    className={styles.simBtn}
                    disabled={updatingId === sub._id}
                    onClick={() => handleUpdateViews(sub._id, (sub.viewCount || 0) + 100000)}
                  >
                    +100K views
                  </button>
                  <button
                    className={`${styles.simBtn} ${styles.simBtnSpike}`}
                    disabled={updatingId === sub._id}
                    title="Simulate sudden massive spike in 1 second to test Spike Detection"
                    onClick={() => handleUpdateViews(sub._id, (sub.viewCount || 0) + 250000)}
                  >
                    🚀 Trigger Spike (+250K)
                  </button>

                  <div className={styles.customInputGroup}>
                    <input
                      type="number"
                      placeholder="Custom"
                      className={styles.customInput}
                      value={customViews[sub._id] ?? ''}
                      onChange={(e) =>
                        setCustomViews({
                          ...customViews,
                          [sub._id]: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <button
                      className={styles.updateBtn}
                      disabled={updatingId === sub._id || !customViews[sub._id]}
                      onClick={() => {
                        const target = customViews[sub._id];
                        if (target !== undefined) handleUpdateViews(sub._id, target);
                      }}
                    >
                      Set Views
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
