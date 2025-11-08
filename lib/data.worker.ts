/// <reference lib="webworker" />

// Types and data generation utilities

interface DataPoint {
  timestamp: number;
  value: number;
}

let lastValue = 50;
const MAX_VALUE = 100;
const MIN_VALUE = 0;
const MAX_STEP = 2;

const generateNewDataPoint = (baseTimestamp?: number): DataPoint => {
  const timestamp = baseTimestamp || Date.now();
  let newValue = lastValue + (Math.random() * 2 * MAX_STEP - MAX_STEP);
  if (newValue > MAX_VALUE) newValue = MAX_VALUE - (newValue - MAX_VALUE);
  else if (newValue < MIN_VALUE) newValue = MIN_VALUE + (MIN_VALUE - newValue);
  if (newValue === lastValue && (lastValue === MAX_VALUE || lastValue === MIN_VALUE)) {
    newValue = 50;
  }
  lastValue = newValue;
  return { timestamp, value: newValue };
};

// Worker internal state

let fullData: DataPoint[] = [];
let intervalMs = 100; // Default interval (ms)
let intervalId: any = null;
let isRunning = true;

// Downsampling utilities
const MAX_DATA_POINTS = 100000;
const downsample = (data: DataPoint[]): DataPoint[] => {
  const cutoff = Math.floor(data.length * 0.5);
  const recentData = data.slice(cutoff);
  const oldData = data.slice(0, cutoff);
  const downsampledOldData: DataPoint[] = [];
  for (let i = 0; i < data.length; i += 2) {
    if (i + 1 < oldData.length) {
      const p1 = oldData[i];
      const p2 = oldData[i + 1];
      downsampledOldData.push({
        timestamp: p2.timestamp,
        value: (p1.value + p2.value) / 2,
      });
    } else {
      downsampledOldData.push(oldData[i]);
    }
  }
  return [...downsampledOldData, ...recentData];
};


// Main loop: generate, downsample, and throttle updates to main thread

let throttleTimer: any = null;
const runTick = () => {
  // Generate and append a new data point
  fullData.push(generateNewDataPoint());

  // Downsample if the buffer exceeds the maximum allowed points
  if (fullData.length > MAX_DATA_POINTS) {
    fullData = downsample(fullData);
  }
  // Throttle updates to the main thread (approx. 10 fps)
  if (!throttleTimer) {
    throttleTimer = setTimeout(() => {
      // Send the current data buffer to the main thread
      postMessage(fullData);
      throttleTimer = null;
    }, 100); // ~10 updates per second
  }
};

// Start streaming data points using the configured interval
const startStream = () => {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(runTick, intervalMs);
  isRunning = true;
};
// Stop streaming data points and clear the interval
const stopStream = () => {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
};

// Worker message event listener

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;
  
  switch(type) {
    case 'INIT':
      fullData = payload.initialData;
      intervalMs = payload.intervalMs;
      startStream(); 
      break;
    case 'START':
      startStream(); 
      break;
    case 'STOP':
      stopStream();
      break;
    case 'SET_INTERVAL':
      intervalMs = payload;
      if (isRunning) startStream();
      break;
  }
};