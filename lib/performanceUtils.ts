/**
 * Creates a debounced function that delays invoking the function
 * until after 'wait' milliseconds have elapsed since the last time
 * the debounced function was invoked.
 *
 * @param {T} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns A new debounced function.
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
 * Creates a throttled function that only invokes the function
 * at most once per every 'wait' milliseconds.
 *
 * @param {T} func - The function to throttle.
 * @param {number} wait - The number of milliseconds to throttle invocations to.
 * @returns A new throttled function.
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
 * A simple utility to measure the execution time of a function.
 * @param {() => void} func - The function to measure.
 * @param {string} [label] - An optional label for the console log.
 */
export const measureExecutionTime = (func: () => void, label: string = 'Execution') => {
  const start = performance.now();
  func();
  const end = performance.now();
  console.log(`${label} took ${end - start} ms`);
};