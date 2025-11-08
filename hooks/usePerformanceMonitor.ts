'use client';

import { useState, useEffect, useRef } from 'react';

export interface PerformanceMetrics {
  fps: number;
  memoryUsed: number; // in MB
}

// Wrapper to type the non-standard performance.memory API when available
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

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsed: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameIdRef = useRef(0);
  
  // Store the memory interval ID using a numeric type for browser compatibility
  const memoryIntervalIdRef = useRef<number | null>(null);

  useEffect(() => {
  // Track frames-per-second using requestAnimationFrame
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

    // Periodically sample memory usage if available
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
    
  // Use window.setInterval to obtain a numeric ID compatible with the ref type
  memoryIntervalIdRef.current = window.setInterval(trackMemory, 1000);

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      if (memoryIntervalIdRef.current) {
        // Clear the interval using the window API
        window.clearInterval(memoryIntervalIdRef.current);
      }
    };
  }, []);

  return metrics;
};