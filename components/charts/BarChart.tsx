'use client';

import React, { useRef, useCallback } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer, DrawFunction } from '@/hooks/useChartRenderer';

interface BarChartProps {
  data: DataPoint[];
  intervalMs?: number; 
  maxBars?: number;
}

const PADDING = 40;
const Y_AXIS_VALUE_COUNT = 5;

// --- Futuristic Palette ---
const AXIS_COLOR = 'rgba(0, 242, 255, 0.2)'; // --border-color-dim
const LABEL_COLOR = '#e0e0e0'; // --foreground
const BAR_COLOR = '#00f2ff'; // --accent

// Aggregation logic (unchanged)
const aggregateData = (data: DataPoint[], intervalMs: number, maxBars: number) => {
  if (data.length === 0) return [];
  const aggregated: { timestamp: number; value: number; count: number }[] = [];
  let currentBucket: { timestamp: number; sum: number; count: number } | null = null;
  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    const bucketStart = Math.floor(point.timestamp / intervalMs) * intervalMs;
    if (!currentBucket || currentBucket.timestamp !== bucketStart) {
      if (currentBucket) {
        aggregated.push({
          timestamp: currentBucket.timestamp,
          value: currentBucket.sum / currentBucket.count,
          count: currentBucket.count,
        });
      }
      currentBucket = { timestamp: bucketStart, sum: 0, count: 0 };
    }
    currentBucket.sum += point.value;
    currentBucket.count++;
  }
  if (currentBucket) {
    aggregated.push({
      timestamp: currentBucket.timestamp,
      value: currentBucket.sum / currentBucket.count,
      count: currentBucket.count,
    });
  }
  if (aggregated.length > maxBars) {
    return aggregated.slice(aggregated.length - maxBars);
  }
  return aggregated;
};

export default function BarChart({
  data,
  intervalMs = 60000,
  maxBars = 60
}: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawBarChart: DrawFunction<DataPoint> = useCallback((
    ctx,
    currentData,
    cssWidth,
    cssHeight
  ) => {
    const aggregated = aggregateData(currentData, intervalMs, maxBars);
    if (aggregated.length === 0) return;

    const minX = aggregated[0].timestamp;
    const maxX = aggregated[aggregated.length - 1].timestamp + intervalMs;
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
    
    // --- Draw Bars ---
    ctx.fillStyle = BAR_COLOR; // CHANGED
    const barPadding = 0.1;

    aggregated.forEach((point) => {
      const x = mapX(point.timestamp);
      const barWidth = mapX(point.timestamp + intervalMs) - x;
      const actualBarWidth = barWidth * (1 - barPadding);
      const barXStart = x + (barWidth * barPadding) / 2;
      const barHeight = chartTop + chartHeight - mapY(point.value);
      const barY = mapY(point.value);

      ctx.fillRect(barXStart, barY, actualBarWidth, barHeight);
    });

  }, [intervalMs, maxBars]);

  useChartRenderer({
    canvasRef,
    data,
    draw: drawBarChart,
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '300px', display: 'block' }}
    />
  );
}