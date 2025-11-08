'use client';

// 1. Import 'useCallback' and 'useMemo'
import { useState, useEffect, useCallback, useMemo } from 'react';
// 2. Import 'throttle'
import { throttle } from '@/lib/performanceUtils';

interface VirtualizationOptions {
  itemHeight: number;
  itemCount: number;
  containerRef: React.RefObject<HTMLElement | null>;
  overscan?: number;
}

interface VirtualizationRange {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
}

const DEFAULT_OVERSCAN = 5;

export const useVirtualization = ({
  itemHeight,
  itemCount,
  containerRef,
  overscan = DEFAULT_OVERSCAN,
}: VirtualizationOptions): VirtualizationRange => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Wrap the 'update' function in useCallback to avoid recreating it across renders
  const update = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, [containerRef]);

  // Initialize measurements on mount
  useEffect(() => {
    update();
  }, [update]);
  
  // Create a throttled version of 'update' to limit update frequency (~60fps)
  const throttledUpdate = useMemo(() => {
    return throttle(update, 16);
  }, [update]);
  
  // Attach scroll and resize listeners to the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use the throttled handler for scroll events to reduce update rate
    container.addEventListener('scroll', throttledUpdate, { passive: true });
    
    // Observe size changes and call the non-throttled update to get accurate dimensions
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);

    // Cleanup event listeners and observers on unmount
    return () => {
      container.removeEventListener('scroll', throttledUpdate);
      resizeObserver.disconnect();
    };
  }, [containerRef, throttledUpdate, update]); // Add dependencies

  // Calculate the virtual range
  const totalHeight = itemCount * itemHeight;

  const startIndex = Math.max(
    0, 
    Math.floor(scrollTop / itemHeight) - overscan
  );
  
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);

  const endIndex = Math.min(
    itemCount,
    startIndex + visibleItemCount + 2 * overscan
  );

  return { startIndex, endIndex, totalHeight };
};

export default useVirtualization;