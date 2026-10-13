'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Campaign } from '@/types';
import Navbar from '@/components/Navbar';
import CampaignCard from '@/components/CampaignCard';
import { Search, Layers, Inbox } from 'lucide-react';
import { Instagram, Youtube } from '@/components/icons';
import styles from './browse.module.css';

export default function BrowseCampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'instagram' | 'youtube'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = (await api.getCampaigns()) as any;
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

    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesPlatform = filterPlatform === 'all' || c.platform === filterPlatform;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Browse Campaigns</h1>
            <p className={styles.subtitle}>
              Pick a campaign, submit your Instagram Reels or YouTube videos, and earn as your views climb!
            </p>
          </div>

          <div className={styles.filterBar}>
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search campaigns by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.platformFilters}>
              <button
                className={`${styles.filterBtn} ${filterPlatform === 'all' ? styles.filterBtnActive : ''}`}
                onClick={() => setFilterPlatform('all')}
              >
                <Layers size={14} />
                <span>All Platforms</span>
              </button>
              <button
                className={`${styles.filterBtn} ${filterPlatform === 'instagram' ? styles.filterBtnActive : ''}`}
                onClick={() => setFilterPlatform('instagram')}
              >
                <Instagram size={14} />
                <span>Instagram</span>
              </button>
              <button
                className={`${styles.filterBtn} ${filterPlatform === 'youtube' ? styles.filterBtnActive : ''}`}
                onClick={() => setFilterPlatform('youtube')}
              >
                <Youtube size={14} />
                <span>YouTube</span>
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className={styles.loadingBox}>
              <div className="spinner" />
              <p>Loading available campaigns...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}>
                <Inbox size={36} className={styles.emptyIcon} />
              </div>
              <h3 className={styles.emptyTitle}>No matching campaigns found</h3>
              <p className={styles.emptyText}>Try adjusting your search or clearing filters.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredCampaigns.map((c) => (
                <CampaignCard
                  key={c._id}
                  campaign={c}
                  showBudget={true}
                  actionLabel="Submit Post Link"
                  onAction={() => router.push(`/creator/campaigns/${c.slug || c._id}`)}
                  onClick={() => router.push(`/creator/campaigns/${c.slug || c._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
