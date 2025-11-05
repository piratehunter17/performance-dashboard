'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
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

interface ScatterPlotProps {
  data: DataPoint[];
  pointSize?: number;
  pointColor?: string;
}

const AXIS_COLOR = 'rgba(0, 242, 255, 0.2)'; 
const LABEL_COLOR = '#e0e0e0';
const POINT_COLOR_DEFAULT = '#00f2ff';
const POINT_GLOW = 'rgba(0, 242, 255, 0.3)';

export default function ScatterPlot({
  data,
  pointSize = 3,
  pointColor = POINT_COLOR_DEFAULT, 
}: ScatterPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { isMobile } = useViewport();
  const chartHeight = isMobile ? '250px' : '300px';

  const drawScatterPlot: DrawFunction<DataPoint> = useCallback((
    ctx,
    currentData,
    cssWidth,
    cssHeight
  ) => {
    if (currentData.length === 0) return;

    const mobilePadding = cssWidth < 480 ? 20 : 40;
    const padding = cssWidth < 768 ? mobilePadding : 40;
    const fontSize = cssWidth < 480 ? '10px monospace' : '12px monospace';
    const yAxisLabelCount = cssWidth < 480 ? 3 : 5;
    const xAxisLabelCount = cssWidth < 480 ? 3 : 5;

    const minX = currentData[0].timestamp;
    const maxX = currentData[currentData.length - 1].timestamp;
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
      const value = minX + (maxX - minX) * (i / xAxisLabelCount);
      ctx.textAlign = 'center';
      ctx.fillText(new Date(value).toLocaleTimeString(), mapX(value), chartTop + chartHeight + 20);
    }
    ctx.textAlign = 'left';

    ctx.fillStyle = pointColor;
    ctx.shadowColor = POINT_GLOW;
    ctx.shadowBlur = 10;

    const maxPointsToDraw = 1000; 
    let dataToDraw = currentData;
    
    if (currentData.length > maxPointsToDraw) {
      const step = Math.ceil(currentData.length / maxPointsToDraw);
      dataToDraw = [];
      for (let i = 0; i < currentData.length; i += step) {
        dataToDraw.push(currentData[i]);
      }
    }

    dataToDraw.forEach((point) => {
      const x = mapX(point.timestamp);
      const y = mapY(point.value);
      ctx.fillRect(x - pointSize / 2, y - pointSize / 2, pointSize, pointSize);
    });
    
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
      style={{ 
        width: '100%', 
        height: chartHeight, 
        display: 'block' 
      }}
    />
  );
}