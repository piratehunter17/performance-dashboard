'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useVirtualization } from '@/hooks/useVirtualization';
import { DataPoint } from '@/lib/types';

// --- HYDRATION-SAFE VIEWPORT HOOK ---
// We'll use this to know when we are on the client
const useViewport = () => {
  const [width, setWidth] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWidth(window.innerWidth);
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // --- THIS IS THE FIX ---
  // We add 'isHydrated'
  if (width === undefined) {
    return { width: 1024, isMobile: false, isHydrated: false }; // <-- Add isHydrated
  }
  return { width, isMobile: width < 768, isHydrated: true }; // <-- Add isHydrated
};
// --- END HOOK ---

export default function DataTable({ data }: { data: DataPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // --- 1. Get the 'isHydrated' flag ---
  const { isMobile, isHydrated } = useViewport();
  
  const rowHeight = isMobile ? 60 : 30;
  const tableHeight = isMobile ? '300px' : '340px';

  const { startIndex, endIndex, totalHeight } = useVirtualization({
    itemHeight: rowHeight,
    itemCount: data.length,
    containerRef: containerRef,
  });

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [data]);

  const visibleItems = data.slice(startIndex, endIndex);

  // --- 2. THIS IS THE FIX ---
  // Only render the rows if the component is hydrated on the client.
  // On the server, this will be an empty array, avoiding the mismatch.
  const rowsToRender = isHydrated ? visibleItems : [];
  // --- END FIX ---

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
      overflow: 'hidden',
    }}>
      <div style={{
        display: isMobile ? 'none' : 'flex',
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
      
      <div
        ref={containerRef}
        style={{
          height: tableHeight, 
          overflowY: 'auto',
          position: 'relative',
          backgroundColor: cardBg,
          color: lightText,
        }}
      >
        <div style={{ height: `${totalHeight}px`, width: '100%' }}>
          
          {/* 3. Render the safe array */}
          {rowsToRender.map((item, index) => {
            const rowIndex = startIndex + index;
            
            return (
              <div
                key={item.timestamp} // Make sure timestamps are unique
                style={{
                  position: 'absolute',
                  top: `${rowIndex * rowHeight}px`,
                  left: 0,
                  right: 0,
                  height: `${rowHeight}px`,
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: isMobile ? 'center' : 'space-between',
                  padding: isMobile ? '0.5rem 1rem' : '0 1rem',
                  gap: isMobile ? '0.25rem' : '0',
                  fontFamily: 'monospace',
                  backgroundColor: rowIndex % 2 === 0 ? cardBg : darkBg,
                  borderBottom: `1px solid ${borderColorDim}`,
                  color: lightText,
                  overflow: 'hidden', 
                }}
              >
                <span style={{
                  fontSize: isMobile ? '0.8em' : '1em',
                  color: isMobile ? accentColor : lightText,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: isMobile ? '100%' : '250px',
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