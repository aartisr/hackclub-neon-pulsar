import React from 'react';
import { 
  LucideArrowUp, LucideArrowDown, LucideArrowLeft, 
  LucideArrowRight, LucideZap 
} from 'lucide-react';

export interface TouchControlsProps {
  onMoveDirection: (axis: 'x' | 'z', value: number) => void;
  onAltitude: (value: number) => void;
  onThrow: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveDirection,
  onAltitude,
  onThrow,
}) => {
  return (
    <div className="w-full flex justify-between items-end pointer-events-auto pb-2 sm:pb-4 px-2 select-none">
      {/* Virtual D-Pad (Left Thumb) */}
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5 bg-black/60 p-2 sm:p-2.5 rounded-3xl border border-white/15 backdrop-blur-md">
        <div />
        <button
          onTouchStart={() => onMoveDirection('z', -1)}
          onTouchEnd={() => onMoveDirection('z', 0)}
          className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center active:bg-cyan-500/40 text-white"
          aria-label="Forward"
        >
          <LucideArrowUp size={20} />
        </button>
        <div />
        <button
          onTouchStart={() => onMoveDirection('x', -1)}
          onTouchEnd={() => onMoveDirection('x', 0)}
          className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center active:bg-cyan-500/40 text-white"
          aria-label="Strafe Left"
        >
          <LucideArrowLeft size={20} />
        </button>
        <button
          onTouchStart={() => onMoveDirection('z', 1)}
          onTouchEnd={() => onMoveDirection('z', 0)}
          className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center active:bg-cyan-500/40 text-white"
          aria-label="Backward"
        >
          <LucideArrowDown size={20} />
        </button>
        <button
          onTouchStart={() => onMoveDirection('x', 1)}
          onTouchEnd={() => onMoveDirection('x', 0)}
          className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center active:bg-cyan-500/40 text-white"
          aria-label="Strafe Right"
        >
          <LucideArrowRight size={20} />
        </button>
      </div>

      {/* Altitude & Throw Impulse (Right Thumb) */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <button
            onTouchStart={() => onAltitude(1)}
            onTouchEnd={() => onAltitude(0)}
            className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center active:bg-white/30 text-xs font-bold font-mono-code text-white"
            aria-label="Ascend"
          >
            UP
          </button>
          <button
            onTouchStart={() => onAltitude(-1)}
            onTouchEnd={() => onAltitude(0)}
            className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center active:bg-white/30 text-xs font-bold font-mono-code text-white"
            aria-label="Descend"
          >
            DN
          </button>
        </div>
        <button
          onClick={onThrow}
          className="w-24 sm:w-28 h-12 sm:h-14 rounded-2xl bg-cyan-500 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.6)] active:scale-95 text-xs flex items-center justify-center gap-1.5"
          aria-label="Throw Disc"
        >
          <LucideZap size={16} /> THROW
        </button>
      </div>
    </div>
  );
};
