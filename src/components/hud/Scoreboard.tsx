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
    <div className="w-full flex justify-between items-start pointer-events-none">
      {/* Scoreboard */}
      <div className="bg-black/70 backdrop-blur-xl border border-white/15 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl flex items-center gap-4 sm:gap-6 shadow-2xl pointer-events-auto">
        <div className="text-center">
          <div className="text-[9px] sm:text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-0.5">Team Cyan</div>
          <div className="font-display text-2xl sm:text-3xl font-black tabular-nums text-white leading-none">
            {score.team1}
          </div>
        </div>
        <div className="w-px h-6 sm:h-8 bg-white/15" />
        <div className="text-center">
          <div className="text-[9px] sm:text-[10px] font-black text-magenta-400 uppercase tracking-widest mb-0.5">Team Magenta</div>
          <div className="font-display text-2xl sm:text-3xl font-black tabular-nums text-white leading-none">
            {score.team2}
          </div>
        </div>
      </div>

      {/* Arena Clock & Leave Button */}
      <div className="bg-black/70 backdrop-blur-xl border border-white/15 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-2xl pointer-events-auto">
        <div className="text-right">
          <div className="text-[8px] sm:text-[9px] font-bold text-white/40 uppercase tracking-widest">Time</div>
          <div className="font-mono-code text-sm sm:text-base font-bold tabular-nums text-white">
            {formattedTime}
          </div>
        </div>
        <div className="w-px h-5 sm:h-6 bg-white/15" />
        <button
          onClick={onLeave}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
          title="Leave Match"
          aria-label="Leave Match"
        >
          <LucideLogOut size={16} />
        </button>
      </div>
    </div>
  );
};
