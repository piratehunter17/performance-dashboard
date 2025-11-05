'use client';

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer, DrawFunction } from '@/hooks/useChartRenderer';

// --- HYDRATION-SAFE VIEWPORT HOOK ---
const useViewport = () => {
  const [width, setWidth] = useState<number | undefined>(undefined);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  if (width === undefined) {
    return { width: 1024, isMobile: false }; 
  }
  return { width, isMobile: width < 768 };
};
// --- END HOOK ---

type HeatmapGrid = {
  grid: number[][];
  maxCount: number;
};

interface HeatmapProps {
  data: DataPoint[];
  numXBins?: number;
  numYBins?: number;
}

const AXIS_COLOR = 'rgba(0, 242, 255, 0.2)';
const LABEL_COLOR = '#e0e0e0';

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

const drawHeatmap = (
  ctx: CanvasRenderingContext2D,
  heatmapData: HeatmapGrid[], 
  cssWidth: number,
  cssHeight: number,
  colorGradient: (count: number, max: number) => string
) => {
  const { grid, maxCount } = heatmapData[0]; 
  if (!grid || grid.length === 0) return;

  const numXBins = grid.length;
  const numYBins = grid[0].length;

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

  ctx.beginPath();
  ctx.strokeStyle = AXIS_COLOR; 
  ctx.lineWidth = 1;
  ctx.moveTo(chartLeft, chartTop);
  ctx.lineTo(chartLeft, chartTop + chartHeight);
  ctx.moveTo(chartLeft, chartTop + chartHeight);
  ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
  ctx.stroke();
  
  ctx.fillStyle = LABEL_COLOR;
  ctx.font = fontSize;

  for (let i = 0; i <= yAxisLabelCount; i++) {
    const value = 0 + (100) * (i / yAxisLabelCount);
    ctx.fillText(value.toFixed(0), chartLeft - padding + 10, chartTop + chartHeight - (value / 100) * chartHeight + 3);
  }
  
  for (let i = 0; i <= xAxisLabelCount; i++) {
    const percent = (i / xAxisLabelCount) * 100;
    const label = `${percent.toFixed(0)}%`; // Fix for 66.666 bug
    
    const x = chartLeft + (i / xAxisLabelCount) * chartWidth;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, chartTop + chartHeight + 20);
  }
  ctx.textAlign = 'left';

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
};

export default function Heatmap({
  data,
  numXBins = 50,
  numYBins = 10,
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorGradient = useColorGradient();

  const { isMobile } = useViewport();
  const chartHeight = isMobile ? '250px' : '300px';

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
    return [{ grid, maxCount }];
  }, [data, numXBins, numYBins]);

  const memoizedDraw: DrawFunction<HeatmapGrid> = useCallback((
    ctx,
    data,
    cssWidth,
    cssHeight
  ) => {
    drawHeatmap(ctx, data, cssWidth, cssHeight, colorGradient);
  }, [colorGradient]); 

  useChartRenderer({
    canvasRef,
    data: heatmapGrid, 
    draw: memoizedDraw,
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ 
        width: '100%', 
        height: chartHeight, 
        display: 'block' 
      }}
    />
  );
}