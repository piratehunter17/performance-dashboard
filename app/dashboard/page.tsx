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

// --- Domain/View Types ---
type ViewDomain = { min: number; max: number } | null;

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
  onResetView,
  hasZoom, // New prop
}: {
  isRunning: boolean;
  onStreamToggle: () => void;
  onFilterChange: (filters: FilterState) => void;
  onTimeRangeChange: (ms: number) => void;
  onResetView: () => void; // New prop
  hasZoom: boolean; // New prop
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
      {/* --- ADDED RESET ZOOM BUTTON --- */}
      {hasZoom && (
        <button
          onClick={onResetView}
          className="db-stream-button paused" // Use 'paused' style
          style={{ width: '100%' }} // Make it full width on mobile
        >
          Reset Zoom
        </button>
      )}
    </section>
  );
}

// --- Sub-component: Chart Grid (Composition Pattern) ---
function ChartGrid({ 
  data, 
  viewDomain, // New prop
  onViewChange, // New prop
  aggregationIntervalMs 
}: { 
  data: DataPoint[]; 
  viewDomain: { min: number; max: number }; // New prop
  onViewChange: (domain: ViewDomain) => void; // New prop
  aggregationIntervalMs: number 
}) {
  return (
    <section className="db-chart-grid">
      <div className="db-chart-container">
        <h2>Live Line Chart (Zoomable)</h2>
        <LineChart 
          data={data} 
          viewDomain={viewDomain} // Pass view state
          onViewChange={onViewChange} // Pass callback
        />
      </div>
      <div className="db-chart-container">
        <h2>Data Table (Virtualized)</h2>
        <DataTable data={data} />
      </div>
      <div className="db-chart-container">
        <h2>Scatter Plot (Zoomable)</h2>
        <ScatterPlot 
          data={data} 
          viewDomain={viewDomain} // Pass view state
          onViewChange={onViewChange} // Pass callback
        />
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
  
  // --- NEW STATE FOR ZOOM/PAN ---
  const [viewDomain, setViewDomain] = useState<ViewDomain>(null);

  const [, startTransition] = useTransition();
  const deferredDataPoints = useDeferredValue(dataPoints);

  // 1. Process data for the selected TIME RANGE and VALUE
  const processedData = useMemo(() => {
    const now = Date.now();
    const timeFiltered = timeRangeMs === 0
      ? deferredDataPoints
      : deferredDataPoints.filter(p => p.timestamp >= (now - timeRangeMs));
    return timeFiltered.filter(
      p => p.value >= filters.valueRange.min && p.value <= filters.valueRange.max
    );
  }, [deferredDataPoints, filters, timeRangeMs]);

  // 2. Calculate the "default" view, which is the full extent of the processed data
  const defaultChartDomain = useMemo(() => {
    if (processedData.length === 0) return { min: Date.now() - 1000, max: Date.now() };
    return {
      min: processedData[0].timestamp,
      max: processedData[processedData.length - 1].timestamp,
    };
  }, [processedData]);

  // 3. The "active" view is either the user's zoomed-in state (viewDomain) or the default
  const activeView = viewDomain || defaultChartDomain;

  // --- Callbacks for controls ---

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    startTransition(() => {
      setFilters(newFilters);
      setViewDomain(null); // Reset zoom on filter change
    });
  }, []);

  const handleTimeRangeChange = useCallback((ms: number) => {
    startTransition(() => {
      setTimeRangeMs(ms);
      setViewDomain(null); // Reset zoom on time range change
    });
  }, []);

  // --- NEW CALLBACKS for Zoom/Pan ---

  const handleViewChange = useCallback((newDomain: ViewDomain) => {
    startTransition(() => {
      setViewDomain(newDomain);
    });
  }, []);

  const handleResetView = useCallback(() => {
    setViewDomain(null);
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
        onResetView={handleResetView} // Pass reset callback
        hasZoom={!!viewDomain} // Pass zoom state
      />
      
      <ChartGrid 
        data={processedData} 
        viewDomain={activeView} // Pass the active view
        onViewChange={handleViewChange} // Pass the update callback
        aggregationIntervalMs={filters.aggregationIntervalMs} 
      />
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