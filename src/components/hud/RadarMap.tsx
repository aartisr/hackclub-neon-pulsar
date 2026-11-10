import { cn } from '../../lib/ui/cn';
import React from 'react';
import { motion } from 'framer-motion';
import { PlayerState, DiscState } from '../../types/game';

export interface RadarMapProps {
  players: Record<string, PlayerState>;
  disc: DiscState;
  myId: string;
  className?: string;
}

export const RadarMap: React.FC<RadarMapProps> = ({ players, disc, myId, className }) => {
  return (
    <div className={cn("pointer-events-none", className)}>
      <div className="relative w-40 sm:w-44 h-56 sm:h-64 bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden p-2 shadow-2xl">
        <div className="absolute inset-2 border border-white/5 rounded-lg bg-white/[0.02]" />
        
        {/* Goals */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-magenta-400 shadow-[0_0_8px_rgba(217,70,239,1)]" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />

        {/* Grid Lines */}
        <div className="absolute inset-2 flex flex-col justify-between opacity-15">
          {[...Array(5)].map((_, i) => <div key={`grid-h-${i}`} className="w-full h-px bg-white" />)}
        </div>

        {/* Dynamic Entities */}
        <div className="absolute inset-2">
          {Object.values(players).map((player, idx) => {
            const xPerc = ((player.position[0] + 20) / 40) * 100;
            const zPerc = ((player.position[2] + 30) / 60) * 100;
            
            return (
              <motion.div
                key={`map-p-${player.id || 'pilot'}-${idx}`}
                animate={{ left: `${xPerc}%`, top: `${zPerc}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  "absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 z-10",
                  player.team === 1 ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]" : "bg-magenta-400 shadow-[0_0_8px_rgba(217,70,239,0.9)]",
                  player.id === myId && "ring-2 ring-white scale-125"
                )}
              />
            );
          })}

          {/* Disc */}
          <motion.div
            animate={{ 
              left: `${((disc.position[0] + 20) / 40) * 100}%`,
              top: `${((disc.position[2] + 30) / 60) * 100}%`,
              scale: disc.ownerId ? 0.8 : 1
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)] z-20"
          />
        </div>

        <div className="absolute bottom-1.5 right-2 text-[8px] font-bold text-white/30 uppercase tracking-widest font-mono-code">
          Radar
        </div>
      </div>
    </div>
  );
};
