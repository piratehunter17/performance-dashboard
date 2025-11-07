/// <reference lib="webworker" />

// --- 1. Types & Data Generation Logic ---

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

// --- 2. State Inside The Worker ---

let fullData: DataPoint[] = [];
let intervalMs = 100; // Default interval
let intervalId: any = null;
let isRunning = true;

// Downsampling Logic
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


// --- 3. The Worker's Main Loop ---

let throttleTimer: any = null;
const runTick = () => {
  // 1. Generate new point
  fullData.push(generateNewDataPoint());

  // 2. Downsample if needed
  if (fullData.length > MAX_DATA_POINTS) {
    fullData = downsample(fullData);
  }

  // 3. Throttle updates to the main thread (10fps)
  if (!throttleTimer) {
    throttleTimer = setTimeout(() => {
      // Post the FULL data array
      postMessage(fullData);
      throttleTimer = null;
    }, 100); // 10 updates per second
  }
};

// Used to start streaming data points
const startStream = () => {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(runTick, intervalMs);
  isRunning = true;
};

// Used to stop streaming data points
const stopStream = () => {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
};

// --- 4. Worker Event Listener ---

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