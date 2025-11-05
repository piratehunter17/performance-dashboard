'use client';

import { useState, useEffect, useRef } from 'react';

export interface PerformanceMetrics {
  fps: number;
  memoryUsed: number; // in MB
}

// Helper to access the non-standard performance.memory API
interface PerformanceWithMemory extends Performance {
  memory?: {
    totalJSHeapSize: number;
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * A custom hook to monitor FPS and memory usage.
 */
// This is the correct NAMED export
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsed: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameIdRef = useRef(0);
  const memoryIntervalIdRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // --- FPS Monitoring ---
    const trackFPS = (now: number) => {
      const delta = now - lastTimeRef.current;
      frameCountRef.current++;

      if (delta >= 1000) {
        const fps = (frameCountRef.current * 1000) / delta;
        
        setMetrics((prev) => ({
          ...prev,
          fps: Math.round(fps),
        }));
        
        lastTimeRef.current = now;
        frameCountRef.current = 0;
      }
      
      animationFrameIdRef.current = requestAnimationFrame(trackFPS);
    };

    // --- Memory Monitoring ---
    const trackMemory = () => {
      const perf = window.performance as PerformanceWithMemory;
      if (perf.memory) {
        setMetrics((prev) => ({
          ...prev,
          memoryUsed: Math.round(perf.memory!.usedJSHeapSize / 1024 / 1024),
        }));
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(trackFPS);
    memoryIntervalIdRef.current = setInterval(trackMemory, 1000);

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      if (memoryIntervalIdRef.current) {
        clearInterval(memoryIntervalIdRef.current);
      }
    };
  }, []);

  return metrics;
};

// --- DELETE THIS LINE ---
// export default usePerformanceMonitor;