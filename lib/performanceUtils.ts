/**
 * Create a debounced function that delays invocation until 'wait' ms
 * have elapsed since the last call. Useful for coalescing rapid events.
 *
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns A debounced wrapper function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};

/**
 * Create a throttled function that limits invocations to at most one
 * call per 'wait' milliseconds. Useful for rate-limiting expensive handlers.
 *
 * @param func - Function to throttle
 * @param wait - Throttle interval in milliseconds
 * @returns A throttled wrapper function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let timerId: NodeJS.Timeout | null = null;

  const runThrottled = () => {
    if (lastArgs) {
      func(...lastArgs);
      lastArgs = null;
      inThrottle = true;
      timerId = setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          runThrottled();
        }
      }, wait);
    }
  };

  return (...args: Parameters<T>) => {
    lastArgs = args;
    if (!inThrottle) {
      runThrottled();
    }
  };
};

/**
 * Measure synchronous execution time of a function and log the result.
 * Intended for quick local profiling during development.
 *
 * @param func - The synchronous function to measure
 * @param label - Optional label used in the console output
 */
export const measureExecutionTime = (func: () => void, label: string = 'Execution') => {
  const start = performance.now();
  func();
  const end = performance.now();
  console.log(`${label} took ${end - start} ms`);
};