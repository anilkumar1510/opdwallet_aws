import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timer if value changes before delay expires
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Alternative hook for debouncing search inputs
 * Returns both the immediate value (for display) and debounced value (for API calls)
 */
export function useSearchDebounce(initialValue: string = '', delay: number = 300) {
  const [search, setSearch] = useState(initialValue);
  const debouncedSearch = useDebounce(search, delay);

  return {
    search,           // Immediate value for input display
    setSearch,        // Setter for input onChange
    debouncedSearch,  // Debounced value for API calls
  };
}