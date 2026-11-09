import React from 'react';
import { motion } from 'framer-motion';
import { 
  LucideFilm, LucidePlay, LucidePause, LucideRewind, 
  LucideFastForward, LucideLogOut, LucideCamera, LucideEye 
} from 'lucide-react';
import { CameraMode } from '../../hooks/useMatchReplay';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ReplayHudProps {
  isReplaying: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  minTime: number;
  maxTime: number;
  cameraMode: CameraMode;
  onTogglePlayPause: () => void;
  onSetSpeed: (speed: number) => void;
  onSeekToTime: (time: number) => void;
  onSetCameraMode: (mode: CameraMode) => void;
  onExitReplay: () => void;
}

export const ReplayHud: React.FC<ReplayHudProps> = ({
  isReplaying,
  isPlaying,
  playbackSpeed,
  currentTime,
  minTime,
  maxTime,
  cameraMode,
  onTogglePlayPause,
  onSetSpeed,
  onSeekToTime,
  onSetCameraMode,
  onExitReplay,
}) => {
  if (!isReplaying) return null;

  const totalDuration = Math.max(0.1, maxTime - minTime);
  const elapsed = Math.max(0, currentTime - minTime);

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRewind5s = () => {
    onSeekToTime(currentTime - 5);
  };

  const handleForward5s = () => {
    onSeekToTime(currentTime + 5);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50 p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
      
      {/* Top Bar: Replay Mode Badge & Camera Controls */}
      <div className="w-full flex justify-between items-start">
        {/* Replay Indicator Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/80 backdrop-blur-xl border border-cyan-500/40 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-[0_0_25px_rgba(6,182,212,0.3)] pointer-events-auto"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
            <LucideFilm size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="font-display text-xs font-black uppercase tracking-wider text-white">3D MATCH REPLAY</h2>
            </div>
            <p className="text-[10px] text-white/50 font-mono-code">Telemetry Teleport Enabled</p>
          </div>
        </motion.div>

        {/* Camera Perspective Mode Toggles */}
        <div className="bg-black/80 backdrop-blur-xl border border-white/15 p-1 sm:p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl pointer-events-auto">
          <button
            onClick={() => onSetCameraMode('disc')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all",
              cameraMode === 'disc'
                ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)] font-bold"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
            title="Follow Energy Disc"
          >
            <LucideEye size={14} />
            <span className="hidden sm:inline">Follow Disc</span>
          </button>
          <button
            onClick={() => onSetCameraMode('orbit')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all",
              cameraMode === 'orbit'
                ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)] font-bold"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
            title="Cinematic Arena Orbit"
          >
            <LucideCamera size={14} />
            <span className="hidden sm:inline">Orbit View</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Control Console */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto bg-black/85 backdrop-blur-2xl border border-white/20 p-4 sm:p-5 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] pointer-events-auto space-y-3"
      >
        
        {/* Timeline Slider with Timestamps */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs font-mono-code text-white/60">
            <span className="text-cyan-400 font-bold">{formatTime(elapsed)}</span>
            <span className="text-white/40">{formatTime(totalDuration)}</span>
          </div>
          <input
            type="range"
            min={minTime}
            max={maxTime}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeekToTime(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
          />
        </div>

        {/* Action Controls & Speed Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          
          {/* Main Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRewind5s}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
              title="Rewind 5 seconds"
            >
              <LucideRewind size={16} />
            </button>

            <button
              onClick={onTogglePlayPause}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all active:scale-95"
            >
              {isPlaying ? <LucidePause size={18} /> : <LucidePlay size={18} />}
              <span className="text-xs uppercase tracking-wider">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={handleForward5s}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
              title="Fast forward 5 seconds"
            >
              <LucideFastForward size={16} />
            </button>
          </div>

          {/* Speed Selector Pills */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {[0.5, 1.0, 2.0, 4.0].map(speed => (
              <button
                key={`speed-${speed}`}
                onClick={() => onSetSpeed(speed)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-mono-code font-bold transition-all",
                  playbackSpeed === speed
                    ? "bg-white text-black shadow-sm"
                    : "text-white/50 hover:text-white"
                )}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Exit Replay Button */}
          <button
            onClick={onExitReplay}
            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <LucideLogOut size={14} />
            <span>Exit Replay</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
