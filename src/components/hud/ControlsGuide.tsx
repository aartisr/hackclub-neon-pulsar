import React from 'react';

export interface ControlsGuideProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const ControlsGuide: React.FC<ControlsGuideProps> = ({ isVisible, onToggle }) => {
  return (
    <div className="flex justify-center pointer-events-auto">
      {isVisible ? (
        <div className="bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl px-4 sm:px-5 py-2 sm:py-2.5 flex items-center gap-3 sm:gap-5 text-xs text-white/80 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="font-mono-code bg-white/10 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold">WASD</span>
            <span className="text-[10px] sm:text-[11px] text-white/50">Thrust</span>
          </div>
          <div className="w-px h-4 bg-white/15" />
          <div className="flex items-center gap-2">
            <span className="font-mono-code bg-white/10 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold">SPACE/SHIFT</span>
            <span className="text-[10px] sm:text-[11px] text-white/50">Altitude</span>
          </div>
          <div className="w-px h-4 bg-white/15" />
          <div className="flex items-center gap-2">
            <span className="font-mono-code bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold">E</span>
            <span className="text-[10px] sm:text-[11px] text-white/50">Throw</span>
          </div>
          <div className="w-px h-4 bg-white/15" />
          <button
            onClick={onToggle}
            className="text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-wider"
            title="Press H to toggle HUD"
          >
            [H] Hide
          </button>
        </div>
      ) : (
        <button
          onClick={onToggle}
          className="bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-[10px] font-mono-code text-white/40 hover:text-white uppercase tracking-wider transition-colors"
        >
          [H] Controls
        </button>
      )}
    </div>
  );
};
