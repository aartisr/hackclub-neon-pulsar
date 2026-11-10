import React from 'react';
import { motion } from 'framer-motion';
import { 
  LucidePlay, LucideShare2, LucideCheck, LucideCopy, 
  LucideLogOut, LucideSparkles 
} from 'lucide-react';
import { GameState, ChassisType } from '../../types/game';

export interface LobbyOverlayProps {
  gameState: GameState;
  myId: string;
  isHost: boolean;
  playerName: string;
  customColor: string;
  avatarShape: ChassisType;
  copiedInvite: boolean;
  copiedRoomCode: boolean;
  copyError: string;
  roomCode: string;
  onCopyInvite: () => void;
  onCopyRoomCode: () => void;
  onLeave: () => void;
  onOpenCustomizer: () => void;
  onSwitchTeam: (team: 1 | 2) => void;
  onStartGame: () => void;
}

export const LobbyOverlay: React.FC<LobbyOverlayProps> = ({
  gameState,
  myId,
  isHost,
  playerName,
  customColor,
  avatarShape,
  copiedInvite,
  copiedRoomCode,
  copyError,
  roomCode,
  onCopyInvite,
  onCopyRoomCode,
  onLeave,
  onOpenCustomizer,
  onSwitchTeam,
  onStartGame,
}) => {
  const team1Players = Object.values(gameState.players).filter(p => p.team === 1);
  const team2Players = Object.values(gameState.players).filter(p => p.team === 2);
  const myPlayer = gameState.players[myId];

  return (
    <motion.div
      key="overlay-lobby"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="safe-screen absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-md overflow-y-auto overscroll-contain"
    >
      <div className="premium-panel w-full max-w-2xl my-auto p-4 min-[375px]:p-6 sm:p-8 rounded-3xl">
        
        {/* Lobby Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display text-2xl font-black uppercase italic tracking-tight text-white">Combat Lobby</h2>
              {isHost && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  HOST
                </span>
              )}
            </div>
            <div className="text-xs text-white/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{Object.keys(gameState.players).length} Pilots Connected</span>
              <span className="text-white/20">·</span>
              <span>Standard Match (First to 5)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCopyInvite}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold transition-all hover:border-cyan-400/50"
              title="Copy invite link"
            >
              {copiedInvite ? (
                <>
                  <LucideCheck size={14} className="text-emerald-400" />
                  <span className="text-emerald-300 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <LucideShare2 size={14} className="text-cyan-400" />
                  <span>Copy Invite Link</span>
                </>
              )}
            </button>

            <button
              onClick={onLeave}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/15 hover:border-red-500/40 text-white/50 hover:text-red-400 transition-colors"
              title="Leave Lobby"
            >
              <LucideLogOut size={16} />
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Room Code</div>
            <code className="block overflow-x-auto whitespace-nowrap text-xs text-cyan-300 select-all">{roomCode}</code>
          </div>
          <button
            onClick={onCopyRoomCode}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold hover:border-cyan-400/50 hover:bg-white/10"
            title="Copy full room code"
          >
            {copiedRoomCode ? <LucideCheck size={14} /> : <LucideCopy size={14} />}
            {copiedRoomCode ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        {copyError && <p role="alert" className="mb-4 text-xs text-red-300">{copyError}</p>}

        {/* Pilot Active Chassis Badge & Customize Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 shadow-md"
              style={{ backgroundColor: customColor + '25', borderColor: customColor }}
            >
              <LucideSparkles size={18} style={{ color: customColor }} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Blueprint</div>
              <div className="text-xs font-bold uppercase tracking-tight text-white">{avatarShape} Chassis · {playerName}</div>
            </div>
          </div>
          <button
            onClick={onOpenCustomizer}
            className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-wider transition-colors hover:border-cyan-400/50 text-white"
          >
            Configure
          </button>
        </div>

        {/* Team Rosters with Team Switch Ability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
          {/* Team Cyan */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                Team Cyan
              </h3>
              {myPlayer?.team !== 1 && (
                <button
                  onClick={() => onSwitchTeam(1)}
                  className="text-[10px] font-bold text-cyan-300 hover:text-white uppercase tracking-wider underline underline-offset-2"
                >
                  Join Team
                </button>
              )}
            </div>
            <div className="space-y-2 min-h-[90px]">
              {team1Players.map((p, pIdx) => (
                <div 
                  key={`lobby-cyan-${p.id || 'pilot'}-${pIdx}`} 
                  className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-white"
                >
                  <span className="truncate">
                    {p.name} {p.id === myId && <span className="text-cyan-400 font-bold">(You)</span>}
                  </span>
                  <span className="text-[10px] font-mono-code text-cyan-300/60 uppercase">{p.avatarShape}</span>
                </div>
              ))}
              {team1Players.length === 0 && (
                <div className="text-xs text-white/30 italic py-4 text-center">No pilots assigned</div>
              )}
            </div>
          </div>

          {/* Team Magenta */}
          <div className="p-4 rounded-2xl bg-magenta-950/20 border border-magenta-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xs font-black text-magenta-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-magenta-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
                Team Magenta
              </h3>
              {myPlayer?.team !== 2 && (
                <button
                  onClick={() => onSwitchTeam(2)}
                  className="text-[10px] font-bold text-magenta-300 hover:text-white uppercase tracking-wider underline underline-offset-2"
                >
                  Join Team
                </button>
              )}
            </div>
            <div className="space-y-2 min-h-[90px]">
              {team2Players.map((p, pIdx) => (
                <div 
                  key={`lobby-magenta-${p.id || 'pilot'}-${pIdx}`} 
                  className="flex items-center justify-between p-2.5 rounded-xl bg-magenta-500/10 border border-magenta-500/20 text-xs font-medium text-white"
                >
                  <span className="truncate">
                    {p.name} {p.id === myId && <span className="text-magenta-400 font-bold">(You)</span>}
                  </span>
                  <span className="text-[10px] font-mono-code text-magenta-300/60 uppercase">{p.avatarShape}</span>
                </div>
              ))}
              {team2Players.length === 0 && (
                <div className="text-xs text-white/30 italic py-4 text-center">No pilots assigned</div>
              )}
            </div>
          </div>

        </div>

        {/* Launch Action */}
        {isHost ? (
          <button
            onClick={onStartGame}
            className="w-full min-h-12 py-3 rounded-2xl bg-gradient-to-r from-cyan-200 via-white to-fuchsia-200 hover:brightness-110 text-slate-950 font-black uppercase tracking-wider sm:tracking-[0.2em] transition-all flex items-center justify-center gap-2.5 shadow-[0_0_40px_rgba(103,232,249,0.3)] active:scale-95"
          >
            <LucidePlay size={18} fill="currentColor" />
            Initiate Combat Round
          </button>
        ) : (
          <div className="text-center py-3 text-xs text-white/50 animate-pulse font-mono-code">
            Waiting for arena host to initiate combat sequence...
          </div>
        )}
      </div>
    </motion.div>
  );
};
