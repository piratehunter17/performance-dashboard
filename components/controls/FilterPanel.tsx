'use client';

import React, { useState, useEffect } from 'react';

// Simple hook to track viewport width
const useViewport = () => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    
    // Set initial width on mount
    handleResize(); 
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return { width };
};

const MOBILE_BREAKPOINT = 768; // pixels

// Define the shape of the filter state
export interface FilterState {
  /**
   * Aggregation interval in milliseconds.
   * 0 means 'raw data' (no aggregation).
   */
  aggregationIntervalMs: number;
  
  /**
   * The range of values to display.
   */
  valueRange: { min: number; max: number };
}

// Define the component's props
interface FilterPanelProps {
  /**
   * A callback function to notify the parent component
   * (app/dashboard/page.tsx) when the filter settings change.
   */
  onFilterChange: (filters: FilterState) => void;
}

// Define the aggregation options
const AGGREGATION_OPTIONS = [
  { label: 'Raw Data', value: 0 },
  { label: '1 Min Avg', value: 60 * 1000 },
  { label: '5 Min Avg', value: 5 * 60 * 1000 },
  { label: '1 Hour Avg', value: 60 * 60 * 1000 },
];

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    aggregationIntervalMs: 0, // Default to raw data
    valueRange: { min: 0, max: 100 }, // Default to full range
  });
  
  const { width } = useViewport();
  const isMobile = width < MOBILE_BREAKPOINT;

  // This effect calls the 'onFilterChange' callback
  // whenever the local 'filters' state changes.
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Handlers to update local state
  const handleAggregationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      aggregationIntervalMs: Number(e.target.value),
    }));
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), filters.valueRange.max);
    setFilters((prev) => ({
      ...prev,
      valueRange: { ...prev.valueRange, min: newMin },
    }));
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), filters.valueRange.min);
    setFilters((prev) => ({
      ...prev,
      valueRange: { ...prev.valueRange, max: newMax },
    }));
  };

  // --- Futuristic Styles ---
  const accentColor = '#00f2ff'; // Bright Cyan
  const darkBg = '#1a1a2e'; // Dark Navy/Charcoal
  const lightText = '#e0e0e0';
  const labelColor = accentColor;
  const borderColor = accentColor;

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: darkBg,
      color: lightText,
      borderRadius: '8px',
      border: `1px solid ${borderColor}`,
      display: 'flex',
      gap: '1.5rem',
      fontFamily: 'monospace',
      boxShadow: `0 0 10px rgba(0, 242, 255, 0.3), 0 0 20px rgba(0, 242, 255, 0.2) inset`,
      
      // --- Mobile Responsive Styles ---
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      flexWrap: isMobile ? 'nowrap' : 'wrap', // Prevent wrapping on mobile stack
    }}>
      {/* Aggregation Control */}
      <div>
        <label htmlFor="aggregation" style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontSize: '0.9em',
          fontWeight: 'bold',
          color: labelColor,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Data Aggregation
        </label>
        <select
          id="aggregation"
          value={filters.aggregationIntervalMs}
          onChange={handleAggregationChange}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: `1px solid ${borderColor}`,
            backgroundColor: darkBg,
            color: lightText,
            fontFamily: 'monospace',
            fontSize: '1em',
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto', // Full width on mobile
          }}
        >
          {AGGREGATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: darkBg, color: lightText }}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Value Range Control */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontSize: '0.9em',
          fontWeight: 'bold',
          color: labelColor,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Value Range ({filters.valueRange.min} - {filters.valueRange.max})
        </label>
        <div style={{
          display: 'flex',
          gap: isMobile ? '1rem' : '0.5rem',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row', // Stack sliders on mobile
        }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <span>Min:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.valueRange.min}
              onChange={handleMinChange}
              style={{
                width: '100%', // Full width
                minWidth: '120px',
                accentColor: accentColor,
                cursor: 'pointer',
                marginLeft: '0.5rem',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <span style={{ marginLeft: isMobile ? 0 : '1rem' }}>Max:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.valueRange.max}
              onChange={handleMaxChange}
              style={{
                width: '100%', // Full width
                minWidth: '120px',
                accentColor: accentColor,
                cursor: 'pointer',
                marginLeft: '0.5rem',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}