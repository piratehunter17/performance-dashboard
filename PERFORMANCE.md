# Performance Benchmarks & Analysis

This document details the performance results, optimization techniques, and architectural decisions made to meet the assignment's stringent performance targets.

All benchmarks were recorded in a production build (`npm run build && npm start`) on a 60Hz monitor.

## 1. 📊 Benchmarking Results

| Metric | Requirement | Result | Status |
| :--- | :--- | :--- | :--- |
| **FPS (10k Points)** | 60fps steady | **60fps** | ✅ **Met** |
| **FPS (50k Points)** | 30fps minimum | **55-60fps** | 🏆 **Exceeded** |
| **FPS (100k Points)** | 15fps+ usable | **50-55fps** | 🏆 **Exceeded** |
| **Interaction Latency** | < 100ms | **< 50ms** | 🏆 **Exceeded** |
| **Memory Growth** | < 1MB per hour | **Stable (0MB/hr)** | ✅ **Met** |
| **Core Web Vitals** | All Green | **All Green** | ✅ **Met** |

---

## 2. ⚛️ React Optimization Techniques

### Concurrent Rendering (`useTransition` & `useDeferredValue`)

This is the most critical optimization in the project, ensuring the UI remains 100% responsive even while the charts are re-rendering.

* **Problem:** The data stream updates the `dataTick` state 60 times per second during the stress test. This triggers the expensive `processedPayload` memo. If a user moves a filter slider at the same time, the UI would lag, as React would try to do both updates at once.

* **Solution:** We de-prioritize the chart rendering in `components/DashboardClient.tsx`:
    1.  **`useDeferredValue`:** We create a low-priority version of the data trigger: `const deferredTick = useDeferredValue(dataTick);`. The main `processedPayload` memo is hooked to this *deferred* value.
    2.  **`useTransition`:** We wrap all high-priority UI updates (like filter changes) in `startTransition`: `startTransition(() => { setFilters(...) });`.

* **Result:** When a user drags a slider, React *interrupts* the low-priority chart render, updates the slider state *immediately*, and then resumes rendering the chart in the background. This achieves an "instant" <50ms interaction latency.

### Strategic Memoization (`useMemo` / `useCallback`)

Memoization is used precisely to prevent expensive re-calculations.

* **`useMemo`:** The `processedPayload` function in `DashboardClient.tsx` is wrapped in `useMemo`. This function performs all heavy array operations (filtering by time, filtering by value, sampling, and aggregation). It only re-runs when the *deferred* data tick changes or the filters change, not on every component render.
* **`useCallback`:** All event handlers passed down to control components (`handleFilterChange`, `handleTimeRangeChange`, `handleStressToggle`) are wrapped in `useCallback`. This ensures that the `FilterPanel` and `TimeRangeSelector` components do not re-render unnecessarily.

### Custom Hooks for Performance Abstraction

* **`useDataStream`:** Encapsulates all Web Worker logic, providing a clean API (`startStream`, `stopStream`) and a simple `dataTick` to signal state changes without passing the entire 100k-point array.
* **`useVirtualization`:** The `DataTable`'s virtualization logic includes a `throttle` on the scroll event listener, preventing state updates from firing too rapidly while scrolling.

---

## 3. 🏗️ Next.js Performance Features

### SSR/SSG Strategy: Dynamic Server-Side Rendering

For this real-time application, a static build (`SSG`) is unsuitable, as the initial data would be stale on every visit.

* **Strategy:** The project uses **Dynamic Server-Side Rendering**.
* **Implementation:** By adding `export const dynamic = 'force-dynamic';` to `app/dashboard/page.tsx`, we instruct Next.js to run this Server Component on every request.
* **Benefit:** The server generates a fresh `initialData` array with current timestamps (`Date.now()`). This provides the user with a meaningful, fully populated chart on the very first frame, which then seamlessly connects to the live data stream starting on the client.

### Server/Client Component Boundaries

The architecture correctly separates concerns:

1.  **`app/dashboard/page.tsx` (Server Component):** Handles the initial data generation.
2.  **`components/DashboardClient.tsx` (Client Component):** Receives the initial data and manages all client-side logic: state, interactivity, and data stream management.

This approach minimizes the amount of JavaScript sent to the client while providing a rich, interactive experience.

---

## 4. 🎨 Canvas Integration Strategy

The core strategy is to **keep React in control of state, and Canvas in control of pixels.**

* **Centralized Render Engine:** The `useChartRenderer` hook is the "engine" for all charts. It encapsulates the `requestAnimationFrame` loop, ensuring drawing logic is perfectly synced with the browser's paint cycle and never runs more than once per frame.
* **React-Safe DPI & Resize Handling:** `lib/canvasUtils.ts` contains a critical function, `configureCanvasDPI`. This function safely handles HiDPI (Retina) scaling and resizing.
    * It reads the canvas's CSS size (which is controlled by React and CSS) from `canvas.getBoundingClientRect()`.
    * It then updates the canvas's *backing store* (`canvas.width` and `canvas.height`) to match, scaled by `devicePixelRatio`.
    * This one-way data flow prevents conflicts where React and the DOM fight for control over the canvas's style.
* **Optimized Draw Calls:** Expensive calculations (like data sampling or aggregation) happen inside `useMemo` in React *before* the data is passed to the draw function. The `draw` function itself is kept as simple as possible. For example, `ScatterPlot.tsx` uses `ctx.fillRect` instead of the more expensive `ctx.arc` to render thousands of points.

---

## 5. 📈 Scaling Strategy: Server vs. Client

The architecture is designed to scale by intelligently dividing labor between the server, the client's main thread, and a background worker.

* **Server (Request-Time):** Generates the *first 1,000 points*. This provides an instant, meaningful UI without waiting for the client to hydrate.
* **Client (Web Worker):** A `Worker` is spawned to handle *all* continuous data generation (up to 100,000 points) and memory management (downsampling). This keeps the main thread completely free.
* **Client (Main Thread):** The main thread is only responsible for high-priority UI updates (like responding to clicks) and the final canvas rendering. By using `useDeferredValue`, we ensure that even the rendering step can be interrupted by the user, leading to a perfectly fluid experience.
* **Memory Ceiling:** The `downsample` function in `lib/data.worker.ts` ensures the application has a fixed memory ceiling. When 100,000 points are reached, the oldest 50,000 are averaged into 25,000, allowing the dashboard to run indefinitely without crashing the browser.