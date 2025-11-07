'use client';

import React, { useState, useEffect, useRef } from 'react';

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

const MOBILE_BREAKPOINT = 768; // pixels

// Define the shape of the filter state
export interface FilterState {
  aggregationIntervalMs: number;
  valueRange: { min: number; max: number };
}

// Define the component's props
interface FilterPanelProps {
  onFilterChange: (filters: Partial<FilterState>) => void; // Use Partial
}

// Define the aggregation options
const AGGREGATION_OPTIONS = [
  { label: 'Raw Data', value: 0 },
  { label: '1 Min Avg', value: 60 * 1000 },
  { label: '5 Min Avg', value: 5 * 60 * 1000 },
  { label: '1 Hour Avg', value: 60 * 60 * 1000 },
];

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  // --- Local state for inputs ---
  // --- FIX: Default aggregation to 1 Min Avg ---
  const [aggregationMs, setAggregationMs] = useState(60000); 
  const [valueRange, setValueRange] = useState({ min: 0, max: 100 });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isMobile } = useViewport();

  // --- THIS IS THE FIX ---
  // We must call onFilterChange when the component
  // first loads to send the initial default state.
  useEffect(() => {
    onFilterChange({
      aggregationIntervalMs: aggregationMs,
      valueRange: valueRange,
    });
  // We only want this to run ONCE on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // --- END FIX ---

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);
  
  // Handlers now call onFilterChange
  const handleSelectOption = (value: number) => {
    setAggregationMs(value);
    onFilterChange({ aggregationIntervalMs: value });
    setIsDropdownOpen(false);
  };
  
  const getSelectedLabel = () => {
    return AGGREGATION_OPTIONS.find(opt => opt.value === aggregationMs)?.label;
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), valueRange.max);
    setValueRange(prev => ({ ...prev, min: newMin }));
    onFilterChange({ valueRange: { min: newMin, max: valueRange.max } });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), valueRange.min);
    setValueRange(prev => ({ ...prev, max: newMax }));
    onFilterChange({ valueRange: { min: valueRange.min, max: newMax } });
  };

  // --- Futuristic Styles ---
  const accentColor = '#00f2ff';
  const darkBg = '#1a1a2e';
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
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      flexWrap: isMobile ? 'nowrap' : 'wrap',
    }}>
      {/* Aggregation Control */}
      <div 
        ref={dropdownRef}
        style={{ position: 'relative' }}
      >
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
        
        <button
          id="aggregation"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: `1px solid ${borderColor}`,
            backgroundColor: darkBg,
            color: lightText,
            fontFamily: 'monospace',
            fontSize: '1em',
            cursor: 'pointer',
            width: isMobile ? '100%' : '150px',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {getSelectedLabel()}
          <span>{isDropdownOpen ? '▲' : '▼'}</span>
        </button>

        {isDropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 20,
            backgroundColor: darkBg,
            border: `1px solid ${borderColor}`,
            borderRadius: '4px',
            marginTop: '4px',
            overflow: 'hidden',
            boxShadow: `0 5px 15px rgba(0, 242, 255, 0.2)`,
          }}>
            {AGGREGATION_OPTIONS.map((opt) => (
              <div 
                key={opt.value} 
                onClick={() => handleSelectOption(opt.value)}
                style={{
                  padding: '0.5rem',
                  color: lightText,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor, e.currentTarget.style.color = darkBg)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = darkBg, e.currentTarget.style.color = lightText)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
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
          Value Range ({valueRange.min} - {valueRange.max})
        </label>
        <div style={{
          display: 'flex',
          gap: isMobile ? '1rem' : '0.5rem',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <span>Min:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={valueRange.min}
              onChange={handleMinChange}
              style={{
                width: '100%',
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
              value={valueRange.max}
              onChange={handleMaxChange}
              style={{
                width: '100%',
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