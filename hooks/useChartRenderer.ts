'use client';

import { useEffect, useRef } from 'react';
import { configureCanvasDPI } from '@/lib/canvasUtils';

// Generic draw function signature for chart renderers
export type DrawFunction<T> = (
  ctx: CanvasRenderingContext2D,
  data: T[],
  cssWidth: number,
  cssHeight: number
) => void;

interface UseChartRendererOptions<T> {
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

  // Refs to cache device pixel ratio and CSS dimensions to avoid DOM reads in the render loop
  const dprRef = useRef(1);
  const cssWidthRef = useRef(0);
  const cssHeightRef = useRef(0);

  // Keep refs in sync with the latest props
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

  // The main animation/render loop
    const renderLoop = () => {
      const currentData = dataRef.current;
      const currentDraw = drawRef.current;

  // Use cached values rather than reading from the DOM each frame
      const cssWidth = cssWidthRef.current;
      const cssHeight = cssHeightRef.current;
      const dpr = dprRef.current;

      // Ensure transform is reset for scaling and clearing
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      if (currentData.length > 0) {
        currentDraw(ctx, currentData, cssWidth, cssHeight);
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    // Resize handling: observe layout changes and update cached dimensions
    const resizeObserver = new ResizeObserver(() => {
      // Read layout metrics here to minimize layout thrashing in the render loop
      const rect = canvas.getBoundingClientRect();
      const newWidth = Math.floor(rect.width);
      const newHeight = Math.floor(rect.height);

      // Configure backing store for high-DPI displays and store device pixel ratio
      dprRef.current = configureCanvasDPI(canvas, ctx, newWidth, newHeight);

      // Cache the CSS dimensions for use by the render loop
      cssWidthRef.current = newWidth;
      cssHeightRef.current = newHeight;
    });
    resizeObserver.observe(canvas);

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [canvasRef]);
};

export default useChartRenderer;