'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Campaign, Submission, ApiResponse } from '@/types';
import Navbar from '@/components/Navbar';
import BudgetBar from '@/components/BudgetBar';
import SubmissionList from '@/components/SubmissionList';
import styles from './detail.module.css';

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const campaignId = resolvedParams.id;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [campRes, subsRes] = await Promise.all([
        api.getCampaign(campaignId) as Promise<any>,
        api.getCampaignSubmissions(campaignId) as Promise<any>,
      ]);
      const camp = campRes?.data?.campaign || campRes?.data;
      const subs = Array.isArray(subsRes?.data) ? subsRes.data : subsRes?.data?.submissions || [];
      setCampaign(camp);
      setSubmissions(subs);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load campaign data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  if (loading || !campaign) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingBox}>
          <div className="spinner" />
          <p>Loading campaign details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className="container">
          <Link href="/brand" className={styles.backLink}>
            ← Back to Campaigns
          </Link>

          <div className={styles.header}>
            <div className={styles.titleArea}>
              <div className={styles.tags}>
                <span className={styles.tagPlatform}>
                  {campaign.platform === 'instagram' ? '📸' : '🎬'} {campaign.platform}
                </span>
                <span className={styles.tagPlatform} style={{ color: '#4ade80' }}>
                  {campaign.status.toUpperCase()}
                </span>
              </div>
              <h1 className={styles.title}>{campaign.name}</h1>
            </div>

            <button onClick={fetchData} className={styles.refreshBtn}>
              🔄 Refresh Data
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className={styles.grid}>
            {/* Live Budget Tracking */}
            <BudgetBar
              totalBudget={campaign.totalBudget}
              budgetSpent={campaign.budgetSpent}
              status={campaign.status}
            />

            {/* Milestones Ladder */}
            <div className={styles.milestonesCard}>
              <h2 className={styles.cardTitle}>🎯 Milestone Payout Ladder</h2>
              <div className={styles.milestoneTable}>
                {campaign.milestones.map((m, idx) => (
                  <div key={idx} className={styles.milestoneRow}>
                    <div>
                      <strong style={{ color: 'var(--accent-purple)', marginRight: '0.75rem' }}>
                        Tier {idx + 1}:
                      </strong>
                      <span>{m.views.toLocaleString()} views required</span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#4ade80' }}>
                      ₹{m.payout.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submissions & Live View Simulator */}
            <div className={styles.submissionsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Creator Submissions ({submissions.length})
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Use the simulator below each post to test view increases & payouts in real-time
                </span>
              </div>

              <SubmissionList
                submissions={submissions}
                onRefresh={fetchData}
                showSimulator={true}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
