/**
 * useSafeAsyncEffect Hook
 * Safe wrapper for async operations in useEffect
 * Prevents race conditions and memory leaks
 */

import { useEffect, useRef } from 'react';

/**
 * Safe async effect hook
 * 
 * @param effect - Async function to run
 * @param deps - Dependency array
 * 
 * @example
 * useSafeAsyncEffect(async () => {
 *   const data = await fetchData();
 *   setData(data);
 * }, [userId]);
 */
export function useSafeAsyncEffect(
  effect: () => Promise<void | (() => void)>,
  deps?: React.DependencyList
) {
  const cleanupRef = useRef<(() => void) | void>();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    const runEffect = async () => {
      try {
        const cleanup = await effect();
        
        // Only set cleanup if component is still mounted
        if (!cancelled && isMountedRef.current) {
          cleanupRef.current = cleanup;
        }
      } catch (error) {
        // Only log if component is still mounted
        if (!cancelled && isMountedRef.current) {
          console.error('Error in useSafeAsyncEffect:', error);
        }
      }
    };

    runEffect();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      
      // Call cleanup if it exists
      if (cleanupRef.current && typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
    };
  }, deps);
}

/**
 * useSafeAsyncEffect with abort signal
 * For fetch requests that can be cancelled
 * 
 * @param effect - Async function that receives AbortSignal
 * @param deps - Dependency array
 * 
 * @example
 * useSafeAsyncEffectWithAbort(async (signal) => {
 *   const response = await fetch(url, { signal });
 *   const data = await response.json();
 *   setData(data);
 * }, [url]);
 */
export function useSafeAsyncEffectWithAbort(
  effect: (signal: AbortSignal) => Promise<void>,
  deps?: React.DependencyList
) {
  useEffect(() => {
    const abortController = new AbortController();
    let cancelled = false;

    const runEffect = async () => {
      try {
        await effect(abortController.signal);
      } catch (error: any) {
        // Ignore abort errors
        if (error?.name !== 'AbortError' && !cancelled) {
          console.error('Error in useSafeAsyncEffectWithAbort:', error);
        }
      }
    };

    runEffect();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, deps);
}


