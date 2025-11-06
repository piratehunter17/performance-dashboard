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
// --- REMOVED hasZoom and onResetView props ---
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
      {/* --- Global Reset Button REMOVED --- */}
    </section>
  );
}

// --- Sub-component: Chart Grid (Composition Pattern) ---
// --- REMOVED viewDomain and onViewChange props ---
function ChartGrid({ data, aggregationIntervalMs }: { data: DataPoint[]; aggregationIntervalMs: number }) {
  return (
    <section className="db-chart-grid">
      <div className="db-chart-container">
        <h2>Live Line Chart (Zoomable)</h2>
        {/* --- No zoom props passed --- */}
        <LineChart data={data} />
      </div>
      <div className="db-chart-container">
        <h2>Data Table (Virtualized)</h2>
        <DataTable data={data} />
      </div>
      <div className="db-chart-container">
        <h2>Scatter Plot (Zoomable)</h2>
        {/* --- No zoom props passed --- */}
        <ScatterPlot data={data} />
      </div>
      <div className="db-chart-container">
        <h2>Aggregated Bar Chart</h2>
        <BarChart
          data={data}
          intervalMs={aggregationIntervalMs || 60000} 
        />
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
  const [timeRangeMs, setTimeRangeMs] = useState<number>(300000); // 5 min default
  
  // --- All Zoom/Pan state REMOVED from this component ---

  const [, startTransition] = useTransition();
  const deferredDataPoints = useDeferredValue(dataPoints);

  const processedData = useMemo(() => {
    const now = Date.now();
    
    const timeFiltered = timeRangeMs === 0
      ? deferredDataPoints
      : deferredDataPoints.filter(p => p.timestamp >= (now - timeRangeMs));

    return timeFiltered.filter(
      p => p.value >= filters.valueRange.min && p.value <= filters.valueRange.max
    );
  }, [deferredDataPoints, filters, timeRangeMs]);

  // --- Callbacks for controls ---
  // --- Removed all setViewDomain(null) calls ---
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
      
      <ChartGrid 
        data={processedData} 
        aggregationIntervalMs={filters.aggregationIntervalMs} 
      />
      <br /><br /><br />
    </main>
  );
}

// --- Page Entry Point ---
export default function DashboardPage() {
  const [initialData] = useState(() => generateInitialDataset(1000, 100));

  return (
    <DataProvider initialData={initialData}>
      <DashboardLayout />
    </DataProvider>
  );
}