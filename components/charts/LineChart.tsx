'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
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


export default function LineChart({ data }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isMobile } = useViewport();
  const chartHeight = isMobile ? '300px' : '400px';

  const [viewDomain, setViewDomain] = useState<ViewDomain | null>(null);

  const defaultDomain = useMemo(() => {
    if (data.length === 0) return { min: Date.now() - 1000, max: Date.now() };
    return { min: data[0].timestamp, max: data[data.length - 1].timestamp };
  }, [data]);

  const activeView = viewDomain || defaultDomain;

  const isPanningRef = useRef(false);
  const lastPanXRef = useRef(0);

  const handleViewChange = (newDomain: ViewDomain | null) => {
    setViewDomain(newDomain);
  };
  
  const handleResetView = () => {
    setViewDomain(null);
  };

  const xToTimestamp = (x: number) => {
    if (!canvasRef.current) return 0;
    const rect = canvasRef.current.getBoundingClientRect();
    const padding = isMobile ? (rect.width < 480 ? 20 : 40) : 40;
    const chartWidth = rect.width - padding * 2;
    const chartLeft = padding;
    const { min, max } = activeView;
    
    const xInChart = x - rect.left - chartLeft;
    const xRatio = xInChart / chartWidth;
    return min + (max - min) * xRatio;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault(); 
      const { min, max } = activeView;
      const range = max - min;
      const zoomFactor = 0.001;
      const zoomAmount = e.deltaY * zoomFactor;
      const newRange = range * (1 + zoomAmount);
      
      if (!canvasRef.current) return;
      const mouseTimestamp = xToTimestamp(e.clientX);
      const newMin = mouseTimestamp - (mouseTimestamp - min) * (newRange / range);
      const newMax = mouseTimestamp + (max - mouseTimestamp) * (newRange / range);

      handleViewChange({ min: newMin, max: newMax });
    }
  };

  // --- REFACTORED PAN LOGIC ---
  
  // 1. Logic for starting a pan
  const handlePanStart = (clientX: number) => {
    isPanningRef.current = true;
    lastPanXRef.current = clientX;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  };

  // 2. Logic for moving a pan
  const handlePanMove = (clientX: number) => {
    if (!isPanningRef.current) return;
    const { min, max } = activeView;
    const range = max - min;
    const deltaX = clientX - lastPanXRef.current;
    if (deltaX === 0) return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const padding = isMobile ? (rect.width < 480 ? 20 : 40) : 40;
    const chartWidth = rect.width - padding * 2;
    const timeDelta = (deltaX / chartWidth) * range;
    const newMin = min - timeDelta;
    const newMax = max - timeDelta;
    lastPanXRef.current = clientX;
    handleViewChange({ min: newMin, max: newMax });
  };
  
  // 3. Logic for ending a pan
  const handlePanEnd = () => {
    isPanningRef.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  };

  // 4. Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => handlePanStart(e.clientX);
  const handleMouseMove = (e: React.MouseEvent) => handlePanMove(e.clientX);

  // 5. NEW: Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      e.preventDefault(); // Prevent page scroll
      handlePanStart(e.touches[0].clientX);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      e.preventDefault(); // Prevent page scroll
      handlePanMove(e.touches[0].clientX);
    }
  };
  // --- END REFACTOR ---

  const zoom = (factor: number) => {
    const { min, max } = activeView;
    const range = max - min;
    const center = min + range / 2;
    const newRange = range * factor;
    const newMin = center - newRange / 2;
    const newMax = center + newRange / 2;
    handleViewChange({ min: newMin, max: newMax });
  };
  
  const handleZoomIn = () => zoom(0.8);
  const handleZoomOut = () => zoom(1.2);

  useChartRenderer({
    canvasRef,
    data: [{ data, viewDomain: activeView }],
    draw: drawLineChart,
  });

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
    transition: 'opacity 0.2s, background-color 0.2s',
  };
  
  const resetButtonStyle: React.CSSProperties = {
    ...zoomButtonStyle,
    width: 'auto',
    fontSize: '12px',
    padding: '0 8px',
    textTransform: 'uppercase',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: chartHeight }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'row-reverse',
        gap: '5px',
        alignItems: 'center',
      }}>
        <button 
          onClick={handleZoomOut} 
          style={zoomButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          -
        </button>
        <button 
          onClick={handleZoomIn} 
          style={zoomButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          +
        </button>
        {viewDomain && (
          <button 
            onClick={handleResetView} 
            style={resetButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          >
            Reset
          </button>
        )}
      </div>
    
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block',
          cursor: 'grab',
          touchAction: 'none', // Prevents default touch actions
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handlePanEnd} // Use handlePanEnd
        onMouseLeave={handlePanEnd} // Use handlePanEnd
        // --- ADDED TOUCH HANDLERS ---
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePanEnd}
        onTouchCancel={handlePanEnd}
      />
    </div>
  );
}