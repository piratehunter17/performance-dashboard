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
  canvasRef: React.RefObject<HTMLCanvasElement>;
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
  // so the animation loop doesn't need to re-run the effect
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // The main animation loop
    const renderLoop = () => {
      // Get the latest data and draw function
      const currentData = dataRef.current;
      const currentDraw = drawRef.current;
      
      // Configure canvas size and scaling
      configureCanvasDPI(canvas, ctx);
      const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();

      // Clear the canvas
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      // Call the specific chart's draw function
      if (currentData.length > 0) {
        currentDraw(ctx, currentData, cssWidth, cssHeight);
      }

      // Continue the loop
      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    // --- Resize Handling ---
    // Start the loop and redraw on resize
    const resizeObserver = new ResizeObserver(() => {
      // The render loop will pick up the new size on its next frame.
      // No need to manually call renderLoop() here.
    });
    resizeObserver.observe(canvas);

    // Start the loop
    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [canvasRef]); // Only run this effect once on mount
};

export default useChartRenderer;