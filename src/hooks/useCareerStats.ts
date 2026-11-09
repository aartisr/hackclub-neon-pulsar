/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

export type CareerStats = {
  goals: number;
  gamesPlayed: number;
  victories: number;
};

export type RankTier = 'bronze' | 'silver' | 'gold' | 'neon';

export interface RankInfo {
  tier: RankTier;
  title: string;
  badgeLabel: string;
  primaryColor: string;
  secondaryColor: string;
  nextTierTitle: string | null;
  victoriesInTier: number;
  victoriesNeededForNextTier: number;
  nextTierWinsRemaining: number;
  progressPercent: number;
}

const STORAGE_KEY = 'neon_pulsar_career_stats';

const DEFAULT_STATS: CareerStats = {
  goals: 0,
  gamesPlayed: 0,
  victories: 0,
};

export function getRankInfo(victories: number): RankInfo {
  if (victories < 5) {
    // Bronze Tier: 0 - 4 Wins
    return {
      tier: 'bronze',
      title: 'Bronze Pilot',
      badgeLabel: 'BRONZE I',
      primaryColor: '#cd7f32',
      secondaryColor: '#b87333',
      nextTierTitle: 'Silver Operative',
      victoriesInTier: victories,
      victoriesNeededForNextTier: 5,
      nextTierWinsRemaining: 5 - victories,
      progressPercent: Math.min(100, Math.max(0, (victories / 5) * 100)),
    };
  } else if (victories < 10) {
    // Silver Tier: 5 - 9 Wins
    const tierVictories = victories - 5;
    return {
      tier: 'silver',
      title: 'Silver Operative',
      badgeLabel: 'SILVER II',
      primaryColor: '#e2e8f0',
      secondaryColor: '#94a3b8',
      nextTierTitle: 'Gold Commander',
      victoriesInTier: tierVictories,
      victoriesNeededForNextTier: 5,
      nextTierWinsRemaining: 10 - victories,
      progressPercent: Math.min(100, Math.max(0, (tierVictories / 5) * 100)),
    };
  } else if (victories < 20) {
    // Gold Tier: 10 - 19 Wins
    const tierVictories = victories - 10;
    return {
      tier: 'gold',
      title: 'Gold Commander',
      badgeLabel: 'GOLD III',
      primaryColor: '#f59e0b',
      secondaryColor: '#eab308',
      nextTierTitle: 'Neon Apex Legend',
      victoriesInTier: tierVictories,
      victoriesNeededForNextTier: 10,
      nextTierWinsRemaining: 20 - victories,
      progressPercent: Math.min(100, Math.max(0, (tierVictories / 10) * 100)),
    };
  } else {
    // Neon Tier: 20+ Wins
    return {
      tier: 'neon',
      title: 'Neon Apex Legend',
      badgeLabel: 'PULSAR APEX',
      primaryColor: '#06b6d4',
      secondaryColor: '#d946ef',
      nextTierTitle: null,
      victoriesInTier: victories,
      victoriesNeededForNextTier: victories,
      nextTierWinsRemaining: 0,
      progressPercent: 100,
    };
  }
}

export function useCareerStats() {
  const [stats, setStats] = useState<CareerStats>(() => {
    if (typeof window === 'undefined') return DEFAULT_STATS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_STATS, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Failed to parse career stats', e);
      }
    }
    return DEFAULT_STATS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats]);

  const addGoal = () => {
    setStats(prev => ({ ...prev, goals: prev.goals + 1 }));
  };

  const addGame = (victory: boolean) => {
    setStats(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      victories: victory ? prev.victories + 1 : prev.victories,
    }));
  };

  const rankInfo = getRankInfo(stats.victories);
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.victories / stats.gamesPlayed) * 100) : 0;

  return { stats, rankInfo, winRate, addGoal, addGame };
}
