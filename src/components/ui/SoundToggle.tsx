import { cn } from '../../lib/ui/cn';
import React from 'react';
import { LucideVolume2, LucideVolumeX } from 'lucide-react';

export interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
  showLabel?: boolean;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({
  enabled,
  onToggle,
  className,
  showLabel = true,
}) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex min-h-11 min-w-11 items-center justify-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all shadow-lg pointer-events-auto",
        enabled 
          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
          : "bg-black/50 border-white/10 text-white/50 hover:text-white hover:border-white/20",
        className
      )}
      title={enabled ? "Mute procedural audio" : "Enable procedural synth audio"}
      aria-label={enabled ? "Mute audio" : "Enable audio"}
    >
      {enabled ? <LucideVolume2 size={14} className="text-cyan-400" /> : <LucideVolumeX size={14} />}
      {showLabel && (
        <span className="hidden sm:inline font-mono-code text-[11px] uppercase tracking-wider">
          {enabled ? "Audio On" : "Audio Muted"}
        </span>
      )}
    </button>
  );
};
