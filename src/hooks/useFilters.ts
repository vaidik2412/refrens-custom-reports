'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { encodeFilters, decodeFilters } from '@/lib/url-encoding';
import type { SavedQuery, SystemReport, DateFieldConfig } from '@/types';
import { resolveDateField } from '@/lib/date-utils';

interface UseFiltersReturn {
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  applyReport: (report: SavedQuery | SystemReport) => void;
  activeReport: (SavedQuery & { isSystem?: false }) | (SystemReport & { isSystem: true }) | null;
  setActiveReport: (report: any) => void;
  isDirty: boolean;
  dateFields: DateFieldConfig[];
  setDateFields: (fields: DateFieldConfig[]) => void;
}

export function useFilters(): UseFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeReport, setActiveReport] = useState<any>(null);
  const [dateFields, setDateFields] = useState<DateFieldConfig[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Hydrate from URL on mount
  useEffect(() => {
    if (initialized) return;
    const fq = searchParams.get('fq');
    if (fq) {
      const decoded = decodeFilters(fq);
      setFilters(decoded);
    }
    setInitialized(true);
  }, [searchParams, initialized]);

  // Sync filters to URL reactively (avoids calling router.replace during render/setState)
  useEffect(() => {
    if (!initialized) return;
    const hasFilters = Object.keys(filters).length > 0;
    if (hasFilters) {
      const encoded = encodeFilters(filters);
      router.replace(`/reports?fq=${encoded}`, { scroll: false });
    } else {
      router.replace('/reports', { scroll: false });
    }
  }, [filters, initialized, router]);

  const setFilter = useCallback(
    (key: string, value: any) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const removeFilter = useCallback(
    (key: string) => {
      setFilters((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    setDateFields([]);
  }, []);

  const applyReport = useCallback(
    (report: SavedQuery | SystemReport) => {
      setActiveReport(report);

      if ('isSystem' in report && report.isSystem) {
        setFilters(report.query);
        setDateFields([]);
      } else {
        const sq = report as SavedQuery;
        const mergedFilters = { ...sq.query };

        if (sq.dateFields && sq.dateFields.length > 0) {
          for (const df of sq.dateFields) {
            const range = resolveDateField(df);
            mergedFilters[df.accessor] = range;
          }
          setDateFields(sq.dateFields);
        } else {
          setDateFields([]);
        }

        setFilters(mergedFilters);
      }
    },
    []
  );

  // Determine if current filters differ from the active report's stored query
  const isDirty = (() => {
    if (!activeReport) return Object.keys(filters).length > 0;
    const reportQuery = activeReport.query || {};
    return JSON.stringify(filters) !== JSON.stringify(reportQuery);
  })();

  return {
    filters,
    setFilter,
    removeFilter,
    clearFilters,
    applyReport,
    activeReport,
    setActiveReport,
    isDirty,
    dateFields,
    setDateFields,
  };
}
