import { cn } from '../../lib/ui/cn';
import React from 'react';
import { 
  LucideShield, LucideMedal, LucideTrophy, LucideCrown 
} from 'lucide-react';
import { RankTier } from '../../hooks/useCareerStats';

export interface RankEmblemProps {
  tier: RankTier;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showGlow?: boolean;
}

export const RankEmblem: React.FC<RankEmblemProps> = ({
  tier,
  size = 'md',
  className,
  showGlow = true,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-14 h-14 rounded-2xl',
  };

  const iconSizes = {
    sm: 16,
    md: 22,
    lg: 28,
  };

  switch (tier) {
    case 'bronze':
      return (
        <div
          className={cn(
            "relative flex items-center justify-center border font-bold transition-all",
            sizeClasses[size],
            "bg-gradient-to-br from-[#8a5229] via-[#cd7f32] to-[#5a3212] border-[#e29b58]/50 text-amber-100",
            showGlow && "shadow-[0_0_20px_rgba(205,127,50,0.5)]",
            className
          )}
          title="Bronze Tier Emblem"
        >
          <LucideShield size={iconSizes[size]} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
        </div>
      );

    case 'silver':
      return (
        <div
          className={cn(
            "relative flex items-center justify-center border font-bold transition-all",
            sizeClasses[size],
            "bg-gradient-to-br from-[#94a3b8] via-[#e2e8f0] to-[#475569] border-white/60 text-slate-900",
            showGlow && "shadow-[0_0_22px_rgba(226,232,240,0.6)]",
            className
          )}
          title="Silver Tier Emblem"
        >
          <LucideMedal size={iconSizes[size]} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
        </div>
      );

    case 'gold':
      return (
        <div
          className={cn(
            "relative flex items-center justify-center border font-bold transition-all",
            sizeClasses[size],
            "bg-gradient-to-br from-[#b45309] via-[#fbbf24] to-[#78350f] border-yellow-200 text-yellow-950",
            showGlow && "shadow-[0_0_25px_rgba(251,191,36,0.7)]",
            className
          )}
          title="Gold Tier Emblem"
        >
          <LucideTrophy size={iconSizes[size]} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
        </div>
      );

    case 'neon':
    default:
      return (
        <div
          className={cn(
            "relative flex items-center justify-center border font-bold transition-all animate-pulse",
            sizeClasses[size],
            "bg-gradient-to-br from-cyan-400 via-white to-magenta-500 border-cyan-300 text-black",
            showGlow && "shadow-[0_0_30px_rgba(6,182,212,0.8),0_0_15px_rgba(217,70,239,0.8)]",
            className
          )}
          title="Neon Apex Tier Emblem"
        >
          <LucideCrown size={iconSizes[size]} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] fill-cyan-400 text-black" />
        </div>
      );
  }
};
