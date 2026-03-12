'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedQuery, DateFieldConfig } from '@/types';

export function useSavedQueries() {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueries = useCallback(async () => {
    try {
      const res = await fetch('/api/saved-queries/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: 'invoices',
          $limit: 50,
          isGlobal: false,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setQueries(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch saved queries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  const createQuery = useCallback(
    async (payload: {
      displayName: string;
      description: string;
      dateFields: DateFieldConfig[];
      query: Record<string, any>;
    }) => {
      const res = await fetch('/api/saved-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          queryType: 'FEATHERS_SERVICE',
          querySubType: 'FIND',
          serviceName: 'invoices',
        }),
      });
      if (!res.ok) throw new Error('Failed to create query');
      const created = await res.json();
      await fetchQueries();
      return created as SavedQuery;
    },
    [fetchQueries]
  );

  const updateQuery = useCallback(
    async (id: string, payload: Partial<SavedQuery>) => {
      const res = await fetch(`/api/saved-queries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update query');
      const updated = await res.json();
      await fetchQueries();
      return updated as SavedQuery;
    },
    [fetchQueries]
  );

  const deleteQuery = useCallback(
    async (id: string) => {
      await updateQuery(id, { isArchived: true } as any);
    },
    [updateQuery]
  );

  return { queries, loading, createQuery, updateQuery, deleteQuery, refetch: fetchQueries };
}
