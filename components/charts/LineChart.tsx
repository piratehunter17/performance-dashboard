'use client';

import React, { useRef } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer, DrawFunction } from '@/hooks/useChartRenderer';

interface LineChartProps {
  data: DataPoint[];
}

const PADDING = 40;
const Y_AXIS_VALUE_COUNT = 5;
const X_AXIS_VALUE_COUNT = 5;

// --- Futuristic Palette ---
const AXIS_COLOR = 'rgba(0, 242, 255, 0.2)'; // --border-color-dim
const LABEL_COLOR = '#e0e0e0'; // --foreground
const LINE_COLOR = '#00f2ff'; // --accent
const LINE_GLOW = 'rgba(0, 242, 255, 0.3)'; // --accent-glow

/**
 * The specific drawing logic for a Line Chart.
 */
const drawLineChart: DrawFunction<DataPoint> = (
  ctx,
  data,
  cssWidth,
  cssHeight
) => {
  // --- Chart Calculation ---
  const minX = data[0].timestamp;
  const maxX = data[data.length - 1].timestamp;
  const minY = 0;
  const maxY = 100;

  const chartWidth = cssWidth - PADDING * 2;
  const chartHeight = cssHeight - PADDING * 2;
  const chartTop = PADDING;
  const chartLeft = PADDING;

  const mapX = (value: number) => 
    chartLeft + ((value - minX) / (maxX - minX)) * chartWidth;
    
  const mapY = (value: number) => 
    chartTop + chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;

  // --- Drawing ---
  
  // 1. Draw Axes
  ctx.beginPath();
  ctx.strokeStyle = AXIS_COLOR; // CHANGED
  ctx.lineWidth = 1;
  ctx.moveTo(chartLeft, chartTop);
  ctx.lineTo(chartLeft, chartTop + chartHeight);
  ctx.moveTo(chartLeft, chartTop + chartHeight);
  ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
  ctx.stroke();

  // 2. Draw Axis Labels
  ctx.fillStyle = LABEL_COLOR; // CHANGED
  ctx.font = '12px monospace'; // CHANGED
  
  for (let i = 0; i <= Y_AXIS_VALUE_COUNT; i++) {
    const value = minY + (maxY - minY) * (i / Y_AXIS_VALUE_COUNT);
    ctx.fillText(value.toFixed(0), chartLeft - PADDING + 10, mapY(value) + 3);
  }
  
  for (let i = 0; i <= X_AXIS_VALUE_COUNT; i++) {
    const value = minX + (maxX - minX) * (i / X_AXIS_VALUE_COUNT);
    ctx.textAlign = 'center'; // Center X-axis labels
    ctx.fillText(new Date(value).toLocaleTimeString(), mapX(value), chartTop + chartHeight + 20);
  }
  ctx.textAlign = 'left'; // Reset

  // 3. Draw the Line
  ctx.beginPath();
  ctx.strokeStyle = LINE_COLOR; // CHANGED
  ctx.lineWidth = 2;
  
  // --- ADDED: Futuristic Glow ---
  ctx.shadowColor = LINE_GLOW;
  ctx.shadowBlur = 10;

  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    const x = mapX(point.timestamp);
    const y = mapY(point.value);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  
  // --- ADDED: Reset shadow ---
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};


export default function LineChart({ data }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useChartRenderer({
    canvasRef,
    data,
    draw: drawLineChart,
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '400px', display: 'block' }}
    />
  );
}