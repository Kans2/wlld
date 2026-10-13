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
import styles from './submit.module.css';

export default function CreatorCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const campaignId = resolvedParams.id;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [postLink, setPostLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [campRes, mySubsRes] = await Promise.all([
        api.getCampaign(campaignId) as Promise<any>,
        api.getMySubmissions() as Promise<any>,
      ]);
      const camp = campRes?.data?.campaign || campRes?.data;
      const mySubs = Array.isArray(mySubsRes?.data) ? mySubsRes.data : mySubsRes?.data?.submissions || [];
      setCampaign(camp);

      const found = mySubs.find((s: any) => {
        const cId = typeof s.campaign === 'object' ? s.campaign?._id : s.campaign;
        return cId === campaignId;
      });
      setExistingSubmission(found || null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch campaign details');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postLink.trim()) {
      setError('Please provide your post link');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.createSubmission(postLink.trim(), campaignId);
      setSuccess('Post submitted successfully! Now track your views and earnings.');
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit post');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !campaign) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingBox}>
          <div className="spinner" />
          <p>Loading campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className="container">
          <Link href="/creator/campaigns" className={styles.backLink}>
            ← Back to Browse Campaigns
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
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <BudgetBar
              totalBudget={campaign.totalBudget}
              budgetSpent={campaign.budgetSpent}
              status={campaign.status}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className={styles.layoutGrid}>
            {/* Milestones Ladder */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>🎯 Milestone Payout Ladder</h2>
              <div className={styles.milestoneTable}>
                {campaign.milestones.map((m, idx) => (
                  <div key={idx} className={styles.milestoneRow}>
                    <div>
                      <strong style={{ color: 'var(--accent-purple)', marginRight: '0.75rem' }}>
                        Tier {idx + 1}:
                      </strong>
                      <span>{m.views.toLocaleString()} views</span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#4ade80' }}>
                      ₹{m.payout.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Section */}
            <div className={styles.card}>
              {existingSubmission ? (
                <div>
                  <div
                    style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#4ade80',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>✅</span> You have submitted to this campaign!
                  </div>

                  <h3 className={styles.cardTitle}>Your Submission</h3>
                  <div style={{ marginTop: '1rem' }}>
                    <SubmissionList
                      submissions={[existingSubmission]}
                      onRefresh={fetchData}
                      showSimulator={true}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className={styles.cardTitle}>🚀 Submit Your Post Link</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Paste your {campaign.platform === 'instagram' ? 'Instagram Reel / Post' : 'YouTube Video / Short'}{' '}
                    URL. You will earn payouts as views hit each milestone.
                  </p>

                  <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        {campaign.platform === 'instagram' ? 'Instagram Post Link' : 'YouTube Video Link'}
                      </label>
                      <input
                        type="url"
                        placeholder={
                          campaign.platform === 'instagram'
                            ? 'https://www.instagram.com/reel/...'
                            : 'https://www.youtube.com/watch?v=...'
                        }
                        value={postLink}
                        onChange={(e) => setPostLink(e.target.value)}
                        className={styles.input}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || campaign.status !== 'live'}
                      className={styles.submitBtn}
                    >
                      {submitting
                        ? 'Submitting...'
                        : campaign.status !== 'live'
                        ? 'Campaign Completed'
                        : 'Submit Link & Join Campaign'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
