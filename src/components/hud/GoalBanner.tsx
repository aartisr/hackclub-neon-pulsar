import { cn } from '../../lib/ui/cn';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GoalBannerProps {
  banner: { text: string; team: 1 | 2 } | null;
}

export const GoalBanner: React.FC<GoalBannerProps> = ({ banner }) => {
  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          key="goal-banner-notification"
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="absolute top-36 sm:top-24 left-1/2 -translate-x-1/2 pointer-events-none z-30"
        >
          <div className={cn(
            "px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl border font-display text-lg sm:text-2xl font-black tracking-widest uppercase italic shadow-2xl backdrop-blur-xl",
            banner.team === 1
              ? "bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_40px_rgba(6,182,212,0.6)]"
              : "bg-magenta-500/25 border-magenta-400 text-magenta-300 shadow-[0_0_40px_rgba(217,70,239,0.6)]"
          )}>
            {banner.text}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
