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

const STORAGE_KEY = 'neon_pulsar_career_stats';

const DEFAULT_STATS: CareerStats = {
  goals: 0,
  gamesPlayed: 0,
  victories: 0,
};

export function useCareerStats() {
  const [stats, setStats] = useState<CareerStats>(() => {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
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

  return { stats, addGoal, addGame };
}
