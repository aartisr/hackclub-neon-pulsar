import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { LucideZap, LucideMessageCircle } from 'lucide-react';

export interface TouchControlsProps {
  onMoveDirection: (axis: 'x' | 'z', value: number) => void;
  onAltitude: (value: number) => void;
  onThrow: () => void;
  onOpenChat: () => void;
}

function FlightStick({ onMoveDirection }: Pick<TouchControlsProps, 'onMoveDirection'>) {
  const activePointer = useRef<number | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = Math.max(1, Math.min(bounds.width, bounds.height) / 2 - 22);
    const x = (event.clientX - bounds.left - bounds.width / 2) / radius;
    const y = (event.clientY - bounds.top - bounds.height / 2) / radius;
    const magnitude = Math.max(1, Math.hypot(x, y));
    const normalizedX = x / magnitude;
    const normalizedY = y / magnitude;
    const flightX = Math.abs(normalizedX) < 0.1 ? 0 : normalizedX;
    const flightZ = Math.abs(normalizedY) < 0.1 ? 0 : normalizedY;
    setPosition({ x: normalizedX * radius, y: normalizedY * radius });
    onMoveDirection('x', flightX);
    onMoveDirection('z', flightZ);
  };

  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    setPosition({ x: 0, y: 0 });
    onMoveDirection('x', 0);
    onMoveDirection('z', 0);
  };

  return (
    <div
      role="group"
      aria-label="Flight thumb stick: drag to steer"
      onPointerDown={(event) => {
        if (activePointer.current !== null) return;
        event.preventDefault();
        activePointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className="relative h-32 w-32 shrink-0 rounded-full border border-cyan-300/30 bg-[radial-gradient(circle_at_35%_30%,rgba(103,232,249,0.18),rgba(8,16,36,0.88)_70%)] shadow-[inset_0_0_26px_rgba(34,211,238,0.13),0_12px_40px_rgba(0,0,0,0.55)] touch-none"
    >
      <div className="pointer-events-none absolute inset-4 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px bg-white/10" />
      <div className="pointer-events-none absolute inset-y-6 left-1/2 w-px bg-white/10" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-200/50 bg-gradient-to-br from-cyan-300 to-cyan-700 shadow-[0_0_22px_rgba(34,211,238,0.5)]"
        style={{ transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))` }}
      >
        <span className="h-2 w-2 rounded-full bg-white/80" />
      </div>
    </div>
  );
}

function HoldButton({ label, children, onPress, onRelease }: {
  label: string;
  children: ReactNode;
  onPress: () => void;
  onRelease: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onLostPointerCapture={onRelease}
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xs font-black text-white active:border-cyan-300/70 active:bg-cyan-400/30 touch-none"
    >
      {children}
    </button>
  );
}

export function TouchControls({ onMoveDirection, onAltitude, onThrow, onOpenChat }: TouchControlsProps) {
  return (
    <div className="touch-controls flex w-full items-end justify-between gap-2 pointer-events-auto select-none">
      <FlightStick onMoveDirection={onMoveDirection} />
      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-1.5 rounded-2xl border border-white/15 bg-black/70 p-1.5 backdrop-blur-xl">
          <HoldButton label="Ascend" onPress={() => onAltitude(1)} onRelease={() => onAltitude(0)}>UP</HoldButton>
          <HoldButton label="Descend" onPress={() => onAltitude(-1)} onRelease={() => onAltitude(0)}>DN</HoldButton>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={onOpenChat} aria-label="Open chat" className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-black/80 text-white backdrop-blur-xl active:bg-white/20">
            <LucideMessageCircle size={19} />
          </button>
          <button type="button" onClick={onThrow} className="flex h-11 min-w-20 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-300 to-cyan-500 px-3 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[0_0_24px_rgba(6,182,212,0.45)] active:scale-95" aria-label="Throw disc">
            <LucideZap size={17} /> Throw
          </button>
        </div>
      </div>
    </div>
  );
}
