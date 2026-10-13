'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Campaign, Submission } from '@/types';
import Navbar from '@/components/Navbar';
import BudgetBar from '@/components/BudgetBar';
import SubmissionList from '@/components/SubmissionList';
import { ArrowLeft, CheckCircle2, Target, Send } from 'lucide-react';
import { Instagram, Youtube } from '@/components/icons';
import styles from './submit.module.css';

function CreatorCampaignDetailContent() {
  const params = useParams();
  const campaignId = (params?.id as string) || '';
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
    if (!campaignId) return;
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
        const cSlug = typeof s.campaign === 'object' ? s.campaign?.slug : null;
        return cId === campaignId || cSlug === campaignId || (camp && cId === camp._id);
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
      await api.createSubmission(postLink.trim(), campaign?._id || campaignId);
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
            <ArrowLeft size={16} />
            <span>Back to Browse Campaigns</span>
          </Link>

          <div className={styles.header}>
            <div className={styles.titleArea}>
              <div className={styles.tags}>
                <span className={styles.tagPlatform}>
                  {campaign.platform === 'instagram' ? (
                    <Instagram size={13} />
                  ) : (
                    <Youtube size={13} />
                  )}
                  <span>{campaign.platform}</span>
                </span>
                <span className={`${styles.tagPlatform} ${styles.tagStatusLive}`}>
                  {campaign.status.toUpperCase()}
                </span>
              </div>
              <h1 className={styles.title}>{campaign.name}</h1>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
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
              <div className={styles.cardTitle}>
                <Target size={16} className={styles.cardTitleIcon} />
                <span>Milestone Payout Ladder</span>
              </div>
              <div className={styles.milestoneTable}>
                {campaign.milestones.map((m, idx) => (
                  <div key={idx} className={styles.milestoneRow}>
                    <div className={styles.tierInfo}>
                      <span className={styles.tierNumber}>Tier {idx + 1}:</span>
                      <span>{m.views.toLocaleString()} views</span>
                    </div>
                    <div className={styles.tierPayout}>
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
                  <div className={styles.submittedBanner}>
                    <CheckCircle2 size={16} />
                    <span>You have submitted to this campaign!</span>
                  </div>

                  <h3 className={styles.cardTitle}>Your Submission</h3>
                  <div style={{ marginTop: '0.75rem' }}>
                    <SubmissionList
                      submissions={[existingSubmission]}
                      onRefresh={fetchData}
                      showSimulator={true}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className={styles.cardTitle}>
                    <Send size={16} className={styles.cardTitleIcon} />
                    <span>Submit Your Post Link</span>
                  </div>
                  <p className={styles.cardSubtitle}>
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
                      <Send size={14} />
                      <span>
                        {submitting
                          ? 'Submitting...'
                          : campaign.status !== 'live'
                          ? 'Campaign Completed'
                          : 'Submit Link & Join Campaign'}
                      </span>
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

export default function CreatorCampaignDetailPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.loadingBox}>
            <div className="spinner" />
            <p>Loading campaign...</p>
          </div>
        </div>
      }
    >
      <CreatorCampaignDetailContent />
    </Suspense>
  );
}
