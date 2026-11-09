import React from 'react';
import { motion } from 'framer-motion';

export interface SpeedometerProps {
  velocity: [number, number, number];
}

export const Speedometer: React.FC<SpeedometerProps> = ({ velocity }) => {
  const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);
  const maxSpeed = 2.0;
  const ratio = Math.min(speed / maxSpeed, 1);

  return (
    <div className="absolute top-1/2 left-4 sm:left-6 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none z-20">
      <div className="h-36 sm:h-44 w-1.5 bg-white/10 rounded-full overflow-hidden border border-white/10 relative">
        <motion.div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-400 via-magenta-400 to-red-500"
          initial={false}
          animate={{ height: `${ratio * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
      <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest font-mono-code [writing-mode:vertical-lr]">
        Speed
      </div>
    </div>
  );
};
