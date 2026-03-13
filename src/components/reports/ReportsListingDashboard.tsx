'use client';

import { CSSProperties, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSavedQueries } from '@/hooks/useSavedQueries';
import { SYSTEM_REPORTS, BILL_TYPE_OPTIONS } from '@/lib/constants';
import Button from '@/components/ui/Button';
import { encodeFilters } from '@/lib/url-encoding';
import { materializeSavedQueryFilters } from '@/lib/saved-query-contract';
import type { SavedQuery, SystemReport } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────

interface ReportRow {
  id: string;
  name: string;
  description: string;
  billType: string;
  createdBy: string;
  createdOn: string | null;
  updatedOn: string | null;
  source: SavedQuery | SystemReport;
}

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

function getBillTypeLabel(value: string): string {
  if (!value) return 'All Types';
  const opt = BILL_TYPE_OPTIONS.find((o) => o.value === value);
  return opt?.label || value;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── Styles ───────────────────────────────────────────────────────────────

const pageHeaderStyle: CSSProperties = {
  fontSize: '22px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  letterSpacing: '-0.5px',
  margin: '0 0 20px 0',
};

const tableContainerStyle: CSSProperties = {
  overflowX: 'auto',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  background: '#FFFFFF',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
  letterSpacing: '-0.25px',
};

const thStyle: CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '11px',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '2px solid var(--color-border)',
  whiteSpace: 'nowrap',
  background: 'var(--color-bg-alt)',
  position: 'sticky',
  top: 0,
};

const tdStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
};

// ── Component ────────────────────────────────────────────────────────────

export default function ReportsListingDashboard() {
  const router = useRouter();
  const { queries: savedQueries, loading } = useSavedQueries();

  const rows = useMemo(
    () => buildReportRows(SYSTEM_REPORTS, savedQueries),
    [savedQueries]
  );

  const handleRowClick = (row: ReportRow) => {
    const report = row.source;
    let filters: Record<string, any>;
    const params = new URLSearchParams();

    if ('isSystem' in report && report.isSystem) {
      filters = { ...report.query };
      params.set('reportId', report.id);
      params.set('reportKind', 'system');
    } else {
      const sq = report as SavedQuery;
      filters = materializeSavedQueryFilters(sq.query, sq.dateFields);
      params.set('reportId', sq._id);
      params.set('reportKind', 'saved');
    }

    params.set('fq', encodeFilters(filters));
    router.push(`/reports/invoices?${params.toString()}`);
  };

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
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: '14px',
          }}
        >
          Loading reports...
        </div>
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <div>
        {pageHeader}
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            background: '#FFFFFF',
          }}
        >
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

  return (
    <div>
      {pageHeader}

      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Bill Type</th>
              <th style={thStyle}>Created By</th>
              <th style={thStyle}>Created On</th>
              <th style={thStyle}>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                style={{
                  background: idx % 2 === 0 ? '#FFFFFF' : 'var(--color-bg-alt)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#F5F3FF';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    idx % 2 === 0 ? '#FFFFFF' : 'var(--color-bg-alt)';
                }}
                onClick={() => handleRowClick(row)}
              >
                <td style={{ ...tdStyle, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {row.name}
                </td>
                <td
                  style={{
                    ...tdStyle,
                    maxWidth: '240px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: row.description
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-secondary)',
                  }}
                >
                  {row.description || '--'}
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '12px' }}>
                    {getBillTypeLabel(row.billType)}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {row.createdBy}
                </td>
                <td style={{ ...tdStyle, fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                  {formatDate(row.createdOn)}
                </td>
                <td style={{ ...tdStyle, fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                  {formatDate(row.updatedOn)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
