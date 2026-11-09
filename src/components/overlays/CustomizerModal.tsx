import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChassisType, CHASSIS_TYPES, COLOR_PALETTE } from '../../types/game';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customColor: string;
  avatarShape: ChassisType;
  onSelectColor: (color: string) => void;
  onSelectShape: (shape: ChassisType) => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  isOpen,
  onClose,
  customColor,
  avatarShape,
  onSelectColor,
  onSelectShape,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay-customizer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-black border border-white/20 shadow-2xl">
            <h3 className="font-display text-xl font-bold uppercase italic tracking-tight mb-5 text-white">
              Pilot Configuration
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2.5 block">
                  Energy Core Wavelength
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_PALETTE.map((c, cIdx) => (
                    <button
                      key={`custom-palette-${c.hex}-${cIdx}`}
                      onClick={() => onSelectColor(c.hex)}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 transition-all mx-auto",
                        customColor === c.hex 
                          ? "border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.7)]" 
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                      aria-label={`Select ${c.name}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2.5 block">
                  Chassis Geometry
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CHASSIS_TYPES.map((s, sIdx) => (
                    <button
                      key={`custom-chassis-${s.id}-${sIdx}`}
                      onClick={() => onSelectShape(s.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        avatarShape === s.id 
                          ? "bg-white text-black border-white font-bold" 
                          : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <div className="text-xs font-bold uppercase">{s.label}</div>
                      <div className="text-[10px] opacity-60">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-cyan-500 text-black font-extrabold uppercase tracking-wider hover:bg-cyan-400 transition-colors text-xs"
              >
                Confirm Blueprint
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
