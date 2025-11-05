import { DataPoint } from './types';

// A base value to start our data simulation from
let lastValue = 50;
const MAX_VALUE = 100;
const MIN_VALUE = 0;
const MAX_STEP = 2; // How much the value can change per step

/**
 * Generates a single new data point based on the last value.
 * This simulates a "random walk" for a real-time data stream.
 * @param {number} [baseTimestamp] - The timestamp to base the new point on. Defaults to Date.now().
 * @returns {DataPoint} A new data point.
 */
export const generateNewDataPoint = (baseTimestamp?: number): DataPoint => {
  const timestamp = baseTimestamp || Date.now();

  // Calculate the next value
  let newValue = lastValue + (Math.random() * 2 * MAX_STEP - MAX_STEP);

  // Clamp the value between MIN and MAX
  if (newValue > MAX_VALUE) {
    newValue = MAX_VALUE - (newValue - MAX_VALUE); // Bounce off the ceiling
  } else if (newValue < MIN_VALUE) {
    newValue = MIN_VALUE + (MIN_VALUE - newValue); // Bounce off the floor
  }

  // Ensure it doesn't get stuck at the boundaries
  if (newValue === lastValue && lastValue === MAX_VALUE || lastValue === MIN_VALUE) {
    newValue = 50; // Reset to middle if stuck
  }

  lastValue = newValue;

  return {
    timestamp,
    value: newValue,
  };
};

/**
 * Generates an initial dataset of a specified size.
 * @param {number} [count=1000] - The number of data points to generate.
 * @param {number} [intervalMs=100] - The time interval between points, in milliseconds.
 * @returns {DataPoint[]} An array of data points.
 */
export const generateInitialDataset = (count = 1000, intervalMs = 100): DataPoint[] => {
  const data: DataPoint[] = [];
  const startTime = Date.now() - count * intervalMs;

  for (let i = 0; i < count; i++) {
    const timestamp = startTime + i * intervalMs;
    data.push(generateNewDataPoint(timestamp));
  }

  return data;
};