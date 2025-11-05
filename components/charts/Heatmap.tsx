'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer, DrawFunction } from '@/hooks/useChartRenderer';

interface HeatmapProps {
  data: DataPoint[];
  numXBins?: number;
  numYBins?: number;
}

const PADDING = 40;
const Y_AXIS_VALUE_COUNT = 5; // ADDED
const X_AXIS_VALUE_COUNT = 5; // ADDED

// --- Futuristic Palette ---
const AXIS_COLOR = 'rgba(0, 242, 255, 0.2)'; // --border-color-dim
const LABEL_COLOR = '#e0e0e0'; // --foreground

// Color gradient (memoized)
const useColorGradient = () => {
  return useMemo(() => {
    // --- CHANGED: Futuristic Gradient ---
    // (Transparent Cyan -> Opaque Cyan -> Magenta)
    const colors = [
      'rgba(0, 242, 255, 0.0)',
      'rgba(0, 242, 255, 0.2)',
      'rgba(0, 242, 255, 0.5)',
      'rgba(0, 242, 255, 0.8)',
      'rgba(255, 0, 255, 1.0)', // Magenta for high density
    ];
    return (count: number, maxCount: number) => {
      if (maxCount === 0 || count === 0) return colors[0];
      const ratio = count / maxCount;
      const index = Math.min(
        colors.length - 1,
        Math.floor(ratio * colors.length)
      );
      return colors[index];
    };
  }, []);
};

export default function Heatmap({
  data,
  numXBins = 50,
  numYBins = 10,
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorGradient = useColorGradient();

  const drawHeatmap: DrawFunction<DataPoint> = useCallback((
    ctx,
    currentData,
    cssWidth,
    cssHeight
  ) => {
    const minX = currentData[0].timestamp;
    const maxX = currentData[currentData.length - 1].timestamp;
    const minY = 0;
    const maxY = 100;

    const chartWidth = cssWidth - PADDING * 2;
    const chartHeight = cssHeight - PADDING * 2;
    const chartTop = PADDING;
    const chartLeft = PADDING;

    const xBinWidth = chartWidth / numXBins;
    const yBinHeight = chartHeight / numYBins;

    const grid: number[][] = Array.from({ length: numXBins }, () =>
      Array.from({ length: numYBins }, () => 0)
    );
    let maxCount = 0;

    currentData.forEach((point) => {
      const xRatio = (point.timestamp - minX) / (maxX - minX);
      const yRatio = (point.value - minY) / (maxY - minY);
      const xBin = Math.floor(xRatio * numXBins);
      const yBin = Math.floor(yRatio * numYBins);

      if (xBin >= 0 && xBin < numXBins && yBin >= 0 && yBin < numYBins) {
        grid[xBin][yBin]++;
        maxCount = Math.max(maxCount, grid[xBin][yBin]);
      }
    });

    // --- Drawing Axes ---
    ctx.beginPath();
    ctx.strokeStyle = AXIS_COLOR; // CHANGED
    ctx.lineWidth = 1;
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartTop + chartHeight);
    ctx.moveTo(chartLeft, chartTop + chartHeight);
    ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
    ctx.stroke();
    
    // --- ADDED: Draw Axis Labels ---
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = '12px monospace';

    // Y-Axis Labels
    for (let i = 0; i <= Y_AXIS_VALUE_COUNT; i++) {
      const value = minY + (maxY - minY) * (i / Y_AXIS_VALUE_COUNT);
      const y = chartTop + chartHeight - (value / (maxY - minY)) * chartHeight;
      ctx.fillText(value.toFixed(0), chartLeft - PADDING + 10, y + 3);
    }
    
    // X-Axis Labels
    for (let i = 0; i <= X_AXIS_VALUE_COUNT; i++) {
      const value = minX + (maxX - minX) * (i / X_AXIS_VALUE_COUNT);
      const x = chartLeft + (i / X_AXIS_VALUE_COUNT) * chartWidth;
      ctx.textAlign = 'center';
      ctx.fillText(new Date(value).toLocaleTimeString(), x, chartTop + chartHeight + 20);
    }
    ctx.textAlign = 'left'; // Reset

    // --- Draw Heatmap Cells ---
    for (let xBin = 0; xBin < numXBins; xBin++) {
      for (let yBin = 0; yBin < numYBins; yBin++) {
        const count = grid[xBin][yBin];
        if (count > 0) {
          ctx.fillStyle = colorGradient(count, maxCount);
          const x = chartLeft + xBin * xBinWidth;
          const y = chartTop + chartHeight - (yBin + 1) * yBinHeight;
          ctx.fillRect(x, y, xBinWidth, yBinHeight);
        }
      }
    }

  }, [numXBins, numYBins, colorGradient]);

  useChartRenderer({
    canvasRef,
    data,
    draw: drawHeatmap,
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '300px', display: 'block' }}
    />
  );
}