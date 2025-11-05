'use client';

import React from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

/**
 * A simple UI component to display the metrics from the
 * usePerformanceMonitor hook as an overlay.
 */
export default function PerformanceMonitor() {
  const { fps, memoryUsed } = usePerformanceMonitor();

  // --- Futuristic Styles ---
  const accentColor = '#00f2ff'; // Bright Cyan
  const darkBg = '#1a1a2e'; // Dark Navy/Charcoal
  const lightText = '#e0e0e0';
  const borderColor = 'rgba(0, 242, 255, 0.5)';
  const accentGlow = 'rgba(0, 242, 255, 0.3)';

  // Helper to determine FPS color
  const getFpsColor = () => {
    if (fps > 50) return accentColor; // Good (Cyan)
    if (fps > 30) return '#e0e0e0';   // Medium (White)
    return '#ff4d4d'; // Bad (Red)
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      padding: '8px 12px',
      
      // --- Futuristic Styles Applied ---
      backgroundColor: darkBg,
      color: lightText,
      border: `1px solid ${borderColor}`,
      boxShadow: `0 0 10px ${accentGlow}`,
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 9999,
      minWidth: '100px',
      textAlign: 'left',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      opacity: 0.9, // Slight transparency
    }}>
      <div>
        <span style={{ color: accentColor }}>FPS: </span> 
        <strong style={{ color: getFpsColor(), fontSize: '1.1em' }}>
          {fps}
        </strong>
      </div>
      
      {/* Only show memory if the browser supports it */}
      {memoryUsed > 0 && (
        <div>
          <span style={{ color: accentColor }}>Mem: </span>
          <strong style={{ color: '#e0e0e0', fontSize: '1.1em' }}>
            {memoryUsed} MB
          </strong>
        </div>
      )}
    </div>
  );
}