import React from 'react';
import { LucideLogOut } from 'lucide-react';

export interface ScoreboardProps {
  score: { team1: number; team2: number };
  time: number;
  onLeave: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ score, time, onLeave }) => {
  const totalSecs = Math.floor(time);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="flex w-full items-start justify-between gap-2 pointer-events-none">
      {/* Scoreboard */}
      <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-black/75 px-2.5 py-2.5 shadow-2xl backdrop-blur-xl pointer-events-auto sm:gap-6 sm:px-5 sm:py-3">
        <div className="text-center">
          <div className="mb-0.5 text-[9px] font-black uppercase text-cyan-400 sm:tracking-widest"><span className="sm:hidden">Cyan</span><span className="hidden sm:inline">Team Cyan</span></div>
          <div className="font-display text-2xl sm:text-3xl font-black tabular-nums text-white leading-none">
            {score.team1}
          </div>
        </div>
        <div className="w-px h-6 sm:h-8 bg-white/15" />
        <div className="text-center">
          <div className="mb-0.5 text-[9px] font-black uppercase text-magenta-400 sm:tracking-widest"><span className="sm:hidden">Magenta</span><span className="hidden sm:inline">Team Magenta</span></div>
          <div className="font-display text-2xl sm:text-3xl font-black tabular-nums text-white leading-none">
            {score.team2}
          </div>
        </div>
      </div>

      {/* Arena Clock & Leave Button */}
      <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-black/75 px-2 py-1.5 shadow-2xl backdrop-blur-xl pointer-events-auto sm:gap-4 sm:px-4 sm:py-2.5">
        <div className="text-right">
          <div className="text-[8px] sm:text-[9px] font-bold text-white/40 uppercase tracking-widest">Time</div>
          <div className="font-mono-code text-sm sm:text-base font-bold tabular-nums text-white">
            {formattedTime}
          </div>
        </div>
        <div className="w-px h-5 sm:h-6 bg-white/15" />
        <button
          onClick={onLeave}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-colors hover:bg-red-500/20 hover:text-red-400"
          title="Leave Match"
          aria-label="Leave Match"
        >
          <LucideLogOut size={16} />
        </button>
      </div>
    </div>
  );
};
