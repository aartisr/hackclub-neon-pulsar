import React from 'react';
import { motion } from 'framer-motion';

export interface SpectatorBadgeProps {
  isSpectator: boolean;
}

export const SpectatorBadge: React.FC<SpectatorBadgeProps> = ({ isSpectator }) => {
  if (!isSpectator) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center z-30">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/85 backdrop-blur-2xl border border-cyan-500/40 px-6 sm:px-8 py-4 sm:py-5 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.3)]"
      >
        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-1">Live Feed</div>
        <div className="font-display text-xl sm:text-2xl font-black italic uppercase tracking-wider text-white">SPECTATING</div>
        <div className="text-[10px] sm:text-[11px] font-medium text-white/40 uppercase mt-2">Joining on next round reset</div>
      </motion.div>
    </div>
  );
};
