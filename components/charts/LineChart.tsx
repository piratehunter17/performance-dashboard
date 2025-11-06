'use client';

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

type ViewDomain = { min: number; max: number };
interface LineChartProps {
  data: DataPoint[];
  viewDomain: ViewDomain;
  onViewChange: (domain: ViewDomain | null) => void;
}

const AXIS_COLOR = 'rgba(0, 242, 255, 0.2)'; 
const LABEL_COLOR = '#e0e0e0'; 
const LINE_COLOR = '#00f2ff'; 
const LINE_GLOW = 'rgba(0, 242, 255, 0.3)';

const drawLineChart: DrawFunction<{data: DataPoint[], viewDomain: ViewDomain}> = (
  ctx,
  chartState, 
  cssWidth,
  cssHeight
) => {
  const { data, viewDomain } = chartState[0]; 
  if (data.length === 0) return;
  
  const mobilePadding = cssWidth < 480 ? 20 : 40;
  const padding = cssWidth < 768 ? mobilePadding : 40;
  const fontSize = cssWidth < 480 ? '10px monospace' : '12px monospace';
  const yAxisLabelCount = cssWidth < 480 ? 3 : 5;
  const xAxisLabelCount = cssWidth < 480 ? 3 : 5;

  const { min: minX, max: maxX } = viewDomain;
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
  let firstPoint = true;
  for (let i = 0; i < data.length; i += step) {
    const point = data[i];
    if (point.timestamp >= minX && point.timestamp <= maxX) {
        const x = mapX(point.timestamp);
        const y = mapY(point.value);
        if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
        } else {
            ctx.lineTo(x, y);
        }
    }
  }
  ctx.stroke();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};


export default function LineChart({ data, viewDomain, onViewChange }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isMobile } = useViewport();
  const chartHeight = isMobile ? '300px' : '400px';

  const isPanningRef = useRef(false);
  const lastPanXRef = useRef(0);

  const xToTimestamp = (x: number) => {
    if (!canvasRef.current) return 0;
    const rect = canvasRef.current.getBoundingClientRect();
    const padding = isMobile ? (rect.width < 480 ? 20 : 40) : 40;
    const chartWidth = rect.width - padding * 2;
    const chartLeft = padding;
    const { min, max } = viewDomain;
    
    const xInChart = x - rect.left - chartLeft;
    const xRatio = xInChart / chartWidth;
    return min + (max - min) * xRatio;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault(); 
      const { min, max } = viewDomain;
      const range = max - min;
      const zoomFactor = 0.001;
      const zoomAmount = e.deltaY * zoomFactor;
      const newRange = range * (1 + zoomAmount);
      
      if (!canvasRef.current) return;
      const mouseTimestamp = xToTimestamp(e.clientX);
      const newMin = mouseTimestamp - (mouseTimestamp - min) * (newRange / range);
      const newMax = mouseTimestamp + (max - mouseTimestamp) * (newRange / range);

      onViewChange({ min: newMin, max: newMax });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isPanningRef.current = true;
    lastPanXRef.current = e.clientX;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanningRef.current) return;
    const { min, max } = viewDomain;
    const range = max - min;
    const deltaX = e.clientX - lastPanXRef.current;
    if (deltaX === 0) return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const padding = isMobile ? (rect.width < 480 ? 20 : 40) : 40;
    const chartWidth = rect.width - padding * 2;
    const timeDelta = (deltaX / chartWidth) * range;
    const newMin = min - timeDelta;
    const newMax = max - timeDelta;
    lastPanXRef.current = e.clientX;
    onViewChange({ min: newMin, max: newMax });
  };

  const handleMouseUp = () => {
    isPanningRef.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  };

  // --- NEW: Zoom Button Logic ---
  const zoom = (factor: number) => {
    const { min, max } = viewDomain;
    const range = max - min;
    const center = min + range / 2;
    const newRange = range * factor;
    
    const newMin = center - newRange / 2;
    const newMax = center + newRange / 2;
    
    onViewChange({ min: newMin, max: newMax });
  };
  
  const handleZoomIn = () => zoom(0.8); // Zoom in by 20%
  const handleZoomOut = () => zoom(1.2); // Zoom out by 20%

  useChartRenderer({
    canvasRef,
    data: [{ data, viewDomain }],
    draw: drawLineChart,
  });

  // --- NEW: Zoom Button Styles ---
  const zoomButtonStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0, 242, 255, 0.5)',
    border: '1px solid rgba(0, 242, 255, 0.8)',
    color: '#1a1a2e',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: '18px',
    width: '30px',
    height: '30px',
    lineHeight: '28px',
    textAlign: 'center',
    cursor: 'pointer',
    borderRadius: '4px',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  };

  return (
    // 1. Wrap in a relative container
    <div style={{ position: 'relative', width: '100%', height: chartHeight }}>
      {/* 2. Add the buttons */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }}>
        <button 
          onClick={handleZoomIn} 
          style={zoomButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          +
        </button>
        <button 
          onClick={handleZoomOut} 
          style={zoomButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          -
        </button>
      </div>
    
      {/* 3. The Canvas */}
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', // Fill the container
          display: 'block',
          cursor: 'grab'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} 
      />
    </div>
  );
}