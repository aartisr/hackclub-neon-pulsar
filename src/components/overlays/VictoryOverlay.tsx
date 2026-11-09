import React from 'react';
import { motion } from 'framer-motion';
import { GameState } from '../../types/game';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface VictoryOverlayProps {
  gameState: GameState;
  isHost: boolean;
  onRematch: () => void;
  onLeave: () => void;
}

export const VictoryOverlay: React.FC<VictoryOverlayProps> = ({
  gameState,
  isHost,
  onRematch,
  onLeave,
}) => {
  const isTeam1Winner = gameState.score.team1 >= 5;

  return (
    <motion.div
      key="overlay-ended"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
    >
      <div className="text-center max-w-md w-full">
        <h2 className={cn(
          "font-display text-4xl sm:text-6xl font-black italic uppercase tracking-tighter mb-2",
          isTeam1Winner ? "text-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.6)]" : "text-magenta-400 shadow-[0_0_40px_rgba(217,70,239,0.6)]"
        )}>
          {isTeam1Winner ? "Cyan Victory" : "Magenta Victory"}
        </h2>
        <p className="text-white/40 uppercase tracking-widest text-xs mb-8">The Arena has been Conquered</p>
        
        {/* Final Scoreboard */}
        <div className="flex justify-center items-center gap-8 mb-8 p-6 rounded-3xl bg-white/[0.04] border border-white/10">
          <div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Cyan</div>
            <div className="font-display text-4xl font-extrabold tabular-nums text-white">{gameState.score.team1}</div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <div className="text-xs font-bold text-magenta-400 uppercase tracking-wider mb-1">Magenta</div>
            <div className="font-display text-4xl font-extrabold tabular-nums text-white">{gameState.score.team2}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isHost && (
            <button
              onClick={onRematch}
              className="w-full py-3.5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] text-sm"
            >
              Instant Rematch
            </button>
          )}
          {!isHost && (
            <div className="text-xs text-white/50 animate-pulse py-2">
              Waiting for host to initiate rematch...
            </div>
          )}
          <button
            onClick={onLeave}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
          >
            Return to Main Menu
          </button>
        </div>
      </div>
    </motion.div>
  );
};
