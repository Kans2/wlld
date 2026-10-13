'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Campaign } from '@/types';
import Navbar from '@/components/Navbar';
import CampaignCard from '@/components/CampaignCard';
import { Plus, Layers, Activity, Wallet, TrendingDown, Coins, Megaphone } from 'lucide-react';
import styles from './brand.module.css';

export default function BrandDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'brand') {
      router.push('/creator');
    }
  }, [user, authLoading, router]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.getMyCampaigns()) as any;
      const list = Array.isArray(res?.data) ? res.data : res?.data?.campaigns || [];
      setCampaigns(list);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch campaigns');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'brand') {
      fetchCampaigns();
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

  const totalBudget = campaigns.reduce((acc, c) => acc + (c.totalBudget || 0), 0);
  const totalSpent = campaigns.reduce((acc, c) => acc + (c.budgetSpent || 0), 0);
  const remainingBudget = totalBudget - totalSpent;
  const activeCount = campaigns.filter((c) => c.status === 'live').length;

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>Brand Dashboard</h1>
              <p className={styles.subtitle}>
                Manage campaigns, monitor milestones, and track real-time payouts.
              </p>
            </div>

            <Link href="/brand/campaigns/new" className={styles.createBtn}>
              <Plus size={16} />
              <span>Create Campaign</span>
            </Link>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <span className={styles.statCardLabel}>Total Campaigns</span>
                <Layers size={15} className={styles.statIcon} />
              </div>
              <div className={styles.statCardVal}>{campaigns.length}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <span className={styles.statCardLabel}>Active (Live)</span>
                <Activity size={15} className={styles.statIcon} />
              </div>
              <div className={`${styles.statCardVal} ${styles.valGood}`}>
                {activeCount}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <span className={styles.statCardLabel}>Total Budget</span>
                <Wallet size={15} className={styles.statIcon} />
              </div>
              <div className={styles.statCardVal}>₹{totalBudget.toLocaleString()}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <span className={styles.statCardLabel}>Payouts Spent</span>
                <TrendingDown size={15} className={styles.statIcon} />
              </div>
              <div className={`${styles.statCardVal} ${styles.valSpent}`}>
                ₹{totalSpent.toLocaleString()}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <span className={styles.statCardLabel}>Remaining Budget</span>
                <Coins size={15} className={styles.statIcon} />
              </div>
              <div className={`${styles.statCardVal} ${styles.valBrand}`}>
                ₹{remainingBudget.toLocaleString()}
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Campaigns</h2>
          </div>

          {loading ? (
            <div className={styles.loadingBox}>
              <div className="spinner" />
              <p>Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}>
                <Megaphone size={36} className={styles.emptyIcon} />
              </div>
              <h3 className={styles.emptyTitle}>No campaigns created yet</h3>
              <p className={styles.emptyDesc}>
                Launch your first campaign with milestone-based payouts today!
              </p>
              <Link href="/brand/campaigns/new" className={styles.createBtn}>
                <Plus size={16} />
                <span>Launch Campaign</span>
              </Link>
            </div>
          ) : (
            <div className={styles.campaignsGrid}>
              {campaigns.map((camp) => (
                <CampaignCard
                  key={camp._id}
                  campaign={camp}
                  showBudget={true}
                  actionLabel="View Details & Submissions"
                  onAction={() => router.push(`/brand/campaigns/${camp._id}`)}
                  onClick={() => router.push(`/brand/campaigns/${camp._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
