'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import type { InvoiceListResponse } from '@/types';

export function useInvoices(filters: Record<string, any>) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 10;

  const debouncedFilters = useDebounce(filters, 300);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('$limit', String(limit));
      params.set('$skip', String(page * limit));
      params.set('$sort[invoiceDate]', '-1');

      // Serialize filters to bracket notation
      for (const [key, value] of Object.entries(debouncedFilters)) {
        if (value === null || value === undefined || value === '') continue;

        if (typeof value === 'object' && !Array.isArray(value)) {
          for (const [op, opVal] of Object.entries(value)) {
            if (op === '$inOptions') continue; // UI-only
            if ((op === '$in' || op === '$nin' || op === '$all') && Array.isArray(opVal)) {
              (opVal as string[]).forEach((v, i) => {
                params.append(`${key}[${op}][${i}]`, String(v));
              });
            } else {
              params.set(`${key}[${op}]`, String(opVal));
            }
          }
        } else if (typeof value === 'boolean') {
          params.set(key, String(value));
        } else {
          params.set(key, String(value));
        }
      }

      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (res.ok) {
        const result: InvoiceListResponse = await res.json();
        setData(result.data);
        setTotal(result.total);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedFilters]);

  return { data, total, loading, page, setPage, limit, refetch: fetchInvoices };
}
