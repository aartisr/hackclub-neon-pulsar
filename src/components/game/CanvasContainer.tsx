import React from 'react';

export interface CanvasContainerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({ containerRef }) => {
  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 bg-[#050505] overflow-hidden" 
      aria-hidden="true" 
    />
  );
};
