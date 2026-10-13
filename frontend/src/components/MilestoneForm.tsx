'use client';

import { Milestone } from '@/types';
import { Target, Plus, Trash2, Sparkles } from 'lucide-react';
import styles from './MilestoneForm.module.css';

interface MilestoneFormProps {
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
}

export default function MilestoneForm({ milestones, onChange }: MilestoneFormProps) {
  const handleAddMilestone = () => {
    const lastViews = milestones.length > 0 ? milestones[milestones.length - 1].views : 0;
    const lastPayout = milestones.length > 0 ? milestones[milestones.length - 1].payout : 0;
    onChange([
      ...milestones,
      {
        views: lastViews + 10000,
        payout: lastPayout + 500,
      },
    ]);
  };

  const handleUpdate = (index: number, field: 'views' | 'payout', value: number) => {
    const updated = [...milestones];
    updated[index] = {
      ...updated[index],
      [field]: Math.max(0, value),
    };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    if (milestones.length <= 1) return;
    onChange(milestones.filter((_, i) => i !== index));
  };

  const applyPreset = (preset: 'standard' | 'viral') => {
    if (preset === 'standard') {
      onChange([
        { views: 5000, payout: 250 },
        { views: 10000, payout: 600 },
        { views: 25000, payout: 1500 },
        { views: 50000, payout: 3500 },
      ]);
    } else {
      onChange([
        { views: 20000, payout: 1000 },
        { views: 50000, payout: 3000 },
        { views: 100000, payout: 7500 },
        { views: 250000, payout: 20000 },
      ]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Target size={16} className={styles.titleIcon} />
          <span>Milestone Payout Ladder</span>
        </div>
        <div className={styles.presets}>
          <span className={styles.presetLabel}>Presets:</span>
          <button type="button" onClick={() => applyPreset('standard')} className={styles.presetBtn}>
            Standard
          </button>
          <button type="button" onClick={() => applyPreset('viral')} className={styles.presetBtn}>
            Viral
          </button>
        </div>
      </div>

      <div className={styles.rowsList}>
        {milestones.map((m, idx) => (
          <div key={idx} className={styles.row}>
            <span className={styles.tierBadge}>T{idx + 1}</span>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Views Target</label>
              <input
                type="number"
                min="1"
                step="500"
                value={m.views === 0 ? '' : m.views}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdate(idx, 'views', val === '' ? 0 : parseInt(val, 10) || 0);
                }}
                placeholder="e.g. 5000"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Payout (₹)</label>
              <input
                type="number"
                min="1"
                step="100"
                value={m.payout === 0 ? '' : m.payout}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdate(idx, 'payout', val === '' ? 0 : parseInt(val, 10) || 0);
                }}
                placeholder="e.g. 250"
                className={styles.input}
                required
              />
            </div>

            {milestones.length > 1 ? (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className={styles.removeBtn}
                title="Remove tier"
              >
                <Trash2 size={15} />
              </button>
            ) : <span className={styles.spacer} />}
          </div>
        ))}
      </div>

      <button type="button" onClick={handleAddMilestone} className={styles.addRowBtn}>
        <Plus size={15} />
        <span>Add Milestone Tier</span>
      </button>
    </div>
  );
}
