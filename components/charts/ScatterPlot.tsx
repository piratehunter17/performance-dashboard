'use client';

import React, { useRef, useCallback } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer, DrawFunction } from '@/hooks/useChartRenderer';

interface ScatterPlotProps {
  data: DataPoint[];
  pointSize?: number;
  pointColor?: string;
}

const PADDING = 40;
const Y_AXIS_VALUE_COUNT = 5;
const X_AXIS_VALUE_COUNT = 5; // ADDED

// --- Futuristic Palette ---
const AXIS_COLOR = 'rgba(0, 242, 255, 0.2)'; // --border-color-dim
const LABEL_COLOR = '#e0e0e0'; // --foreground
const POINT_COLOR_DEFAULT = '#00f2ff'; // --accent
const POINT_GLOW = 'rgba(0, 242, 255, 0.3)'; // --accent-glow

export default function ScatterPlot({
  data,
  pointSize = 3,
  pointColor = POINT_COLOR_DEFAULT, // CHANGED
}: ScatterPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawScatterPlot: DrawFunction<DataPoint> = useCallback((
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

    const mapX = (value: number) => chartLeft + ((value - minX) / (maxX - minX)) * chartWidth;
    const mapY = (value: number) => chartTop + chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;

    // --- Drawing Axes ---
    ctx.beginPath();
    ctx.strokeStyle = AXIS_COLOR; // CHANGED
    ctx.lineWidth = 1;
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartTop + chartHeight);
    ctx.moveTo(chartLeft, chartTop + chartHeight);
    ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
    ctx.stroke();

    // --- Draw Axis Labels ---
    ctx.fillStyle = LABEL_COLOR; // CHANGED
    ctx.font = '12px monospace'; // CHANGED
    for (let i = 0; i <= Y_AXIS_VALUE_COUNT; i++) {
      const value = minY + (maxY - minY) * (i / Y_AXIS_VALUE_COUNT);
      ctx.fillText(value.toFixed(0), chartLeft - PADDING + 10, mapY(value) + 3);
    }
    
    // --- ADDED: X-Axis Labels ---
    for (let i = 0; i <= X_AXIS_VALUE_COUNT; i++) {
      const value = minX + (maxX - minX) * (i / X_AXIS_VALUE_COUNT);
      ctx.textAlign = 'center';
      ctx.fillText(new Date(value).toLocaleTimeString(), mapX(value), chartTop + chartHeight + 20);
    }
    ctx.textAlign = 'left'; // Reset

    // --- Draw Points ---
    ctx.fillStyle = pointColor;
    
    // --- ADDED: Futuristic Glow ---
    ctx.shadowColor = POINT_GLOW;
    ctx.shadowBlur = 10;

    currentData.forEach((point) => {
      const x = mapX(point.timestamp);
      const y = mapY(point.value);
      ctx.beginPath();
      ctx.arc(x, y, pointSize / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // --- ADDED: Reset shadow ---
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

  }, [pointSize, pointColor]);

  useChartRenderer({
    canvasRef,
    data,
    draw: drawScatterPlot,
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '300px', display: 'block' }}
    />
  );
}