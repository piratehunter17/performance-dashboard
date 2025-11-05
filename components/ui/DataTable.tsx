'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useVirtualization } from '@/hooks/useVirtualization';
import { DataPoint } from '@/lib/types';

// --- Viewport Hook ---
// We add this small hook here to manage responsiveness without CSS files
const useViewport = () => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize(); // Set initial width
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return { width };
};

const MOBILE_BREAKPOINT = 768; // pixels

export default function DataTable({ data }: { data: DataPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // --- Responsive State ---
  const { width } = useViewport();
  const isMobile = width < MOBILE_BREAKPOINT;
  
  // Use a taller row on mobile to fit stacked content
  const rowHeight = isMobile ? 60 : 30;

  // Use the virtualization hook
  const { startIndex, endIndex, totalHeight } = useVirtualization({
    itemHeight: rowHeight, // Pass the responsive row height
    itemCount: data.length,
    containerRef: containerRef,
  });

  // Get the slice of items that are currently visible
  const visibleItems = data.slice(startIndex, endIndex);

  // --- Futuristic Styles ---
  const accentColor = '#00f2ff';
  const darkBg = '#1a1a2e';
  const cardBg = '#1f1f33';
  const lightText = '#e0e0e0';
  const labelColor = accentColor;
  const borderColor = 'rgba(0, 242, 255, 0.5)';
  const borderColorDim = 'rgba(0, 242, 255, 0.2)';

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      backgroundColor: cardBg,
      color: lightText,
      fontFamily: 'monospace',
      borderRadius: '8px',
      overflow: 'hidden', // To contain the rounded corners
    }}>
      {/* Header: We hide this on mobile to save vertical space.
        The stacked rows will be self-explanatory.
      */}
      <div style={{
        display: isMobile ? 'none' : 'flex', // Hide on mobile
        justifyContent: 'space-between',
        fontWeight: 'bold',
        padding: '0.5rem 1rem',
        borderBottom: `1px solid ${borderColor}`,
        backgroundColor: darkBg,
        color: labelColor,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        <span>Timestamp</span>
        <span>Value</span>
      </div>
      
      {/* Scroll Container */}
      <div
        ref={containerRef}
        style={{
          height: '340px', // This height is fine, as it's set by the parent
          overflowY: 'auto',
          position: 'relative',
          backgroundColor: cardBg,
          color: lightText,
        }}
      >
        {/* Total Height Spacer */}
        <div style={{ height: `${totalHeight}px`, width: '100%' }}>
          
          {/* Visible Rows */}
          {visibleItems.map((item, index) => {
            const rowIndex = startIndex + index;
            
            return (
              <div
                key={item.timestamp}
                style={{
                  position: 'absolute',
                  top: `${rowIndex * rowHeight}px`,
                  left: 0,
                  right: 0,
                  height: `${rowHeight}px`,
                  
                  // --- Responsive Layout ---
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: isMobile ? 'center' : 'space-between',
                  padding: isMobile ? '0.5rem 1rem' : '0 1rem',
                  gap: isMobile ? '0.25rem' : '0',

                  // --- Futuristic Styles ---
                  fontFamily: 'monospace',
                  backgroundColor: rowIndex % 2 === 0 ? cardBg : darkBg,
                  borderBottom: `1px solid ${borderColorDim}`,
                  color: lightText,
                }}
              >
                {/* On mobile, we stack and label the data.
                  On desktop, we just show the values.
                */}
                <span style={{
                  fontSize: isMobile ? '0.8em' : '1em',
                  color: isMobile ? accentColor : lightText,
                }}>
                  {isMobile ? 'TS: ' : ''}{new Date(item.timestamp).toISOString()}
                </span>
                <span style={{
                  fontSize: isMobile ? '1em' : '1em',
                  color: '#fff',
                  fontWeight: 'bold',
                }}>
                  {isMobile ? 'Val: ' : ''}{item.value.toFixed(4)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}