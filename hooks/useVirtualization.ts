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

  // 3. Wrap the 'update' function in useCallback
  const update = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, [containerRef]);

  // Run on mount to get initial height
  useEffect(() => {
    update();
  }, [update]);
  
  // 4. Create a throttled version of 'update'
  //    This will only run, at most, once every 16ms (~60fps)
  const throttledUpdate = useMemo(() => {
    return throttle(update, 16);
  }, [update]);
  
  // Attach scroll and resize listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 5. Use the new 'throttledUpdate' for the scroll listener
    container.addEventListener('scroll', throttledUpdate, { passive: true });
    
    // ResizeObserver is already efficient, 'update' is fine here
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);

    // Cleanup
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