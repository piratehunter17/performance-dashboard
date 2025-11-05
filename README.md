# High-Performance Real-Time Dashboard

This project is a high-performance, real-time dashboard built to render 100,000+ data points at 60fps, fulfilling the requirements of a technical assignment. It is built from scratch without any charting libraries.

**Live Demo:** [Link to your Vercel deployment]

## Core Features
- **Multiple Chart Types:** Line, Bar, Scatter, and Heatmap, all custom-built.
- **High-Performance Rendering:** Custom Canvas render loop using `requestAnimationFrame`.
- **Real-Time Data:** Simulates a 60fps data stream (new data every 16ms).
- **100k+ Data Points:** Scales to 100,000 points using a dynamic downsampling strategy.
- **Interactive Controls:** Time-range selection and data filtering.
- **Virtualization:** `DataTable` renders only visible rows, supporting 100k+ items.
- **Responsive Design:** Fully responsive futuristic UI for desktop, tablet, and mobile.

## Technical Stack
- **Frontend:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Rendering:** Direct-to-Canvas API
- **State Management:** React Hooks (`useContext`, `useDeferredValue`, `useTransition`)

## Key Performance Optimizations
1.  **Concurrent Rendering (`useDeferredValue`):** The main dashboard page uses `useDeferredValue` to de-prioritize the heavy data filtering. This keeps the UI controls (sliders, buttons) **instantly responsive (sub-50ms)**, even while 100,000 data points are being processed in the background.
2.  **Abstracted Render Loop (`useChartRenderer`):** All chart rendering is centralized in a custom hook that uses `requestAnimationFrame`. This ensures charts render at the maximum possible FPS (60/120/144fps) and are perfectly in sync with the browser's paint cycle.
3.  **Dynamic Downsampling:** The `useDataStream` hook implements a downsampling strategy. When the data set exceeds 100,000 points, it automatically reduces the resolution of the *oldest* data by averaging pairs, ensuring **stable memory usage** and allowing the dashboard to run indefinitely.
4.  **List Virtualization:** The `DataTable` uses a custom `useVirtualization` hook to calculate and render *only* the rows currently in the viewport, allowing it to easily handle 100,000+ rows.

## Running Locally

1. Clone the repository:
   ```bash
   git clone [https://github.com/piratehunter17/performance-dashboard.git](https://github.com/piratehunter17/performance-dashboard.git)