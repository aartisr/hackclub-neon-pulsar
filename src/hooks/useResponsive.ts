import { useState, useEffect } from 'react';

export interface ResponsiveState {
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return { isTouch: false, isMobile: false, isTablet: false, isDesktop: true, width: 1440, height: 900 };
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return {
      isTouch: touch,
      isMobile: w < 640,
      isTablet: w >= 640 && w < 1024,
      isDesktop: w >= 1024,
      width: w,
      height: h,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setState({
        isTouch: touch,
        isMobile: w < 640,
        isTablet: w >= 640 && w < 1024,
        isDesktop: w >= 1024,
        width: w,
        height: h,
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return state;
}
