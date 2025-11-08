import { DataPoint } from './types';

// Initial seed value for the simulated data stream
let lastValue = 50;
const MAX_VALUE = 100;
const MIN_VALUE = 0;
const MAX_STEP = 2; // Maximum change per step

/**
 * Generates a single new data point based on the last value.
 * This simulates a "random walk" for a real-time data stream.
 * @param {number} [baseTimestamp] - The timestamp to base the new point on. Defaults to Date.now().
 * @returns {DataPoint} A new data point.
 */
export const generateNewDataPoint = (baseTimestamp?: number): DataPoint => {
  const timestamp = baseTimestamp || Date.now();

  // Compute the next value using a bounded random walk
  let newValue = lastValue + (Math.random() * 2 * MAX_STEP - MAX_STEP);

  // Reflect the value if it exceeds bounds to keep it within [MIN_VALUE, MAX_VALUE]
  if (newValue > MAX_VALUE) {
    newValue = MAX_VALUE - (newValue - MAX_VALUE); // Reflect from upper bound
  } else if (newValue < MIN_VALUE) {
    newValue = MIN_VALUE + (MIN_VALUE - newValue); // Reflect from lower bound
  }

  // Prevent boundary lock: if value remains unchanged at an extreme, reinitialize to midpoint
  if (newValue === lastValue && (lastValue === MAX_VALUE || lastValue === MIN_VALUE)) {
    newValue = 50; // Reinitialize to midpoint
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