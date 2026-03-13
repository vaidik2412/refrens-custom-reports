'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

export type AsyncSuggestion = { label: string; value: string };

export function useAsyncSuggestions<T extends AsyncSuggestion = AsyncSuggestion>(
  endpoint: string | undefined,
  open: boolean,
  query: string
) {
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !endpoint) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadResults() {
      setLoading(true);
      try {
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) {
          if (!cancelled) setResults([]);
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadResults();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, endpoint, open]);

  return { results, loading };
}
