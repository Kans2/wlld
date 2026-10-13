'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Submission, ApiResponse } from '@/types';
import Navbar from '@/components/Navbar';
import EarningsCard from '@/components/EarningsCard';
import SubmissionList from '@/components/SubmissionList';
import styles from './creator.module.css';

export default function CreatorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'creator') {
      router.push('/brand');
    }
  }, [user, authLoading, router]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.getMySubmissions()) as any;
      const list = Array.isArray(res?.data) ? res.data : res?.data?.submissions || [];
      setSubmissions(list);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch your submissions');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'creator') {
      fetchSubmissions();
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className={styles.loadingBox}>
        <div className="spinner" />
        <p>Authenticating...</p>
      </div>
    );
  }

  const totalEarnings = submissions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const activeCampaignsSet = new Set(
    submissions.map((s) => (typeof s.campaign === 'object' ? s.campaign?._id : s.campaign))
  );

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>Creator Dashboard</h1>
              <p className={styles.subtitle}>
                Track your active submissions, views, and milestone payouts in real-time.
              </p>
            </div>

            <Link href="/creator/campaigns" className={styles.browseBtn}>
              <span>🔍</span> Browse Campaigns
            </Link>
          </div>

          <EarningsCard
            totalEarnings={totalEarnings}
            totalSubmissions={submissions.length}
            activeCampaigns={activeCampaignsSet.size}
          />

          {error && <div className="error-message">{error}</div>}

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Submissions & Earnings</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Simulate views to test milestone payouts live
            </span>
          </div>

          {loading ? (
            <div className={styles.loadingBox}>
              <div className="spinner" />
              <p>Loading your submissions...</p>
            </div>
          ) : (
            <SubmissionList
              submissions={submissions}
              onRefresh={fetchSubmissions}
              showSimulator={true}
            />
          )}
        </div>
      </main>
    </div>
  );
}
