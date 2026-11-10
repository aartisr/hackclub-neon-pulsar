import { RankEmblem } from '../ui/RankEmblem';
import type { CareerStats, RankInfo } from '../../hooks/useCareerStats';

interface CareerSummaryProps {
  rank: RankInfo;
  careerStats: CareerStats;
  winRate: number;
}

export function CareerSummary({ rank, careerStats, winRate }: CareerSummaryProps) {
  return (
    <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
      <div className="flex flex-col gap-3 min-[440px]:flex-row min-[440px]:items-center min-[440px]:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <RankEmblem tier={rank.tier} size="md" />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white uppercase tracking-tight">{rank.title}</span>
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded font-mono-code uppercase border"
                style={{
                  color: rank.primaryColor,
                  borderColor: `${rank.primaryColor}50`,
                  backgroundColor: `${rank.primaryColor}15`
                }}
              >
                {rank.badgeLabel}
              </span>
            </div>
            <div className="text-[10px] text-white/50 mt-0.5 font-medium">
              {rank.nextTierTitle
                ? `${rank.nextTierWinsRemaining} win${rank.nextTierWinsRemaining === 1 ? '' : 's'} to ${rank.nextTierTitle}`
                : 'Apex Rank Achieved'}
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3 border-t border-white/10 pt-2 text-xs font-mono-code tabular-nums min-[440px]:justify-start min-[440px]:border-0 min-[440px]:pt-0 sm:gap-4">
          <div className="text-right">
            <div className="text-[9px] text-white/40 uppercase">Goals</div>
            <div className="font-bold text-cyan-400">{careerStats.goals}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-white/40 uppercase">Wins</div>
            <div className="font-bold text-magenta-400">{careerStats.victories}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-white/40 uppercase">Win %</div>
            <div className="font-bold text-white/80">{winRate}%</div>
          </div>
        </div>
      </div>

      {/* Tier Progress Bar */}
      {rank.nextTierTitle && (
        <div className="space-y-1 pt-1 border-t border-white/5">
          <div className="flex justify-between text-[9px] font-mono-code text-white/40 uppercase">
            <span>Rank Progress</span>
            <span>{Math.round(rank.progressPercent)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${rank.progressPercent}%`,
                backgroundColor: rank.primaryColor,
                boxShadow: `0 0 10px ${rank.primaryColor}`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
