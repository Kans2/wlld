'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Milestone } from '@/types';
import Navbar from '@/components/Navbar';
import MilestoneForm from '@/components/MilestoneForm';
import { ArrowLeft, Rocket } from 'lucide-react';
import { Instagram, Youtube } from '@/components/icons';
import styles from './new.module.css';

export default function NewCampaignPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'youtube'>('instagram');
  const [totalBudget, setTotalBudget] = useState<number | ''>(20000);
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
    const numericBudget = totalBudget === '' ? 0 : totalBudget;
    if (numericBudget <= 0) {
      setError('Total budget must be greater than 0');
      return;
    }
    if (milestones.length === 0) {
      setError('At least one milestone is required');
      return;
    }
    if (milestones.some((m) => !m.views || m.views <= 0 || !m.payout || m.payout <= 0)) {
      setError('All milestone view targets and payouts must be greater than 0');
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
        totalBudget: numericBudget,
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
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
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
                    <Instagram size={18} />
                    <span>Instagram Reels</span>
                  </div>
                  <div
                    className={`${styles.platformOption} ${
                      platform === 'youtube' ? styles.platformActive : ''
                    }`}
                    onClick={() => setPlatform('youtube')}
                  >
                    <Youtube size={18} />
                    <span>YouTube Shorts / Videos</span>
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setTotalBudget(val === '' ? '' : parseInt(val, 10) || 0);
                  }}
                  placeholder="e.g. 20000"
                  className={styles.input}
                  required
                />
                <span className={styles.hint}>
                  Total pool budget that caps payouts. Once exhausted, further milestone payouts are stopped.
                </span>
              </div>

              <div className={styles.divider} />

              <MilestoneForm milestones={milestones} onChange={setMilestones} />

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                <Rocket size={16} />
                <span>{loading ? 'Creating Campaign...' : 'Launch Campaign'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
