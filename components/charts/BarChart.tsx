'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer, DrawFunction } from '@/hooks/useChartRenderer';

// We now pass the AGGREGATED data type to the renderer
type AggregatedDataPoint = { timestamp: number; value: number };

interface BarChartProps {
  data: DataPoint[];
  intervalMs?: number; 
  maxBars?: number;
}

const PADDING = 40;
const Y_AXIS_VALUE_COUNT = 5;

// --- Futuristic Palette ---
const AXIS_COLOR = 'rgba(0, 242, 255, 0.2)';
const LABEL_COLOR = '#e0e0e0';
const BAR_COLOR = '#00f2ff';

// Aggregation logic (unchanged)
const aggregateData = (data: DataPoint[], intervalMs: number, maxBars: number) => {
  if (data.length === 0) return [];
  const aggregated: AggregatedDataPoint[] = [];
  let currentBucket: { timestamp: number; sum: number; count: number } | null = null;
  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    const bucketStart = Math.floor(point.timestamp / intervalMs) * intervalMs;
    if (!currentBucket || currentBucket.timestamp !== bucketStart) {
      if (currentBucket) {
        aggregated.push({
          timestamp: currentBucket.timestamp,
          value: currentBucket.sum / currentBucket.count,
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
    });
  }
  if (aggregated.length > maxBars) {
    return aggregated.slice(aggregated.length - maxBars);
  }
  return aggregated;
};

/**
 * The new draw function.
 * It is now very dumb and fast. It just draws what it's given.
 */
const drawBarChart: DrawFunction<AggregatedDataPoint> = (
  ctx,
  aggregatedData, // Receives the *pre-aggregated* data
  cssWidth,
  cssHeight
) => {
  // --- Mobile Responsive PADDING ---
  const mobilePadding = cssWidth < 480 ? 20 : 40;
  const padding = cssWidth < 768 ? mobilePadding : 40;
  
  const minX = aggregatedData[0].timestamp;
  // This intervalMs value is a bit of a guess, we should pass it in
  // For now, let's assume 60000ms
  const intervalMs = aggregatedData.length > 1 ? aggregatedData[1].timestamp - aggregatedData[0].timestamp : 60000;
  const maxX = aggregatedData[aggregatedData.length - 1].timestamp + intervalMs;
  const minY = 0;
  const maxY = 100;

  const chartWidth = cssWidth - padding * 2;
  const chartHeight = cssHeight - padding * 2;
  const chartTop = padding;
  const chartLeft = padding;

  const mapX = (value: number) => chartLeft + ((value - minX) / (maxX - minX)) * chartWidth;
  const mapY = (value: number) => chartTop + chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;

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
  ctx.font = cssWidth < 480 ? '10px monospace' : '12px monospace';

  for (let i = 0; i <= Y_AXIS_VALUE_COUNT; i++) {
    const value = minY + (maxY - minY) * (i / Y_AXIS_VALUE_COUNT);
    ctx.fillText(value.toFixed(0), chartLeft - padding + 10, mapY(value) + 3);
  }
  
  // --- Draw Bars ---
  ctx.fillStyle = BAR_COLOR;
  const barPadding = 0.1;

  aggregatedData.forEach((point) => {
    const x = mapX(point.timestamp);
    const barWidth = mapX(point.timestamp + intervalMs) - x;
    const actualBarWidth = barWidth * (1 - barPadding);
    const barXStart = x + (barWidth * barPadding) / 2;
    const barHeight = chartTop + chartHeight - mapY(point.value);
    const barY = mapY(point.value);

    ctx.fillRect(barXStart, barY, actualBarWidth, barHeight);
  });
};

export default function BarChart({
  data,
  intervalMs = 60000,
  maxBars = 60
}: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- THIS IS THE FIX ---
  // We run the expensive aggregation here, ONCE.
  // It only re-runs when the 'data' prop changes.
  const aggregatedData = useMemo(() => {
    return aggregateData(data, intervalMs, maxBars);
  }, [data, intervalMs, maxBars]);

  // We pass the *small, aggregated* data to the renderer.
  useChartRenderer({
    canvasRef,
    data: aggregatedData, // Pass the new array
    draw: drawBarChart,
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '300px', display: 'block' }}
    />
  );
}