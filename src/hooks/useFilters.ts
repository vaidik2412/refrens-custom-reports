'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { encodeFilters, decodeFilters } from '@/lib/url-encoding';
import type { SavedQuery, SystemReport, DateFieldConfig } from '@/types';
import {
  buildSavedQueryPayload,
  isDateAccessor,
  materializeSavedQueryFilters,
  normalizeDateFields,
  removeDateField,
  stableSerialize,
  upsertFixedDateField,
} from '@/lib/saved-query-contract';

interface UseFiltersReturn {
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  applyReport: (report: SavedQuery | SystemReport) => void;
  hydrateReportContext: (report: SavedQuery | SystemReport) => void;
  activeReport: (SavedQuery & { isSystem?: false }) | (SystemReport & { isSystem: true }) | null;
  setActiveReport: (report: any) => void;
  isDirty: boolean;
  dateFields: DateFieldConfig[];
  setDateFields: (fields: DateFieldConfig[]) => void;
}

type ReportRef = {
  id: string;
  kind: 'saved' | 'system';
};

function getReportRef(report: SavedQuery | SystemReport): ReportRef {
  if ('isSystem' in report && report.isSystem) {
    return { id: report.id, kind: 'system' };
  }

  return { id: (report as SavedQuery)._id, kind: 'saved' };
}

export function useFilters(): UseFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeReport, setActiveReport] = useState<any>(null);
  const [dateFields, setDateFieldsState] = useState<DateFieldConfig[]>([]);
  const [reportRef, setReportRef] = useState<ReportRef | null>(null);
  const [initialized, setInitialized] = useState(false);

  const setActiveReportState = useCallback((report: SavedQuery | SystemReport | null) => {
    setActiveReport(report);
    setReportRef(report ? getReportRef(report) : null);
  }, []);

  // Hydrate from URL on mount
  useEffect(() => {
    if (initialized) return;
    const fq = searchParams.get('fq');
    const reportId = searchParams.get('reportId');
    const reportKind = searchParams.get('reportKind');

    if (fq) {
      const decoded = decodeFilters(fq);
      setFilters(decoded);
    }
    if (reportId && (reportKind === 'saved' || reportKind === 'system')) {
      setReportRef({ id: reportId, kind: reportKind });
    }
    setInitialized(true);
  }, [searchParams, initialized]);

  // Sync filters to URL reactively (avoids calling router.replace during render/setState)
  useEffect(() => {
    if (!initialized) return;
    const nextParams = new URLSearchParams();

    if (Object.keys(filters).length > 0) {
      nextParams.set('fq', encodeFilters(filters));
    }

    if (reportRef) {
      nextParams.set('reportId', reportRef.id);
      nextParams.set('reportKind', reportRef.kind);
    }

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `/reports/invoices?${nextQuery}` : '/reports/invoices';
    router.replace(nextUrl, { scroll: false });
  }, [filters, initialized, reportRef, router]);

  const setFilter = useCallback(
    (key: string, value: any) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      if (isDateAccessor(key) && value && typeof value === 'object') {
        setDateFieldsState((prev) => upsertFixedDateField(prev, key, value));
      }
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
      if (isDateAccessor(key)) {
        setDateFieldsState((prev) => removeDateField(prev, key));
      }
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    setDateFieldsState([]);
    setReportRef(null);
  }, []);

  const applyReport = useCallback(
    (report: SavedQuery | SystemReport) => {
      setActiveReportState(report);

      if ('isSystem' in report && report.isSystem) {
        setFilters(report.query);
        setDateFieldsState([]);
      } else {
        const sq = report as SavedQuery;
        setDateFieldsState(normalizeDateFields(sq.dateFields));
        setFilters(materializeSavedQueryFilters(sq.query, sq.dateFields));
      }
    },
    [setActiveReportState]
  );

  const hydrateReportContext = useCallback(
    (report: SavedQuery | SystemReport) => {
      setActiveReportState(report);

      if ('isSystem' in report && report.isSystem) {
        setDateFieldsState([]);
      } else {
        setDateFieldsState(normalizeDateFields((report as SavedQuery).dateFields));
      }
    },
    [setActiveReportState]
  );

  // Determine if current filters differ from the active report's stored query
  const isDirty = (() => {
    if (!activeReport) return Object.keys(filters).length > 0;
    if ('isSystem' in activeReport && activeReport.isSystem) {
      return stableSerialize(filters) !== stableSerialize(activeReport.query || {});
    }

    const report = activeReport as SavedQuery;
    return (
      stableSerialize(buildSavedQueryPayload(filters, dateFields)) !==
      stableSerialize({
        query: report.query || {},
        dateFields: normalizeDateFields(report.dateFields),
      })
    );
  })();

  const setDateFields = useCallback((fields: DateFieldConfig[]) => {
    setDateFieldsState(normalizeDateFields(fields));
  }, []);

  return {
    filters,
    setFilter,
    removeFilter,
    clearFilters,
    applyReport,
    hydrateReportContext,
    activeReport,
    setActiveReport: setActiveReportState,
    isDirty,
    dateFields,
    setDateFields,
  };
}
