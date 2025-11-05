'use client';

import React, { useRef } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer, DrawFunction } from '@/hooks/useChartRenderer';

interface LineChartProps {
  data: DataPoint[];
}

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
  // --- MOBILE FIX: Dynamic values based on width ---
  const mobilePadding = cssWidth < 480 ? 20 : 40;
  const padding = cssWidth < 768 ? mobilePadding : 40;
  const fontSize = cssWidth < 480 ? '10px monospace' : '12px monospace';
  const yAxisLabelCount = cssWidth < 480 ? 3 : 5;
  const xAxisLabelCount = cssWidth < 480 ? 3 : 5;
  // ---

  // --- Chart Calculation ---
  const minX = data[0].timestamp;
  const maxX = data[data.length - 1].timestamp;
  const minY = 0;
  const maxY = 100;

  const chartWidth = cssWidth - padding * 2;
  const chartHeight = cssHeight - padding * 2;
  const chartTop = padding;
  const chartLeft = padding;

  const mapX = (value: number) => 
    chartLeft + ((value - minX) / (maxX - minX)) * chartWidth;
    
  const mapY = (value: number) => 
    chartTop + chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;

  // --- Drawing ---
  
  // 1. Draw Axes
  ctx.beginPath();
  ctx.strokeStyle = AXIS_COLOR; 
  ctx.lineWidth = 1;
  ctx.moveTo(chartLeft, chartTop);
  ctx.lineTo(chartLeft, chartTop + chartHeight);
  ctx.moveTo(chartLeft, chartTop + chartHeight);
  ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
  ctx.stroke();

  // 2. Draw Axis Labels
  ctx.fillStyle = LABEL_COLOR; 
  ctx.font = fontSize; 
  
  for (let i = 0; i <= yAxisLabelCount; i++) {
    const value = minY + (maxY - minY) * (i / yAxisLabelCount);
    ctx.fillText(value.toFixed(0), chartLeft - padding + 10, mapY(value) + 3);
  }
  
  for (let i = 0; i <= xAxisLabelCount; i++) {
    const value = minX + (maxX - minX) * (i / xAxisLabelCount);
    ctx.textAlign = 'center'; 
    ctx.fillText(new Date(value).toLocaleTimeString(), mapX(value), chartTop + chartHeight + 20);
  }
  ctx.textAlign = 'left';

  // 3. Draw the Line
  ctx.beginPath();
  ctx.strokeStyle = LINE_COLOR; 
  ctx.lineWidth = 2;
  
  ctx.shadowColor = LINE_GLOW;
  ctx.shadowBlur = 10;

  // --- Performance Tweak for large data ---
  // If we have more data points than horizontal pixels, we can skip points
  const step = Math.ceil(data.length / chartWidth);
  
  for (let i = 0; i < data.length; i += step) {
    const point = data[i];
    const x = mapX(point.timestamp);
    const y = mapY(point.value);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  // Draw the very last point to ensure the line goes to the end
  const lastPoint = data[data.length - 1];
  ctx.lineTo(mapX(lastPoint.timestamp), mapY(lastPoint.value));
  
  ctx.stroke();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};


export default function LineChart({ data }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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