# High-Performance Real-Time Dashboard

This project is a production-quality, real-time data visualization dashboard built to fulfill a technical assignment. The primary goal is to render **100,000+ data points** at a consistent **60fps** using a custom-built rendering engine in **Next.js 14 (App Router)** and TypeScript.

**No external chart libraries (e.g., D3, Chart.js) were used.** All visualizations, interactivity, and performance optimizations are built from scratch.

**Live Demo:** [https://performance-dashboard-swart.vercel.app/dashboard]



[Image of the futuristic dashboard UI]


---

## Features

* **Custom Canvas Rendering:** All charts (Line, Bar, Scatter, Heatmap) are rendered on `<canvas>` using a custom `requestAnimationFrame` hook (`useChartRenderer`) for maximum performance.
* **High-Frequency Updates:** The data stream (`useDataStream`) simulates a **60fps (16ms)** data influx, stress-testing the rendering pipeline.
* **Advanced Interactive Controls:**
    * **Independent Zoom/Pan:** Zoom (mousewheel/pinch) and Pan (click-drag/touch-drag) on a per-chart basis.
    * **Data Filtering:** Filter by value range using a custom slider.
    * **Time Range Selection:** View data in sliding windows (e.g., "Last 5 Min"), which is the primary strategy for managing large datasets.
    * **Data Aggregation:** A custom dropdown allows data to be aggregated into time buckets (1 Min, 5 Min, etc.) for the Bar Chart.
* **100k+ Point Scalability:** The `useDataStream` hook implements a **downsampling strategy**, allowing the dashboard to run indefinitely with stable memory by reducing the resolution of the oldest data.
* **Virtualized Data Table:** The data table uses a custom `useVirtualization` hook to render only the visible rows, effortlessly handling 100k+ items.
* **Fully Responsive Design:** A "futuristic" UI that works on desktop, tablet, and mobile, with touch events enabled for panning.

---

## Technical Stack

* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Rendering:** Custom Canvas 2D API Engine
* **State Management:** React Hooks (`useState`, `useRef`, `useMemo`, `useCallback`, `useContext`)
* **Performance:** React Concurrent Features (`useDeferredValue`, `useTransition`)
* **Styling:** CSS Globals with CSS Variables (for theming) and Media Queries (for responsiveness)

---

## 🚀 Key Performance Optimizations

This project's architecture is built around three core performance principles.

### 1. 60fps Rendering: The `useChartRenderer` Hook
All charts delegate their rendering to a custom `useChartRenderer` hook. This hook runs a single, centralized `requestAnimationFrame` loop, ensuring:
* **No Unnecessary Renders:** Charts only redraw once per frame, in perfect sync with the browser's paint cycle.
* **Efficiency:** The `draw` logic passed to the hook is highly optimized, using `useMemo` to pre-calculate expensive aggregations (for Bar/Heatmap) and sampling data (for Scatter) *before* it ever reaches the draw function.

### 2. Instant UI: Concurrent React (`useDeferredValue`)
The biggest performance bottleneck is the 60fps data stream updating the main `dataPoints` array. If this array is passed directly to the filter logic, the UI will lag.

This is solved using **`useDeferredValue`** in `app/dashboard/page.tsx`:
* The `dataPoints` array is deferred, telling React to treat data updates as a **low priority**.
* User interactions (like dragging the value-range slider) are treated as **high priority**.
* This allows the filter controls to remain **instantly responsive at 60fps**, even as new data floods in and the charts re-render in the background.

### 3. Stable Memory: Downsampling & Virtualization
* **Downsampling:** The `useDataStream` hook automatically downsamples the oldest 50% of the data when the 100k point limit is breached. This ensures **stable memory usage** (no leaks) and allows the application to run for hours.
* **Virtualization:** The `useVirtualization` hook ensures the `DataTable` only renders ~20 DOM nodes, regardless of whether the dataset contains 1,000 or 1,000,000 points.

---

## 🏗️ Next.js Architecture

This project uses a **Client Component-first architecture**, which is the correct, professional choice for a stateful, real-time application.

* **`app/dashboard/page.tsx` is a Client Component.** A real-time dashboard is not a static page. It is an *application*. It must use client-side state, context, and event handlers to function. Attempting to use Server Components for the core dashboard would be an incorrect application of the technology.
* **`DataProvider` Context:** A client-side React Context (`DataProvider`) is used to provide the live data stream to all components that need it, avoiding "prop-drilling."
* **Hydration-Safe Hooks:** All responsive components (charts, tables) use a custom, hydration-safe `useViewport` hook to prevent server/client UI mismatches and ensure smooth resizing.

---

## 🔧 Setup & Running Locally

1.  Clone the repository:
    ```bash
    git clone [https://github.com/piratehunter17/performance-dashboard.git](https://github.com/piratehunter17/performance-dashboard.git)
    ```
2.  Navigate to the directory:
    ```bash
    cd performance-dashboard
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to view the app.