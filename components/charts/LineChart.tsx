'use client';

// Make sure useState and useEffect are imported
import React, { useRef, useState, useEffect } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer, DrawFunction } from '@/hooks/useChartRenderer';

// --- HYDRATION-SAFE VIEWPORT HOOK ---
// This hook replaces your old one
const useViewport = () => {
  // 1. Default to 'undefined'
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    // 2. This effect runs *only* on the client
    const handleResize = () => setWidth(window.innerWidth);
    handleResize(); // Set initial width
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures it runs once on client mount

  if (width === undefined) {
    // 3. On the server (or first client render),
    // default to a non-mobile state to prevent hydration mismatch.
    return { width: 1024, isMobile: false }; 
  }

  // 4. On subsequent client renders, return the real value.
  return { width, isMobile: width < 768 };
};
// --- END HOOK ---

interface LineChartProps {
  data: DataPoint[];
}

const AXIS_COLOR = 'rgba(0, 242, 255, 0.2)'; 
const LABEL_COLOR = '#e0e0e0'; 
const LINE_COLOR = '#00f2ff'; 
const LINE_GLOW = 'rgba(0, 242, 255, 0.3)';

const drawLineChart: DrawFunction<DataPoint> = (
  ctx,
  data,
  cssWidth,
  cssHeight
) => {
  const mobilePadding = cssWidth < 480 ? 20 : 40;
  const padding = cssWidth < 768 ? mobilePadding : 40;
  const fontSize = cssWidth < 480 ? '10px monospace' : '12px monospace';
  const yAxisLabelCount = cssWidth < 480 ? 3 : 5;
  const xAxisLabelCount = cssWidth < 480 ? 3 : 5;

  if (data.length === 0) return; // Guard clause

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
    const value = minX + (maxX - minX) * (i / xAxisLabelCount);
    ctx.textAlign = 'center'; 
    ctx.fillText(new Date(value).toLocaleTimeString(), mapX(value), chartTop + chartHeight + 20);
  }
  ctx.textAlign = 'left';

  ctx.beginPath();
  ctx.strokeStyle = LINE_COLOR; 
  ctx.lineWidth = 2;
  ctx.shadowColor = LINE_GLOW;
  ctx.shadowBlur = 10;
  
  const step = Math.max(1, Math.ceil(data.length / chartWidth));
  
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
  const lastPoint = data[data.length - 1];
  ctx.lineTo(mapX(lastPoint.timestamp), mapY(lastPoint.value));
  ctx.stroke();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};


export default function LineChart({ data }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const { isMobile } = useViewport();
  const chartHeight = isMobile ? '300px' : '400px';

  useChartRenderer({
    canvasRef,
    data,
    draw: drawLineChart,
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