/**
 * Represents a single data point in our time-series.
 */
export interface DataPoint {
  /**
   * The timestamp (e.g., Date.now()) when the data was recorded.
   * We use 'number' for high-performance comparison.
   */
  timestamp: number;

  /**
   * The value of the data at this timestamp.
   * Can be any metric, like CPU usage, stock price, etc.
   */
  value: number;
}