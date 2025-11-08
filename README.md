# High-Performance Real-Time Dashboard

This project is a production-quality, real-time data visualization dashboard built to fulfill a technical assignment. The primary goal is to render **100,000+ data points** at a consistent **60fps** using a custom-built rendering engine in **Next.js 16 (App Router)** and TypeScript.

**No external chart libraries (e.g., D3, Chart.js) were used.** All visualizations, interactivity, and performance optimizations are built from scratch.

**Live Demo:** https://performance-dashboard-smart.vercel.app


---

## Features

* **Custom Canvas Rendering:** All charts (Line, Bar, Scatter, Heatmap) are rendered on `<canvas>` using a custom `useChartRenderer` hook for maximum performance.
* **Real-time Data Stream:** A Web Worker generates new data points every 100ms, processed entirely off the main thread.
* **Advanced Interactive Controls:**
    * **Independent Zoom/Pan:** Zoom (Ctrl + mousewheel) and Pan (click-drag/touch-drag) on the Line and Scatter charts.
    * **Data Filtering:** Filter by value range using a custom dual-slider component.
    * **Time Range Selection:** View data in sliding windows (e.g., "Last 5 Min," "All").
    * **Data Aggregation:** A custom dropdown aggregates data into time buckets (1 Min, 5 Min, etc.) for the Bar Chart.
* **100k+ Point Scalability:** The data worker automatically downsamples data when the 100,000-point limit is breached, ensuring stable memory usage indefinitely.
* **Virtualized Data Table:** The data table uses a custom `useVirtualization` hook to render only the visible rows, effortlessly handling 100,000+ items.
* **Fully Responsive Design:** A modern UI that works on desktop, tablet, and mobile, with touch events enabled for panning.

---

## Technical Stack

* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript
* **Rendering:** Custom Canvas 2D API Engine (from scratch)
* **State Management:** React Hooks (`useState`, `useRef`, `useMemo`, `useCallback`) + React Context (`DataProvider.tsx`)
* **Performance:**
    * React Concurrent Features (`useTransition`, `useDeferredValue`)
    * Web Worker for background data processing
* **Styling:** CSS Globals with CSS Variables (for theming) and Media Queries

---

## 🔧 Setup & Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/piratehunter17/performance-dashboard.git
    ```
2.  **Navigate to the directory:**
    ```bash
    cd performance-dashboard
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
    (This will install React, Next.js, and TypeScript dependencies)
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    (This starts the Next.js development server with Webpack)
5.  **Open the app:**
    Open http://localhost:3000 in your browser. You will be automatically redirected to the dashboard page.

---

## 🧪 Performance Testing Instructions

For accurate performance metrics, run a production build:

1.  **Build the application:**
    ```bash
    npm run build
    ```
2.  **Start the production server:**
    ```bash
    npm run start
    ```
3.  **Test the dashboard:**
    * Open http://localhost:3000.
    * The **FPS and Memory monitor** is visible in the bottom-right corner.
    * Click the **"Stress Test: OFF"** button to toggle the data stream to 60 updates per second (16ms interval).
    * Interact with the **FilterPanel** sliders and **Time Range** buttons while the stress test is active to observe the non-blocking UI (<50ms latency).

---

## 🚀 Next.js Specific Optimizations

This project leverages modern Next.js App Router patterns for optimal performance:

* **Dynamic Server-Side Rendering:** The main `app/dashboard/page.tsx` is a **Dynamic Server Component**. It uses `export const dynamic = 'force-dynamic';` to ensure the server generates a fresh `initialData` array on every request. This solves the "stale data" problem of static builds while still providing a fast, meaningful first paint.
* **Clear Server/Client Boundaries:** The Server Component (`page.tsx`) generates the initial data and passes it as a prop to the main Client Component (`<DashboardClient />`). This is the ideal pattern, separating static generation from client-side interactivity.
* **Optimized Font Loading:** `app/layout.tsx` uses `next/font/google` (`Space_Mono`) to automatically handle font optimization, removing external network requests and preventing layout shift.
* **Edge Route Handlers:** The (optional) data API endpoint at `app/api/data/route.ts` is deployed to the Edge runtime (`export const runtime = 'edge';`) for the lowest possible latency.

---

## 🖥️ Browser Compatibility Notes

* **Modern Browsers:** The dashboard is built for modern browsers (Chrome, Firefox, Safari, Edge) that support Web Workers, `requestAnimationFrame`, and `ResizeObserver`.
* **Performance Monitor:** The memory usage display relies on the non-standard `performance.memory` API, which is **only available in Chromium-based browsers (Chrome, Edge)**. The FPS counter will work in all browsers.
* **IE11:** Not supported.
