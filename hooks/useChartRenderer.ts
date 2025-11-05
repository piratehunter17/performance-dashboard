'use client';

import { useEffect, useRef } from 'react';
import { configureCanvasDPI } from '@/lib/canvasUtils';

// A generic draw function that any chart can implement
export type DrawFunction<T> = (
  ctx: CanvasRenderingContext2D,
  data: T[],
  cssWidth: number,
  cssHeight: number
) => void;

interface UseChartRendererOptions<T> {
  // --- THIS IS THE FIX ---
  // We allow the ref to be 'null', which matches
  // the type from 'useRef<HTMLCanvasElement | null>(null)'
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  data: T[];
  draw: DrawFunction<T>;
}

/**
 * Manages the high-performance render loop for a canvas chart.
 * It handles:
 * - requestAnimationFrame loop
 * - High-DPI scaling
 * - Resize observation
 */
export const useChartRenderer = <T>({
  canvasRef,
  data,
  draw,
}: UseChartRendererOptions<T>) => {
  const dataRef = useRef(data);
  const drawRef = useRef(draw);
  const animationFrameIdRef = useRef(0);

  // Keep refs in sync with the latest props
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    // The ref might be null, so we must check.
    const canvas = canvasRef.current;
    if (!canvas) return; // Exit if canvas isn't mounted yet

    const ctx = canvas.getContext('2d');
    if (!ctx) return; // Exit if context isn't available

    // The main animation loop
    const renderLoop = () => {
      const currentData = dataRef.current;
      const currentDraw = drawRef.current;
      
      configureCanvasDPI(canvas, ctx);
      const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();

      ctx.clearRect(0, 0, cssWidth, cssHeight);

      if (currentData.length > 0) {
        currentDraw(ctx, currentData, cssWidth, cssHeight);
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    // --- Resize Handling ---
    const resizeObserver = new ResizeObserver(() => {
      // Loop will pick up new size on next frame
    });
    resizeObserver.observe(canvas);

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [canvasRef]); // Effect now correctly depends on canvasRef
};

export default useChartRenderer;