'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedQuery, DateFieldConfig } from '@/types';
import { buildSavedQueryPayload, normalizeDateFields } from '@/lib/saved-query-contract';

function normalizeSavedQuery(response: SavedQuery): SavedQuery {
  return {
    ...response,
    dateFields: normalizeDateFields(response.dateFields),
  };
}

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
        setQueries(result.data.map(normalizeSavedQuery));
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
      const canonicalPayload = buildSavedQueryPayload(payload.query, payload.dateFields);
      const res = await fetch('/api/saved-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          ...canonicalPayload,
          queryType: 'FEATHERS_SERVICE',
          querySubType: 'FIND',
          serviceName: 'invoices',
        }),
      });
      if (!res.ok) throw new Error('Failed to create query');
      const created = await res.json();
      await fetchQueries();
      return normalizeSavedQuery(created as SavedQuery);
    },
    [fetchQueries]
  );

  const updateQuery = useCallback(
    async (id: string, payload: Partial<SavedQuery>) => {
      const nextPayload =
        payload.query !== undefined && payload.dateFields !== undefined
          ? {
              ...payload,
              ...buildSavedQueryPayload(
                payload.query || {},
                normalizeDateFields(payload.dateFields || [])
              ),
            }
          : payload.dateFields !== undefined
            ? {
                ...payload,
                dateFields: normalizeDateFields(payload.dateFields),
              }
            : payload.query !== undefined
              ? {
                  ...payload,
                  query: buildSavedQueryPayload(payload.query, []).query,
                }
          : payload;
      const res = await fetch(`/api/saved-queries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextPayload),
      });
      if (!res.ok) throw new Error('Failed to update query');
      const updated = await res.json();
      await fetchQueries();
      return normalizeSavedQuery(updated as SavedQuery);
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
