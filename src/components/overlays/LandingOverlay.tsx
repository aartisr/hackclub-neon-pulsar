import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LucideGamepad2, LucideUsers, LucideHelpCircle, 
  LucideChevronDown, LucideChevronUp 
} from 'lucide-react';
import { CareerStats, RankInfo, getRankInfo } from '../../hooks/useCareerStats';
import { ChassisType, CHASSIS_TYPES, COLOR_PALETTE } from '../../types/game';
import { RankEmblem } from '../ui/RankEmblem';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  onHost: () => void;
  onJoin: () => void;
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
  onHost,
  onJoin,
}) => {
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const rank = rankInfo || getRankInfo(careerStats.victories);

  return (
    <motion.div
      key="overlay-landing"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-lg my-auto rounded-3xl bg-black/85 border border-white/15 p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-magenta-500 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.6)] mb-3">
            <LucideGamepad2 size={28} className="text-black" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase italic">
            NEON PULSAR
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            Zero-G Tactical Disc Arena <span className="text-white/20">·</span> WebRTC P2P
          </p>
        </div>

        {/* Career Rank & Stats Card */}
        <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RankEmblem tier={rank.tier} size="md" />
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-white uppercase tracking-tight">{rank.title}</span>
                  <span 
                    className="text-[9px] font-black px-1.5 py-0.5 rounded font-mono-code uppercase border"
                    style={{ 
                      color: rank.primaryColor, 
                      borderColor: `${rank.primaryColor}50`,
                      backgroundColor: `${rank.primaryColor}15` 
                    }}
                  >
                    {rank.badgeLabel}
                  </span>
                </div>
                <div className="text-[10px] text-white/50 mt-0.5 font-medium">
                  {rank.nextTierTitle 
                    ? `${rank.nextTierWinsRemaining} win${rank.nextTierWinsRemaining === 1 ? '' : 's'} to ${rank.nextTierTitle}` 
                    : 'Apex Rank Achieved'}
                </div>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4 text-xs font-mono-code tabular-nums">
              <div className="text-right">
                <div className="text-[9px] text-white/40 uppercase">Goals</div>
                <div className="font-bold text-cyan-400">{careerStats.goals}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-white/40 uppercase">Wins</div>
                <div className="font-bold text-magenta-400">{careerStats.victories}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-white/40 uppercase">Win %</div>
                <div className="font-bold text-white/80">{winRate}%</div>
              </div>
            </div>
          </div>

          {/* Tier Progress Bar */}
          {rank.nextTierTitle && (
            <div className="space-y-1 pt-1 border-t border-white/5">
              <div className="flex justify-between text-[9px] font-mono-code text-white/40 uppercase">
                <span>Rank Progress</span>
                <span>{Math.round(rank.progressPercent)}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500 rounded-full" 
                  style={{ 
                    width: `${rank.progressPercent}%`,
                    backgroundColor: rank.primaryColor,
                    boxShadow: `0 0 10px ${rank.primaryColor}` 
                  }} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Pilot Customization Quick-Bar */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5 block">
              Pilot Call-Sign
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => onChangePlayerName(e.target.value)}
              maxLength={20}
              placeholder="Enter pilot name..."
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-400/60 focus:bg-white/[0.08] transition-all font-medium text-white"
            />
          </div>

          {/* Chassis Geometry & Core Color Preview */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Drone Chassis</span>
              <span className="text-[11px] font-semibold uppercase text-cyan-400">{avatarShape}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {CHASSIS_TYPES.map(ch => (
                <button
                  key={`chassis-${ch.id}`}
                  onClick={() => onChangeShape(ch.id)}
                  className={cn(
                    "py-2 px-1 rounded-xl text-[11px] font-bold uppercase transition-all border",
                    avatarShape === ch.id 
                      ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Energy Core Wavelength</span>
              <div className="flex gap-2">
                {COLOR_PALETTE.map((c, i) => (
                  <button
                    key={`core-color-${c.hex}-${i}`}
                    onClick={() => onChangeColor(c.hex)}
                    className={cn(
                      "w-6 h-6 rounded-full border transition-transform",
                      customColor === c.hex 
                        ? "scale-125 border-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" 
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Matchmaking Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onHost}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-tight transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-95 group"
            >
              <LucideUsers size={20} className="mb-1 text-black group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black">Host Arena</span>
              <span className="text-[9px] font-medium opacity-70">Solo or Multiplayer</span>
            </button>
            <button
              onClick={() => onChangeRoomCode(roomCode === 'JOIN_MODE' ? '' : 'JOIN_MODE')}
              className={cn(
                "flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 group",
                roomCode === 'JOIN_MODE'
                  ? "bg-magenta-500/20 border-magenta-500 text-magenta-300"
                  : "bg-white/5 hover:bg-white/10 border-white/15 text-white"
              )}
            >
              <LucideGamepad2 size={20} className="mb-1 text-magenta-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase">Join Arena</span>
              <span className="text-[9px] text-white/40">Connect via Code</span>
            </button>
          </div>

          {/* Direct Join Code Input Drawer */}
          {roomCode !== '' && (
            <motion.div
              key="landing-join-box"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2 pt-2"
            >
              <input
                type="text"
                placeholder="Paste Arena Code or Peer ID..."
                value={roomCode === 'JOIN_MODE' ? '' : roomCode}
                onChange={(e) => onChangeRoomCode(e.target.value)}
                className="w-full bg-white/5 border border-magenta-500/40 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-magenta-400 transition-colors font-mono-code text-center tracking-wider text-white"
              />
              <button
                onClick={onJoin}
                disabled={!roomCode || roomCode === 'JOIN_MODE'}
                className="w-full py-2.5 rounded-xl bg-magenta-500 hover:bg-magenta-400 disabled:opacity-40 text-black font-extrabold uppercase text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)]"
              >
                Connect to Arena
              </button>
            </motion.div>
          )}

          {/* Collapsible How-To-Play Guide */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => setHowToPlayOpen(prev => !prev)}
              className="w-full flex items-center justify-between text-xs text-white/60 hover:text-white py-1 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <LucideHelpCircle size={14} className="text-cyan-400" />
                Flight Controls & Rules
              </span>
              {howToPlayOpen ? <LucideChevronUp size={14} /> : <LucideChevronDown size={14} />}
            </button>

            {howToPlayOpen && (
              <motion.div
                key="how-to-play-drawer"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-white/70 space-y-2 leading-relaxed"
              >
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><strong className="text-cyan-400">WASD:</strong> Zero-G Flight</div>
                  <div><strong className="text-cyan-400">Space/Shift:</strong> Ascend/Descend</div>
                  <div><strong className="text-cyan-400">E:</strong> Throw Energy Disc</div>
                  <div><strong className="text-cyan-400">T / Y:</strong> Global / Team Chat</div>
                </div>
                <p className="text-[11px] text-white/50 pt-1 border-t border-white/5">
                  Fly into the disc to gain possession. Score in the opposing team's glowing portal. First to 5 points conquers the arena!
                </p>
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
