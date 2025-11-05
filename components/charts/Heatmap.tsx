'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer, DrawFunction } from '@/hooks/useChartRenderer';

// The renderer will now receive the pre-computed grid
type HeatmapGrid = {
  grid: number[][];
  maxCount: number;
};

interface HeatmapProps {
  data: DataPoint[];
  numXBins?: number;
  numYBins?: number;
}

const PADDING = 40;
const Y_AXIS_VALUE_COUNT = 5; 
const X_AXIS_VALUE_COUNT = 5; 

// --- Futuristic Palette ---
const AXIS_COLOR = 'rgba(0, 242, 255, 0.2)';
const LABEL_COLOR = '#e0e0e0';

// Gradient (unchanged)
const useColorGradient = () => {
  return useMemo(() => {
    const colors = [
      'rgba(0, 242, 255, 0.0)',
      'rgba(0, 242, 255, 0.2)',
      'rgba(0, 242, 255, 0.5)',
      'rgba(0, 242, 255, 0.8)',
      'rgba(255, 0, 255, 1.0)',
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

/**
 * The new draw function.
 * It is now very dumb and fast. It just draws the grid.
 */
const drawHeatmap: DrawFunction<HeatmapGrid> = (
  ctx,
  heatmapData, // Receives the pre-computed grid
  cssWidth,
  cssHeight
) => {
  // We get the single grid object from the data array
  const { grid, maxCount } = heatmapData[0]; 
  if (!grid) return;

  const numXBins = grid.length;
  const numYBins = grid[0].length;

  // --- Mobile Responsive PADDING ---
  const mobilePadding = cssWidth < 480 ? 20 : 40;
  const padding = cssWidth < 768 ? mobilePadding : 40;
  const fontSize = cssWidth < 480 ? '10px monospace' : '12px monospace';
  const yAxisLabelCount = cssWidth < 480 ? 3 : 5;
  const xAxisLabelCount = cssWidth < 480 ? 3 : 5;

  const chartWidth = cssWidth - padding * 2;
  const chartHeight = cssHeight - padding * 2;
  const chartTop = padding;
  const chartLeft = padding;

  const xBinWidth = chartWidth / numXBins;
  const yBinHeight = chartHeight / numYBins;

  // --- Drawing Axes ---
  ctx.beginPath();
  ctx.strokeStyle = AXIS_COLOR; 
  ctx.lineWidth = 1;
  ctx.moveTo(chartLeft, chartTop);
  ctx.lineTo(chartLeft, chartTop + chartHeight);
  ctx.moveTo(chartLeft, chartTop + chartHeight);
  ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
  ctx.stroke();
  
  // --- Draw Axis Labels ---
  ctx.fillStyle = LABEL_COLOR;
  ctx.font = fontSize;

  // Y-Axis
  for (let i = 0; i <= yAxisLabelCount; i++) {
    const value = 0 + (100) * (i / yAxisLabelCount); // 0-100 range
    const y = chartTop + chartHeight - (value / 100) * chartHeight;
    ctx.fillText(value.toFixed(0), chartLeft - padding + 10, y + 3);
  }
  
  // X-Axis
  for (let i = 0; i <= xAxisLabelCount; i++) {
    // We can't know the timestamp, so we'll just label by bin index or %
    const label = `${(i / xAxisLabelCount) * 100}%`;
    const x = chartLeft + (i / xAxisLabelCount) * chartWidth;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, chartTop + chartHeight + 20);
  }
  ctx.textAlign = 'left';

  // --- Draw Heatmap Cells ---
  const colorGradient = useColorGradient(); // This is a hook, hmm
  // We'll redefine the gradient func here for simplicity
  const colors = ['rgba(0, 242, 255, 0.0)', 'rgba(0, 242, 255, 0.2)', 'rgba(0, 242, 255, 0.5)', 'rgba(0, 242, 255, 0.8)', 'rgba(255, 0, 255, 1.0)'];
  const getColor = (count: number, max: number) => {
      if (max === 0 || count === 0) return colors[0];
      const ratio = count / max;
      const index = Math.min(colors.length - 1, Math.floor(ratio * colors.length));
      return colors[index];
  };


  for (let xBin = 0; xBin < numXBins; xBin++) {
    for (let yBin = 0; yBin < numYBins; yBin++) {
      const count = grid[xBin][yBin];
      if (count > 0) {
        ctx.fillStyle = getColor(count, maxCount);
        const x = chartLeft + xBin * xBinWidth;
        const y = chartTop + chartHeight - (yBin + 1) * yBinHeight;
        ctx.fillRect(x, y, xBinWidth, yBinHeight);
      }
    }
  }
};

export default function Heatmap({
  data,
  numXBins = 50,
  numYBins = 10,
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- THIS IS THE FIX ---
  // We run the expensive grid calculation here, ONCE.
  const heatmapGrid = useMemo(() => {
    if (data.length === 0) return [{ grid: [], maxCount: 0 }];

    const minX = data[0].timestamp;
    const maxX = data[data.length - 1].timestamp;
    const minY = 0;
    const maxY = 100;

    const grid: number[][] = Array.from({ length: numXBins }, () =>
      Array.from({ length: numYBins }, () => 0)
    );
    let maxCount = 0;

    data.forEach((point) => {
      const xRatio = (point.timestamp - minX) / (maxX - minX);
      const yRatio = (point.value - minY) / (maxY - minY);
      const xBin = Math.floor(xRatio * numXBins);
      const yBin = Math.floor(yRatio * numYBins);

      if (xBin >= 0 && xBin < numXBins && yBin >= 0 && yBin < numYBins) {
        grid[xBin][yBin]++;
        maxCount = Math.max(maxCount, grid[xBin][yBin]);
      }
    });

    // We pass the pre-computed grid as an array of one item
    return [{ grid, maxCount }];
  }, [data, numXBins, numYBins]);

  useChartRenderer({
    canvasRef,
    data: heatmapGrid, // Pass the new grid
    draw: drawHeatmap,
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '300px', display: 'block' }}
    />
  );
}