/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CareerStats, getRankInfo, RankTier } from '../hooks/useCareerStats';
import { ChassisType } from '../types/game';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  playerName: string;
  avatarShape: ChassisType;
  customColor: string;
  victories: number;
  goals: number;
  gamesPlayed: number;
  winRate: number;
  rankTier: RankTier;
  badgeLabel: string;
  isCurrentPlayer?: boolean;
}

// Initial mock public Firestore collection entries
const INITIAL_LEADERBOARD_COLLECTION: Omit<LeaderboardEntry, 'rank' | 'rankTier' | 'badgeLabel'>[] = [
  {
    id: 'pilot-top-1',
    playerName: 'Apex_Pulsar99',
    avatarShape: 'octa',
    customColor: '#06b6d4',
    victories: 42,
    goals: 184,
    gamesPlayed: 48,
    winRate: 88,
  },
  {
    id: 'pilot-top-2',
    playerName: 'CyberValkyrie',
    avatarShape: 'sphere',
    customColor: '#d946ef',
    victories: 35,
    goals: 142,
    gamesPlayed: 43,
    winRate: 81,
  },
  {
    id: 'pilot-top-3',
    playerName: 'NovaStriker',
    avatarShape: 'capsule',
    customColor: '#10b981',
    victories: 28,
    goals: 115,
    gamesPlayed: 37,
    winRate: 76,
  },
  {
    id: 'pilot-top-4',
    playerName: 'QuantumRift',
    avatarShape: 'cube',
    customColor: '#f59e0b',
    victories: 22,
    goals: 98,
    gamesPlayed: 31,
    winRate: 71,
  },
  {
    id: 'pilot-top-5',
    playerName: 'ZeroG_Phantom',
    avatarShape: 'octa',
    customColor: '#ef4444',
    victories: 19,
    goals: 86,
    gamesPlayed: 28,
    winRate: 68,
  },
  {
    id: 'pilot-top-6',
    playerName: 'Hyperion_X',
    avatarShape: 'sphere',
    customColor: '#ffffff',
    victories: 14,
    goals: 62,
    gamesPlayed: 22,
    winRate: 64,
  },
  {
    id: 'pilot-top-7',
    playerName: 'SolarEclipse',
    avatarShape: 'capsule',
    customColor: '#d946ef',
    victories: 11,
    goals: 49,
    gamesPlayed: 18,
    winRate: 61,
  },
  {
    id: 'pilot-top-8',
    playerName: 'AetherKnight',
    avatarShape: 'cube',
    customColor: '#06b6d4',
    victories: 8,
    goals: 35,
    gamesPlayed: 14,
    winRate: 57,
  },
  {
    id: 'pilot-top-9',
    playerName: 'NebulaDrifter',
    avatarShape: 'capsule',
    customColor: '#10b981',
    victories: 4,
    goals: 21,
    gamesPlayed: 8,
    winRate: 50,
  },
  {
    id: 'pilot-top-10',
    playerName: 'VectorPulse',
    avatarShape: 'sphere',
    customColor: '#f59e0b',
    victories: 3,
    goals: 12,
    gamesPlayed: 7,
    winRate: 43,
  },
];

/**
 * Mock Firestore Public Leaderboard Service
 * Simulates fetching top 10 public career stats from Firestore public collection 'career_leaderboards'
 */
export async function fetchTop10Leaderboard(
  currentPlayerName: string,
  currentStats: CareerStats,
  currentShape: ChassisType,
  currentColor: string,
  sortBy: 'victories' | 'goals' | 'winRate' = 'victories'
): Promise<LeaderboardEntry[]> {
  // Simulate network latency (250ms)
  await new Promise((resolve) => setTimeout(resolve, 250));

  const entriesMap = new Map<string, Omit<LeaderboardEntry, 'rank' | 'rankTier' | 'badgeLabel'>>();

  INITIAL_LEADERBOARD_COLLECTION.forEach((item) => {
    entriesMap.set(item.id, { ...item });
  });

  // Inject current player's career totals
  const currentWinRate =
    currentStats.gamesPlayed > 0
      ? Math.round((currentStats.victories / currentStats.gamesPlayed) * 100)
      : 0;

  entriesMap.set('local-player-self', {
    id: 'local-player-self',
    playerName: currentPlayerName || 'Local Pilot',
    avatarShape: currentShape,
    customColor: currentColor,
    victories: currentStats.victories,
    goals: currentStats.goals,
    gamesPlayed: currentStats.gamesPlayed,
    winRate: currentWinRate,
    isCurrentPlayer: true,
  });

  const allEntries = Array.from(entriesMap.values());

  // Sort based on criteria
  allEntries.sort((a, b) => {
    if (b[sortBy] !== a[sortBy]) {
      return b[sortBy] - a[sortBy];
    }
    // Secondary tie-breaker by victories or goals
    return b.victories - a.victories;
  });

  // Process top 10 with ranks and rank tier badges
  const top10 = allEntries.slice(0, 10).map((entry, index) => {
    const rankInfo = getRankInfo(entry.victories);
    return {
      ...entry,
      rank: index + 1,
      rankTier: rankInfo.tier,
      badgeLabel: rankInfo.badgeLabel,
    };
  });

  return top10;
}
