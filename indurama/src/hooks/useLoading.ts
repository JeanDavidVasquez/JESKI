import { useState, useCallback } from 'react';

/**
 * Hook para manejar estados de carga
 */
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await fn();
      return result;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  return {
    isLoading,
    setLoading,
    withLoading,
  };
};