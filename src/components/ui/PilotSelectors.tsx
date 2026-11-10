import { cn } from '../../lib/ui/cn';
import { CHASSIS_TYPES, COLOR_PALETTE, type ChassisType } from '../../types/game';

export function ColorPalette({ value, onChange, size = 'compact' }: { value: string; onChange: (color: string) => void; size?: 'compact' | 'large' }) {
  return (
    <div className={size === 'large' ? 'grid grid-cols-3 min-[440px]:grid-cols-6 gap-2' : 'grid grid-cols-3 min-[400px]:grid-cols-6 gap-1'}>
      {COLOR_PALETTE.map(color => (
        <button
          key={color.hex}
          type="button"
          onClick={() => onChange(color.hex)}
          aria-label={`Select ${color.name}`}
          aria-pressed={value === color.hex}
          title={color.name}
          style={{ backgroundColor: color.hex }}
          className={cn(
            'rounded-full border transition-transform',
            size === 'large' ? 'w-11 h-11 border-2 mx-auto' : 'w-11 h-11 mx-auto',
            value === color.hex
              ? 'scale-110 border-white shadow-[0_0_12px_rgba(255,255,255,0.7)]'
              : 'border-transparent opacity-60 hover:opacity-100'
          )}
        />
      ))}
    </div>
  );
}

export function ChassisPicker({ value, onChange, detail = false }: { value: ChassisType; onChange: (shape: ChassisType) => void; detail?: boolean }) {
  return (
    <div className={detail ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-2'}>
      {CHASSIS_TYPES.map(chassis => (
        <button
          key={chassis.id}
          type="button"
          onClick={() => onChange(chassis.id)}
          aria-pressed={value === chassis.id}
          className={cn(
            'rounded-xl border transition-all',
            detail ? 'min-h-12 p-3 text-left' : 'min-h-11 py-2 px-0.5 text-[10px] min-[375px]:text-[11px] font-bold uppercase',
            value === chassis.id
              ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
              : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          {detail ? <><div className="text-xs font-bold uppercase">{chassis.label}</div><div className="text-[10px] opacity-60">{chassis.desc}</div></> : chassis.label}
        </button>
      ))}
    </div>
  );
}
