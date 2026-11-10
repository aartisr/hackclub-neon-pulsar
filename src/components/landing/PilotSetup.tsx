import { useState } from 'react';
import { LucideChevronDown, LucideSlidersHorizontal } from 'lucide-react';
import { type ChassisType } from '../../types/game';
import { ChassisPicker, ColorPalette } from '../ui/PilotSelectors';

interface PilotSetupProps {
  playerName: string;
  onChangePlayerName: (name: string) => void;
  avatarShape: ChassisType;
  onChangeShape: (shape: ChassisType) => void;
  customColor: string;
  onChangeColor: (color: string) => void;
}

export function PilotSetup({ playerName, onChangePlayerName, avatarShape, onChangeShape, customColor, onChangeColor }: PilotSetupProps) {
  const [showCustomization, setShowCustomization] = useState(false);
  return (
    <div className="space-y-3 mb-4">
      <div>
        <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5 block">
          Pilot Call-Sign
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => onChangePlayerName(e.target.value)}
          maxLength={20}
          placeholder="Enter pilot name..."
          className="w-full min-h-11 bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-base sm:text-sm outline-none focus:border-cyan-400/60 focus:bg-white/[0.08] transition-all font-medium text-white"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowCustomization(value => !value)}
        aria-expanded={showCustomization}
        aria-controls="pilot-customization"
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-left text-xs font-semibold text-white/80 hover:border-cyan-400/40 hover:bg-white/[0.07]"
      >
        <span className="flex items-center gap-2"><LucideSlidersHorizontal size={16} className="text-cyan-300" /> Customize pilot <span className="font-mono-code text-[10px] text-white/40">{avatarShape}</span></span>
        <LucideChevronDown size={16} className={showCustomization ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {/* Optional chassis and core color */}
      {showCustomization && <div id="pilot-customization" className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Drone Chassis</span>
          <span className="text-[11px] font-semibold uppercase text-cyan-400">{avatarShape}</span>
        </div>
        <ChassisPicker value={avatarShape} onChange={onChangeShape} />

        <div className="flex flex-col items-start gap-2 pt-1 min-[440px]:flex-row min-[440px]:items-center min-[440px]:justify-between">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Energy Core Wavelength</span>
          <ColorPalette value={customColor} onChange={onChangeColor} />
        </div>
      </div>}
    </div>
  );
}
