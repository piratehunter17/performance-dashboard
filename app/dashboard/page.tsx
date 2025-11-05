'use client';

import React, { useState, useMemo, useCallback, useDeferredValue, useTransition } from 'react';
import { DataProvider, useData } from '@/components/providers/DataProvider';
import { generateInitialDataset } from '@/lib/dataGenerator';
import { DataPoint } from '@/lib/types';

// Import all components
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import ScatterPlot from '@/components/charts/ScatterPlot';
import Heatmap from '@/components/charts/Heatmap';
import PerformanceMonitor from '@/components/ui/PerformanceMonitor';
import DataTable from '@/components/ui/DataTable';
import FilterPanel, { FilterState } from '@/components/controls/FilterPanel';
import TimeRangeSelector from '@/components/controls/TimeRangeSelector';

// --- Sub-component: Header (Composition Pattern) ---
// Kept in the same file to avoid new files.
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
}: {
  isRunning: boolean;
  onStreamToggle: () => void;
  onFilterChange: (filters: FilterState) => void;
  onTimeRangeChange: (ms: number) => void;
}) {
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
    </section>
  );
}

// --- Sub-component: Chart Grid (Composition Pattern) ---
function ChartGrid({ data, aggregationIntervalMs }: { data: DataPoint[]; aggregationIntervalMs: number }) {
  return (
    <section className="db-chart-grid">
      <div className="db-chart-container">
        <h2>Live Line Chart</h2>
        <LineChart data={data} />
      </div>
      <div className="db-chart-container">
        <h2>Data Table (Virtualized)</h2>
        <DataTable data={data} />
      </div>
      <div className="db-chart-container">
        <h2>Aggregated Bar Chart</h2>
        <BarChart
          data={data}
          intervalMs={aggregationIntervalMs || 60000} // Default to 1 min if 'raw'
        />
      </div>
      <div className="db-chart-container">
        <h2>Scatter Plot</h2>
        <ScatterPlot data={data} />
      </div>
      <div className="db-chart-container">
        <h2>Data Density Heatmap</h2>
        <Heatmap data={data} />
      </div>
    </section>
  );
}

// --- Main Layout Component ---
function DashboardLayout() {
  const { dataPoints, isRunning, startStream, stopStream } = useData();

  // State for controls
  const [filters, setFilters] = useState<FilterState>({
    aggregationIntervalMs: 0,
    valueRange: { min: 0, max: 100 },
  });
  const [timeRangeMs, setTimeRangeMs] = useState<number>(0);
  
  // -- ADVANCED PERFORMANCE PATTERN --
  // This is the key to standing out.
  // We use useTransition to keep the UI snappy *while* filters are changing.
  const [, startTransition] = useTransition();

  // We defer the rapidly-updating data stream.
  // This tells React to de-prioritize filtering this data,
  // making the UI controls (sliders, buttons) feel instant.
  const deferredDataPoints = useDeferredValue(dataPoints);

  // Memoized processing now depends on the DEFERRED data.
  // This is the key: it won't block the main thread or lag the controls.
  const processedData = useMemo(() => {
    const now = Date.now();
    
    // 1. Apply time range filter
    const timeFiltered = timeRangeMs === 0
      ? deferredDataPoints
      : deferredDataPoints.filter(p => p.timestamp >= (now - timeRangeMs));

    // 2. Apply value range filter
    return timeFiltered.filter(
      p => p.value >= filters.valueRange.min && p.value <= filters.valueRange.max
    );
  }, [deferredDataPoints, filters, timeRangeMs]);

  // Callbacks for controls, wrapped in startTransition.
  // This tells React to treat the state update as non-urgent.
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    startTransition(() => {
      setFilters(newFilters);
    });
  }, []);

  const handleTimeRangeChange = useCallback((ms: number) => {
    startTransition(() => {
      setTimeRangeMs(ms);
    });
  }, []);

  return (
    <main className="db-page-wrapper">
      <PerformanceMonitor />
      
      <DashboardHeader 
        totalPoints={dataPoints.length} 
        displayedPoints={processedData.length} 
      />
      
      <DashboardControlPanel
        isRunning={isRunning}
        onStreamToggle={isRunning ? stopStream : startStream}
        onFilterChange={handleFilterChange}
        onTimeRangeChange={handleTimeRangeChange}
      />
      
      {/* We pass the processed data to the grid.
        This demonstrates a clean, top-down data flow.
      */}
      <ChartGrid 
        data={processedData} 
        aggregationIntervalMs={filters.aggregationIntervalMs} 
      />
    </main>
  );
}

// --- Page Entry Point ---
export default function DashboardPage() {
  // Generate the initial dataset here, on the client.
  const initialData = generateInitialDataset(1000, 100);

  return (
    <DataProvider initialData={initialData}>
      <DashboardLayout />
    </DataProvider>
  );
}