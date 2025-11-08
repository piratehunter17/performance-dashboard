/**
 * Loading placeholder for the dashboard route.
 *
 * This component is rendered immediately by the server while the
 * main dashboard data is loading. It uses the global shimmer CSS
 * to present skeleton placeholders that approximate the final layout.
 */
export default function DashboardLoading() {

  // Base skeleton style used for all placeholder blocks
  const skeletonBaseStyle: React.CSSProperties = {
    borderRadius: '8px',
    opacity: 0.7,
  };

  // Placeholder for the large chart container (matches LineChart height)
  const chartContainerStyle: React.CSSProperties = {
    ...skeletonBaseStyle,
    border: '1px solid rgba(0, 242, 255, 0.5)',
    padding: '1rem',
    height: '400px',
  };

  // Shorter chart placeholder used for smaller charts
  const chartContainerStyleShort: React.CSSProperties = {
    ...chartContainerStyle,
    height: '300px',
  };

  // Control panel placeholders
  const controlPanelStyle: React.CSSProperties = {
    ...skeletonBaseStyle,
    height: '78px',
    flexGrow: 1,
  };

  const controlPanelStyleWide: React.CSSProperties = {
    ...controlPanelStyle,
    flexGrow: 2,
  };

  // Button placeholder
  const buttonStyle: React.CSSProperties = {
    ...skeletonBaseStyle,
    height: '44px',
    width: '160px',
  };

  return (
    <main className="db-page-wrapper">
      <header className="db-header">
        <h1>Real-Time Performance Dashboard</h1>
        <div className="db-header-stats">
          <span>Total Points: <strong>Loading...</strong></span>
          <br />
          <span>Displaying: <strong>Loading...</strong></span>
        </div>
      </header>

      {/* Control panel skeleton */}
      <section className="db-control-panel">
        <div className="skeleton-shimmer" style={controlPanelStyle} />
        <div className="skeleton-shimmer" style={controlPanelStyleWide} />
        <div className="skeleton-shimmer" style={buttonStyle} />
      </section>

      {/* Chart grid skeletons */}
      <section className="db-chart-grid">
        <div className="db-chart-container" style={{ opacity: 0.7 }}>
          <h2>Live Line Chart (Zoomable)</h2>
          <div className="skeleton-shimmer" style={{ height: '300px', borderRadius: '4px', marginTop: '1rem' }} />
        </div>
        <div className="db-chart-container" style={{ opacity: 0.7 }}>
          <h2>Data Table (Virtualized)</h2>
          <div className="skeleton-shimmer" style={{ height: '300px', borderRadius: '4px', marginTop: '1rem' }} />
        </div>
        <div className="db-chart-container" style={{ opacity: 0.7 }}>
          <h2>Scatter Plot (Zoomable)</h2>
          <div className="skeleton-shimmer" style={{ height: '200px', borderRadius: '4px', marginTop: '1rem' }} />
        </div>
        <div className="db-chart-container" style={{ opacity: 0.7 }}>
          <h2>Aggregated Bar Chart</h2>
          <div className="skeleton-shimmer" style={{ height: '200px', borderRadius: '4px', marginTop: '1rem' }} />
        </div>
      </section>
    </main>
  );
}