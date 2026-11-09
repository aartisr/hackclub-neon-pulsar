/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LucideTrophy, LucideFlame, LucideRefreshCw, LucideAward, 
  LucideTarget, LucideZap 
} from 'lucide-react';
import { CareerStats } from '../../hooks/useCareerStats';
import { ChassisType } from '../../types/game';
import { fetchTop10Leaderboard, LeaderboardEntry } from '../../services/leaderboardService';
import { RankEmblem } from '../ui/RankEmblem';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface GlobalLeaderboardProps {
  currentPlayerName: string;
  careerStats: CareerStats;
  avatarShape: ChassisType;
  customColor: string;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  currentPlayerName,
  careerStats,
  avatarShape,
  customColor,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'victories' | 'goals' | 'winRate'>('victories');

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTop10Leaderboard(
        currentPlayerName,
        careerStats,
        avatarShape,
        customColor,
        sortBy
      );
      setEntries(data);
    } catch (e) {
      console.error('Failed to load global leaderboard', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentPlayerName, careerStats, avatarShape, customColor, sortBy]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <div className="w-full space-y-4">
      {/* Header Bar: Title, Sort Pills & Manual Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <LucideTrophy size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              Global Arena Standings
              <span className="text-[10px] font-mono-code font-normal px-2 py-0.5 rounded-md bg-white/10 text-cyan-300">
                TOP 10
              </span>
            </h3>
            <p className="text-[10px] text-white/40 font-mono-code">Public Firestore Telemetry Stream</p>
          </div>
        </div>

        {/* Filter Controls & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-[11px]">
            <button
              onClick={() => setSortBy('victories')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1",
                sortBy === 'victories'
                  ? "bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                  : "text-white/60 hover:text-white"
              )}
            >
              <LucideAward size={12} />
              <span>Wins</span>
            </button>
            <button
              onClick={() => setSortBy('goals')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1",
                sortBy === 'goals'
                  ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                  : "text-white/60 hover:text-white"
              )}
            >
              <LucideTarget size={12} />
              <span>Goals</span>
            </button>
            <button
              onClick={() => setSortBy('winRate')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1",
                sortBy === 'winRate'
                  ? "bg-magenta-500 text-black shadow-[0_0_12px_rgba(217,70,239,0.5)]"
                  : "text-white/60 hover:text-white"
              )}
            >
              <LucideZap size={12} />
              <span>Win %</span>
            </button>
          </div>

          <button
            onClick={loadLeaderboard}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white disabled:opacity-40 transition-colors"
            title="Refresh Leaderboard"
          >
            <LucideRefreshCw size={14} className={cn(isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div 
                key={`skeleton-${idx}`} 
                className="h-12 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" 
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-xs text-white/40">
            No global telemetry records found.
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {entries.map((player) => {
              const isTop3 = player.rank <= 3;
              const rankColor = 
                player.rank === 1 ? '#f59e0b' : 
                player.rank === 2 ? '#e2e8f0' : 
                player.rank === 3 ? '#cd7f32' : '#ffffff';

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "p-3 rounded-2xl border transition-all flex items-center justify-between gap-3",
                    player.isCurrentPlayer
                      ? "bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : isTop3
                      ? "bg-white/[0.05] border-white/15"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  {/* Left: Rank & Pilot Identity */}
                  <div className="flex items-center gap-3">
                    {/* Rank Number / Medal */}
                    <div className="w-8 h-8 flex items-center justify-center font-display font-black text-sm shrink-0">
                      {player.rank === 1 ? (
                        <span className="text-amber-400 text-base drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">🥇</span>
                      ) : player.rank === 2 ? (
                        <span className="text-slate-300 text-base drop-shadow-[0_0_8px_rgba(226,232,240,0.8)]">🥈</span>
                      ) : player.rank === 3 ? (
                        <span className="text-amber-700 text-base drop-shadow-[0_0_8px_rgba(205,127,50,0.8)]">🥉</span>
                      ) : (
                        <span className="text-white/40 font-mono-code">#{player.rank}</span>
                      )}
                    </div>

                    {/* Emblem & Callsign */}
                    <div className="flex items-center gap-2.5">
                      <RankEmblem tier={player.rankTier} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-tight",
                            player.isCurrentPlayer ? "text-cyan-300 font-extrabold" : "text-white"
                          )}>
                            {player.playerName}
                          </span>
                          {player.isCurrentPlayer && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-400 text-black uppercase">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/50 font-mono-code">
                          <span className="flex items-center gap-1">
                            <span 
                              className="w-2 h-2 rounded-full inline-block" 
                              style={{ backgroundColor: player.customColor }} 
                            />
                            {player.avatarShape}
                          </span>
                          <span>·</span>
                          <span className="text-white/40">{player.badgeLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Career Totals Stats */}
                  <div className="flex items-center gap-3 sm:gap-5 text-right font-mono-code text-xs tabular-nums">
                    <div>
                      <div className="text-[9px] text-white/40 uppercase">Wins</div>
                      <div className="font-extrabold text-amber-400">{player.victories}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/40 uppercase">Goals</div>
                      <div className="font-bold text-cyan-400">{player.goals}</div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-[9px] text-white/40 uppercase">Win %</div>
                      <div className="font-bold text-magenta-300">{player.winRate}%</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
