import { cn } from '../../lib/ui/cn';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LucideGamepad2, LucideTrophy } from 'lucide-react';
import { CareerStats, RankInfo, getRankInfo } from '../../hooks/useCareerStats';
import { ChassisType } from '../../types/game';
import { GlobalLeaderboard } from '../leaderboard/GlobalLeaderboard';
import { SiteAttribution } from '../ui/SiteAttribution';
import { CareerSummary } from '../landing/CareerSummary';
import { PilotSetup } from '../landing/PilotSetup';
import { MatchmakingPanel } from '../landing/MatchmakingPanel';

export interface LandingOverlayProps {
  playerName: string;
  onChangePlayerName: (name: string) => void;
  avatarShape: ChassisType;
  onChangeShape: (shape: ChassisType) => void;
  customColor: string;
  onChangeColor: (color: string) => void;
  roomCode: string;
  onChangeRoomCode: (code: string) => void;
  careerStats: CareerStats;
  rankInfo?: RankInfo;
  winRate?: number;
  onQuickMatch: () => void;
  onHost: () => void;
  onJoin: () => void;
  joining: boolean;
  joinError: string;
}

export const LandingOverlay: React.FC<LandingOverlayProps> = ({
  playerName,
  onChangePlayerName,
  avatarShape,
  onChangeShape,
  customColor,
  onChangeColor,
  roomCode,
  onChangeRoomCode,
  careerStats,
  rankInfo,
  winRate = 0,
  onQuickMatch,
  onHost,
  onJoin,
  joining,
  joinError,
}) => {
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard'>('play');
  const rank = rankInfo || getRankInfo(careerStats.victories);

  return (
    <motion.div
      key="overlay-landing"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="safe-screen absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md overflow-y-auto overscroll-contain"
    >
      <div className="premium-panel w-full max-w-lg my-auto rounded-3xl p-4 min-[375px]:p-6 sm:p-8">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-magenta-500 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.6)] mb-3">
            <LucideGamepad2 size={28} className="text-black" />
          </div>
          <h1 className="font-display bg-gradient-to-r from-white via-cyan-200 to-fuchsia-300 bg-clip-text text-[clamp(1.5rem,8vw,2.25rem)] font-extrabold tracking-tight text-transparent uppercase italic">
            NEON PULSAR
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            Zero-G Tactical Disc Arena <span className="text-white/20">·</span> WebRTC P2P
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('play')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
              activeTab === 'play'
                ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                : "text-white/60 hover:text-white"
            )}
          >
            <LucideGamepad2 size={16} />
            <span>Play Arena</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
              activeTab === 'leaderboard'
                ? "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                : "text-white/60 hover:text-white"
            )}
          >
            <LucideTrophy size={16} />
            <span>Sample Standings</span>
          </button>
        </div>

        {activeTab === 'play' ? (
          <>
            <PilotSetup
              playerName={playerName}
              onChangePlayerName={onChangePlayerName}
              avatarShape={avatarShape}
              onChangeShape={onChangeShape}
              customColor={customColor}
              onChangeColor={onChangeColor}
            />
            <MatchmakingPanel
              roomCode={roomCode}
              onChangeRoomCode={onChangeRoomCode}
              onQuickMatch={onQuickMatch}
              onHost={onHost}
              onJoin={onJoin}
              joining={joining}
              joinError={joinError}
            />
            <div className="mt-5 border-t border-white/10 pt-5">
              <CareerSummary rank={rank} careerStats={careerStats} winRate={winRate} />
            </div>
          </>
        ) : (
          <GlobalLeaderboard
            currentPlayerName={playerName}
            careerStats={careerStats}
            avatarShape={avatarShape}
            customColor={customColor}
          />
        )}

        <SiteAttribution />

      </div>
    </motion.div>
  );
};
