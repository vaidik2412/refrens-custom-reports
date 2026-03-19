'use client';

import { CSSProperties, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useSavedQueries } from '@/hooks/useSavedQueries';
import { SYSTEM_REPORTS } from '@/lib/constants';
import Button from '@/components/ui/Button';
import ColumnVisibilityDropdown from './ColumnVisibilityDropdown';
import { encodeFilters } from '@/lib/url-encoding';
import { materializeSavedQueryFilters } from '@/lib/saved-query-contract';
import { reportColumns, type ReportRow } from './reportListingColumns';
import type { SavedQuery, SystemReport } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────

function buildReportRows(
  systemReports: SystemReport[],
  savedQueries: SavedQuery[]
): ReportRow[] {
  const rows: ReportRow[] = [];

  for (const sr of systemReports) {
    rows.push({
      id: sr.id,
      name: sr.displayName,
      description: '',
      billType: sr.query.billType || '',
      createdBy: 'System',
      createdOn: null,
      updatedOn: null,
      source: sr,
    });
  }

  for (const sq of savedQueries) {
    rows.push({
      id: sq._id,
      name: sq.displayName,
      description: sq.description || '',
      billType: sq.query?.billType || '',
      createdBy: sq.isDefault ? 'System' : 'You',
      createdOn: sq.createdAt,
      updatedOn: sq.updatedAt,
      source: sq,
    });
  }

  return rows;
}

// ── Styles ───────────────────────────────────────────────────────────────

const PAGE_LIMIT = 10;

const pageHeaderStyle: CSSProperties = {
  fontSize: '22px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  lineHeight: '32px',
  letterSpacing: '-0.25px',
  margin: '0 0 20px 0',
};

const tableContainerStyle: CSSProperties = {
  overflowX: 'auto',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
  letterSpacing: '-0.25px',
};

const thStyle: CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  fontWeight: 500,
  fontSize: '14px',
  color: 'var(--color-text-column)',
  letterSpacing: '-0.25px',
  borderBottom: '2px solid var(--color-border)',
  whiteSpace: 'nowrap',
  background: 'var(--color-bg-alt)',
  position: 'sticky',
  top: 0,
  cursor: 'pointer',
  userSelect: 'none',
};

const tdStyle: CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
};

const paginationStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'var(--sp-3) 0',
};

const pageBtnStyle: CSSProperties = {
  padding: '6px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tag)',
  background: 'var(--color-bg-card)',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  letterSpacing: '-0.25px',
};

// ── Component ────────────────────────────────────────────────────────────

export default function ReportsListingDashboard() {
  const router = useRouter();
  const { queries: savedQueries, loading, error } = useSavedQueries();

  const rows = useMemo(
    () => buildReportRows(SYSTEM_REPORTS, savedQueries),
    [savedQueries]
  );

  // ── Table state ──────────────────────────────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [page, setPage] = useState(0);

  const table = useReactTable({
    data: rows,
    columns: reportColumns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ── Pagination ───────────────────────────────────────────────────────
  const allRows = table.getRowModel().rows;
  const totalRows = allRows.length;
  const totalPages = Math.ceil(totalRows / PAGE_LIMIT);
  const paginatedRows = allRows.slice(page * PAGE_LIMIT, (page + 1) * PAGE_LIMIT);
  const from = totalRows > 0 ? page * PAGE_LIMIT + 1 : 0;
  const to = Math.min((page + 1) * PAGE_LIMIT, totalRows);

  // Reset page when data changes
  const dataLen = rows.length;
  useMemo(() => setPage(0), [dataLen]);

  // ── Row click ────────────────────────────────────────────────────────
  const handleRowClick = (row: ReportRow) => {
    const report = row.source;
    const params = new URLSearchParams();

    if ('isSystem' in report && report.isSystem) {
      params.set('reportId', report.id);
      params.set('reportKind', 'system');
      params.set('fq', encodeFilters({ ...report.query }));
    } else {
      const sq = report as SavedQuery;
      const filters = materializeSavedQueryFilters(sq.query, sq.dateFields);
      params.set('reportId', sq._id);
      params.set('reportKind', 'saved');
      params.set('fq', encodeFilters(filters));
    }

    router.push(`/reports/invoices?${params.toString()}`);
  };

  // ── Render ───────────────────────────────────────────────────────────

  const pageHeader = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
      <h1 style={{ ...pageHeaderStyle, margin: 0 }}>Reports</h1>
      <Button onClick={() => router.push('/reports/new')}>+ Create New Report</Button>
    </div>
  );

  if (loading && savedQueries.length === 0) {
    return (
      <div>
        {pageHeader}
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Loading reports...
        </div>
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <div>
        {pageHeader}
        <div style={{ padding: '48px', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-input)', background: 'var(--color-bg-card)' }}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            No reports found
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Create a report from the Invoices dashboard to see it here.
          </div>
        </div>
      </div>
    );
  }

  const headerGroups = table.getHeaderGroups();

  return (
    <div>
      {pageHeader}

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 14px', border: '1px solid var(--color-error-banner-border)', borderRadius: 'var(--radius-input)', background: 'var(--color-error-banner-bg)', color: 'var(--color-error-banner-text)', fontSize: '13px', lineHeight: 1.5 }}>
          Couldn&apos;t load saved reports from MongoDB. Showing built-in system reports only.
          <span style={{ marginLeft: '6px', opacity: 0.8 }}>{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--sp-2)' }}>
        <ColumnVisibilityDropdown table={table} />
      </div>

      {/* Table */}
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      style={{
                        ...thStyle,
                        width: header.getSize(),
                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span style={{ fontSize: '10px', opacity: isSorted ? 1 : 0.3, color: isSorted ? 'var(--color-cta-primary)' : 'var(--color-text-secondary)' }}>
                            {isSorted === 'asc' ? '\u2191' : isSorted === 'desc' ? '\u2193' : '\u2195'}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) => {
              const reportRow = row.original;
              const globalIdx = page * PAGE_LIMIT + idx;
              const meta = (col: any) => (col.columnDef.meta || {}) as Record<string, any>;
              return (
                <tr
                  key={row.id}
                  style={{
                    background: globalIdx % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-alt)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-row-hover)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      globalIdx % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-alt)';
                  }}
                  onClick={() => handleRowClick(reportRow)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const m = meta(cell.column);
                    const isDescription = cell.column.id === 'description';
                    return (
                      <td
                        key={cell.id}
                        style={{
                          ...tdStyle,
                          width: cell.column.getSize(),
                          ...(m.cellStyle || {}),
                          ...(isDescription && !reportRow.description
                            ? { color: 'var(--color-text-secondary)' }
                            : {}),
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalRows > 0 && (
        <div style={paginationStyle}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Showing {from}&ndash;{to} of {totalRows}
          </span>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <button
              type="button"
              style={{ ...pageBtnStyle, opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
              onClick={() => page > 0 && setPage(page - 1)}
              disabled={page === 0}
            >
              &#x2190; Prev
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', padding: '0 var(--sp-2)' }}>
              Page {page + 1} of {totalPages || 1}
            </span>
            <button
              type="button"
              style={{ ...pageBtnStyle, opacity: page >= totalPages - 1 ? 0.4 : 1, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
              onClick={() => page < totalPages - 1 && setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next &#x2192;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
