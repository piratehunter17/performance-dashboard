'use client';

import React, { useState, useMemo, useCallback, useDeferredValue, useTransition } from 'react';
import { DataProvider, useData } from '@/components/providers/DataProvider';
import { generateInitialDataset } from '@/lib/dataGenerator';
import { DataPoint } from '@/lib/types';
// --- FIX: We only need FilterState from the hook ---
import { FilterState } from '@/hooks/useDataStream'; 

// Import all components
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import ScatterPlot from '@/components/charts/ScatterPlot';
import Heatmap from '@/components/charts/Heatmap';
import PerformanceMonitor from '@/components/ui/PerformanceMonitor';
import DataTable from '@/components/ui/DataTable';
// --- FIX: Remove the bad FilterState import from here ---
import FilterPanel from '@/components/controls/FilterPanel';
import TimeRangeSelector from '@/components/controls/TimeRangeSelector';

// --- Sub-component: Header (Composition Pattern) ---
function DashboardHeader({ totalPoints, displayedPoints }: { totalPoints: number; displayedPoints: number }) {
  return (
    <header className="db-header">
      <h1>Real-Time Performance Dashboard</h1>
      <div className="db-header-stats">
        <span>Total Points: <strong>{totalPoints}</strong></span>
        <br />
        <span>Displaying: <strong>{displayedPoints}</strong></span>
      </div>
    </header>
  );
}

// --- Sub-component: Controls (Composition Pattern) ---
function DashboardControlPanel({
  isRunning,
  onStreamToggle,
  onFilterChange,
  onTimeRangeChange,
  intervalMs,
  onStressToggle,
}: {
  isRunning: boolean;
  onStreamToggle: () => void;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onTimeRangeChange: (ms: number) => void;
  intervalMs: number;
  onStressToggle: () => void;
}) {
  const isStressed = intervalMs === 16;
  return (
    <section className="db-control-panel">
      <TimeRangeSelector onTimeRangeChange={onTimeRangeChange} />
      <FilterPanel onFilterChange={onFilterChange} />
      <button
        onClick={onStreamToggle}
        className={`db-stream-button ${!isRunning ? 'paused' : ''}`}
      >
        {isRunning ? 'Pause Stream' : 'Start Stream'}
      </button>
      <button
        onClick={onStressToggle}
        className={`db-stream-button ${!isStressed ? 'paused' : ''}`}
        title={isStressed ? "Set to 10 updates/sec" : "Set to 60 updates/sec"}
      >
        Stress Test: {isStressed ? 'ON' : 'OFF'}
      </button>
    </section>
  );
}

// --- Sub-component: Chart Grid (Composition Pattern) ---
function ChartGrid({
  lineData,
  barData,
  heatmapData
}: {
  lineData: DataPoint[];
  barData: { timestamp: number; value: number }[];
  heatmapData: { grid: number[][]; maxCount: number };
}) {
  return (
    <section className="db-chart-grid">
      <div className="db-chart-container">
        <h2>Live Line Chart (Zoomable)</h2>
        <LineChart data={lineData} />
      </div>
      <div className="db-chart-container">
        <h2>Data Table (Virtualized)</h2>
        <DataTable data={lineData} /> 
      </div>
      <div className="db-chart-container">
        <h2>Scatter Plot (Zoomable)</h2>
        <ScatterPlot data={lineData} />
      </div>
      <div className="db-chart-container">
        <h2>Aggregated Bar Chart</h2>
        <BarChart aggregatedData={barData} />
      </div>
      <div className="db-chart-container">
        <h2>Data Density Heatmap</h2>
        <Heatmap heatmapGrid={heatmapData} />
      </div>
      <br /><br />
    </section>
  );
}

// --- Main Layout Component ---
function DashboardLayout() {
  const { 
    dataRef,      
    dataTick,     
    isRunning, 
    startStream, 
    stopStream,
    intervalMs,
    setIntervalMs
  } = useData();

  const [filters, setFilters] = useState<FilterState>({
    aggregationIntervalMs: 60000,
    valueRange: { min: 0, max: 100 },
  });
  const [timeRangeMs, setTimeRangeMs] = useState<number>(300000); // 5 min default
  
  const [, startTransition] = useTransition();
  
  const deferredTick = useDeferredValue(dataTick);

  const processedPayload = useMemo(() => {
    const fullData = dataRef.current;
    if (fullData.length === 0) {
      return { lineData: [], barData: [], heatmapData: { grid: [], maxCount: 0 }, totalPoints: 0 };
    }

    const now = Date.now();
    
    const timeFiltered = timeRangeMs === 0
      ? fullData
      : fullData.filter(p => p && p.timestamp >= (now - timeRangeMs));
    const valueFiltered = timeFiltered.filter(
      p => p && p.value >= filters.valueRange.min && p.value <= filters.valueRange.max
    );

    const lineData = sampleData(valueFiltered, 1000);
    const barData = aggregateData(valueFiltered, filters.aggregationIntervalMs);
    const heatmapData = binHeatmapData(valueFiltered);

    return {
      lineData,
      barData,
      heatmapData,
      totalPoints: fullData.length,
    };
  }, [deferredTick, filters, timeRangeMs, dataRef]);

  // Callbacks for controls
  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    startTransition(() => {
      // The 'prev' error is now fixed because FilterState is correctly imported
      setFilters(prev => ({ ...prev, ...newFilters }));
    });
  }, []);

  const handleTimeRangeChange = useCallback((ms: number) => {
    startTransition(() => {
      setTimeRangeMs(ms);
    });
  }, []);
  
  const handleStressToggle = useCallback(() => {
    const newInterval = intervalMs === 100 ? 16 : 100;
    setIntervalMs(newInterval);
  }, [intervalMs, setIntervalMs]);

  return (
    <main className="db-page-wrapper">
      <PerformanceMonitor />
      
      <DashboardHeader 
        totalPoints={processedPayload.totalPoints} 
        displayedPoints={processedPayload.lineData.length} 
      />
      
      <DashboardControlPanel
        isRunning={isRunning}
        onStreamToggle={isRunning ? stopStream : startStream}
        onFilterChange={handleFilterChange}
        onTimeRangeChange={handleTimeRangeChange}
        intervalMs={intervalMs}
        onStressToggle={handleStressToggle}
      />
      
      <ChartGrid 
        lineData={processedPayload.lineData}
        barData={processedPayload.barData}
        heatmapData={processedPayload.heatmapData}
      />
    </main>
  );
}

// --- Helper functions for processing (must match worker) ---
const sampleData = (data: DataPoint[], maxPoints: number): DataPoint[] => {
  const validData = data.filter(p => p);
  if (validData.length <= maxPoints) return validData;
  const step = Math.ceil(validData.length / maxPoints);
  const sampled: DataPoint[] = [];
  for (let i = 0; i < validData.length; i += step) sampled.push(validData[i]);
  return sampled;
};

const aggregateData = (data: DataPoint[], intervalMs: number, maxBars: number = 60): { timestamp: number, value: number }[] => {
  if (data.length === 0 || intervalMs === 0) return [];
  const aggregated: { timestamp: number, value: number }[] = [];
  let currentBucket: { timestamp: number; sum: number; count: number } | null = null;
  for (const point of data) {
    if (!point) continue; 
    const bucketStart = Math.floor(point.timestamp / intervalMs) * intervalMs;
    if (!currentBucket || currentBucket.timestamp !== bucketStart) {
      if (currentBucket) aggregated.push({ timestamp: currentBucket.timestamp, value: currentBucket.sum / currentBucket.count });
      currentBucket = { timestamp: bucketStart, sum: 0, count: 0 };
    }
    currentBucket.sum += point.value;
    currentBucket.count++;
  }
  if (currentBucket) aggregated.push({ timestamp: currentBucket.timestamp, value: currentBucket.sum / currentBucket.count });
  return aggregated.length > maxBars ? aggregated.slice(aggregated.length - maxBars) : aggregated;
};

const binHeatmapData = (data: DataPoint[], numXBins: number = 50, numYBins: number = 10): { grid: number[][], maxCount: number } => {
  if (data.length === 0) return { grid: [], maxCount: 0 };
  const validData = data.filter(p => p); 
  if (validData.length === 0) return { grid: [], maxCount: 0 };
  
  const minX = validData[0].timestamp;
  let maxX = validData[validData.length - 1].timestamp;
  if (minX === maxX) maxX = minX + 1000; 
  
  const grid: number[][] = Array.from({ length: numXBins }, () => Array.from({ length: numYBins }, () => 0));
  let maxCount = 0;
  for (const point of validData) {
    const xRatio = (point.timestamp - minX) / (maxX - minX);
    const yRatio = (point.value - 0) / (100 - 0); 
    const xBin = Math.floor(xRatio * numXBins);
    const yBin = Math.floor(yRatio * numYBins);
    if (xBin >= 0 && xBin < numXBins && yBin >= 0 && yBin < numYBins) {
      grid[xBin][yBin]++;
      maxCount = Math.max(maxCount, grid[xBin][yBin]);
    }
  }
  return { grid, maxCount };
};

// --- Page Entry Point ---
export default function DashboardPage() {
  const [initialData] = useState(() => generateInitialDataset(1000, 100));
  return (
    <DataProvider initialData={initialData}>
      <DashboardLayout />
    </DataProvider>
  );
}