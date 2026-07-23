import { useState, useEffect } from 'react';

/**
 * Returns a debounced value that updates after the specified delay.
 * Useful for delaying expensive operations such as filtering large lists.
 */
export default function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}
