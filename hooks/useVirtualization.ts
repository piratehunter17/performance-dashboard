'use client';

import { useState, useEffect, useCallback } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  itemCount: number;
  containerRef: React.RefObject<HTMLElement>;
  overscan?: number; // Number of items to render outside the viewport
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

  // Function to update dimensions and scroll
  const update = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, [containerRef]);

  // Run on mount to get initial container height
  useEffect(() => {
    update();
  }, [update]);
  
  // Attach scroll and resize listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Listen for scrolls
    container.addEventListener('scroll', update, { passive: true });
    
    // Listen for resizes
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      container.removeEventListener('scroll', update);
      resizeObserver.disconnect();
    };
  }, [containerRef, update]);

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