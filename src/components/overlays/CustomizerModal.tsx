import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChassisType } from '../../types/game';
import { ChassisPicker, ColorPalette } from '../ui/PilotSelectors';

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
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay-customizer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="safe-screen absolute inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/80 backdrop-blur-md"
        >
          <div role="dialog" aria-modal="true" aria-labelledby="pilot-config-title" className="premium-panel w-full max-w-sm my-auto p-4 min-[375px]:p-6 sm:p-8 rounded-3xl">
            <h3 id="pilot-config-title" className="font-display text-xl font-bold uppercase italic tracking-tight mb-5 text-white">
              Pilot Configuration
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2.5 block">
                  Energy Core Wavelength
                </label>
                <ColorPalette value={customColor} onChange={onSelectColor} size="large" />
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2.5 block">
                  Chassis Geometry
                </label>
                <ChassisPicker value={avatarShape} onChange={onSelectShape} detail />
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
