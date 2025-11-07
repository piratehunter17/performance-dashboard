'use client';

// Remove useMemo, useDeferredValue
import React, { useRef, useState, useEffect } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer, DrawFunction } from '@/hooks/useChartRenderer';

// --- HYDRATION-SAFE VIEWPORT HOOK ---
const useViewport = () => {
  const [width, setWidth] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (typeof window === 'undefined') return;
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

type AggregatedDataPoint = { timestamp: number; value: number };

// --- NEW Props: We now receive the pre-aggregated data ---
interface BarChartProps {
  aggregatedData: AggregatedDataPoint[];
}

const AXIS_COLOR = 'rgba(0, 242, 255, 0.2)';
const LABEL_COLOR = '#e0e0e0';
const BAR_COLOR = '#00f2ff';

// --- Aggregation logic is REMOVED ---

const drawBarChart: DrawFunction<AggregatedDataPoint> = (
  ctx,
  aggregatedData,
  cssWidth,
  cssHeight
) => {
  if (aggregatedData.length === 0) return;

  const mobilePadding = cssWidth < 480 ? 20 : 40;
  const padding = cssWidth < 768 ? mobilePadding : 40;
  const yAxisLabelCount = cssWidth < 480 ? 3 : 5;
  const xAxisLabelCount = cssWidth < 480 ? 3 : 5;
  const fontSize = cssWidth < 480 ? '10px monospace' : '12px monospace';
  
  const minX = aggregatedData[0].timestamp;
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
    const value = minY + (maxY - minY) * (i / yAxisLabelCount);
    ctx.fillText(value.toFixed(0), chartLeft - padding + 10, mapY(value) + 3);
  }
  
  for (let i = 0; i <= xAxisLabelCount; i++) {
    const dataIndex = Math.floor((aggregatedData.length - 1) * (i / xAxisLabelCount));
    const point = aggregatedData[dataIndex];
    if (point) {
      const x = mapX(point.timestamp + intervalMs / 2);
      ctx.textAlign = 'center';
      ctx.fillText(new Date(point.timestamp).toLocaleTimeString(), x, chartTop + chartHeight + 20);
    }
  }
  ctx.textAlign = 'left';
  
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
  aggregatedData // Use new prop
}: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const { isMobile } = useViewport();
  const chartHeight = isMobile ? '250px' : '300px';

  // --- ALL useMemo and useDeferredValue logic is GONE ---

  useChartRenderer({
    canvasRef,
    data: aggregatedData, // Pass prop directly
    draw: drawBarChart,
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