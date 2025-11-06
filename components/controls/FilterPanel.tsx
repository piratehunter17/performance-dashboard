'use client';

// Added 'useRef' to detect clicks outside the dropdown
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
  
  // --- NEW STATE for the custom dropdown ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for click-outside
  // ---

  const { isMobile } = useViewport(); // Use the safe hook

  // This effect calls the 'onFilterChange' callback
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // --- NEW: Click outside handler ---
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
  // ---

  // --- NEW: Handlers for custom dropdown ---
  const handleSelectOption = (value: number) => {
    setFilters((prev) => ({
      ...prev,
      aggregationIntervalMs: value,
    }));
    setIsDropdownOpen(false); // Close dropdown on select
  };
  
  const getSelectedLabel = () => {
    return AGGREGATION_OPTIONS.find(opt => opt.value === filters.aggregationIntervalMs)?.label;
  };
  // ---

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
      {/* Aggregation Control - REBUILT */}
      <div 
        ref={dropdownRef} // Add ref to the container
        style={{ position: 'relative' }} // Container for the absolute list
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
        
        {/* This is the new "select" box, built as a button */}
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
            width: isMobile ? '100%' : '150px', // Give it a fixed width
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {getSelectedLabel()}
          <span>{isDropdownOpen ? '▲' : '▼'}</span>
        </button>

        {/* This is the new, fully-styled dropdown list */}
        {isDropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '100%', // Position it right below the button
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

      {/* Value Range Control (Unchanged) */}
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
          flexDirection: isMobile ? 'column' : 'row',
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
              value={filters.valueRange.max}
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