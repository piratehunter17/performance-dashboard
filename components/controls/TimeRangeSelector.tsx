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

// Define the time range options.
const TIME_RANGE_OPTIONS = [
  { label: 'Last 1 Min', value: 60 * 1000 },
  { label: 'Last 5 Min', value: 5 * 60 * 1000 },
  { label: 'Last 30 Min', value: 30 * 60 * 1000 },
  { label: 'Last 1 Hour', value: 60 * 60 * 1000 },
  { label: 'All', value: 0 },
];

interface TimeRangeSelectorProps {
  onTimeRangeChange: (milliseconds: number) => void;
}

export default function TimeRangeSelector({ onTimeRangeChange }: TimeRangeSelectorProps) {
  const [selectedRangeMs, setSelectedRangeMs] = useState<number>(0);
  
  const { width } = useViewport();
  const isMobile = width < MOBILE_BREAKPOINT;

  useEffect(() => {
    onTimeRangeChange(selectedRangeMs);
  }, [selectedRangeMs, onTimeRangeChange]);

  const handleSelectRange = (value: number) => {
    setSelectedRangeMs(value);
  };

  // --- Futuristic Styles ---
  const accentColor = '#00f2ff';
  const darkBg = '#1a1a2e';
  const lightText = '#e0e0e0';
  const labelColor = accentColor;
  const borderColor = accentColor;

  return (
    <div style={{
      padding: '0.8rem 1rem',
      backgroundColor: darkBg,
      color: lightText,
      borderRadius: '8px',
      border: `1px solid ${borderColor}`,
      fontFamily: 'monospace',
      boxShadow: `0 0 10px rgba(0, 242, 255, 0.3), 0 0 20px rgba(0, 242, 255, 0.2) inset`,
      
      // --- Mobile Responsive Styles ---
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: isMobile ? '0.8rem' : '1rem',
    }}>
      <span style={{
        fontWeight: 'bold',
        marginRight: isMobile ? 0 : '1rem',
        fontSize: '0.9em',
        color: labelColor,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        verticalAlign: 'middle',
        textAlign: isMobile ? 'center' : 'left', // Center label on mobile
      }}>
        Time Range:
      </span>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        justifyContent: isMobile ? 'center' : 'flex-start', // Center buttons on mobile
      }}>
        {TIME_RANGE_OPTIONS.map((opt) => {
          const isActive = selectedRangeMs === opt.value;
          
          return (
            <button
              key={opt.value}
              onClick={() => handleSelectRange(opt.value)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                border: `1px solid ${accentColor}`,
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.9em',
                transition: 'all 0.2s ease-in-out',
                
                backgroundColor: isActive ? accentColor : 'transparent',
                color: isActive ? darkBg : accentColor,
                fontWeight: isActive ? 'bold' : 'normal',
                boxShadow: isActive ? `0 0 5px ${accentColor}` : 'none',
                
                // --- Mobile Responsive Styles ---
                flexGrow: isMobile ? 1 : 0, // Allow buttons to grow to fill space
                minWidth: '100px', // Ensure buttons have a good tap size
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}