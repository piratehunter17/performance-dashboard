/**
 * DataPoint
 *
 * Represents a single sample in the time-series used by the dashboard.
 *
 * Fields:
 * - timestamp: Epoch milliseconds for the sample (number). Using number
 *   keeps comparisons fast and allocations minimal.
 * - value: Numeric measurement for the sample (e.g., CPU %, metric value).
 */
export interface DataPoint {
  timestamp: number;
  value: number;
}