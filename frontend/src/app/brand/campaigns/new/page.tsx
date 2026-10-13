'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Milestone } from '@/types';
import Navbar from '@/components/Navbar';
import MilestoneForm from '@/components/MilestoneForm';
import styles from './new.module.css';

export default function NewCampaignPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'youtube'>('instagram');
  const [totalBudget, setTotalBudget] = useState<number>(20000);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { views: 5000, payout: 250 },
    { views: 10000, payout: 600 },
    { views: 25000, payout: 1500 },
    { views: 50000, payout: 3500 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Campaign name is required');
      return;
    }
    if (totalBudget <= 0) {
      setError('Total budget must be greater than 0');
      return;
    }
    if (milestones.length === 0) {
      setError('At least one milestone is required');
      return;
    }

    // Sort milestones ascending by views
    const sortedMilestones = [...milestones].sort((a, b) => a.views - b.views);

    try {
      setLoading(true);
      setError(null);
      await api.createCampaign({
        name: name.trim(),
        platform,
        totalBudget,
        milestones: sortedMilestones,
      });
      router.push('/brand');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create campaign');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />

      <main className={styles.main}>
        <div className="container">
          <Link href="/brand" className={styles.backLink}>
            ← Back to Dashboard
          </Link>

          <div className={styles.card}>
            <h1 className={styles.title}>Create New Campaign</h1>
            <p className={styles.subtitle}>
              Configure your budget and reward creators as their posts cross view milestones.
            </p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Viral Reels Challenge"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Target Platform</label>
                <div className={styles.platformSelector}>
                  <div
                    className={`${styles.platformOption} ${
                      platform === 'instagram' ? styles.platformActive : ''
                    }`}
                    onClick={() => setPlatform('instagram')}
                  >
                    <span>📸</span> Instagram Reels
                  </div>
                  <div
                    className={`${styles.platformOption} ${
                      platform === 'youtube' ? styles.platformActive : ''
                    }`}
                    onClick={() => setPlatform('youtube')}
                  >
                    <span>🎬</span> YouTube Shorts / Videos
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Total Campaign Budget (₹ INR)</label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseInt(e.target.value) || 0)}
                  placeholder="20000"
                  className={styles.input}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Total pool budget that caps payouts. Once exhausted, further milestone payouts are stopped.
                </span>
              </div>

              <div className={styles.divider} />

              <MilestoneForm milestones={milestones} onChange={setMilestones} />

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Creating Campaign...' : 'Launch Campaign 🚀'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
