'use client';

import { CSSProperties } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { BILL_TYPE_OPTIONS } from '@/lib/constants';
import type { SavedQuery, SystemReport } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────

export interface ReportRow {
  id: string;
  name: string;
  description: string;
  billType: string;
  createdBy: string;
  createdOn: string | null;
  updatedOn: string | null;
  source: SavedQuery | SystemReport;
}

// ── Helpers ────────────────────────────────────────────────────────────

function getBillTypeLabel(value: string): string {
  if (!value) return 'All Types';
  return BILL_TYPE_OPTIONS.find((o) => o.value === value)?.label || value;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Styles ─────────────────────────────────────────────────────────────

const editBtnStyle: CSSProperties = {
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-cta-primary)',
  background: 'none',
  border: '1px solid var(--color-cta-primary)',
  borderRadius: 'var(--radius-tag)',
  cursor: 'pointer',
  letterSpacing: '-0.25px',
  whiteSpace: 'nowrap',
};

// ── Columns ────────────────────────────────────────────────────────────

const col = createColumnHelper<ReportRow>();

export const reportColumns = [
  col.accessor('name', {
    id: 'name',
    header: 'Name',
    cell: (info) => info.getValue(),
    size: 200,
    meta: { cellStyle: { fontWeight: 500, whiteSpace: 'nowrap' } },
  }),
  col.accessor('description', {
    id: 'description',
    header: 'Description',
    cell: (info) => info.getValue() || '--',
    size: 240,
    meta: {
      cellStyle: {
        maxWidth: '240px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      emptyColor: true,
    },
  }),
  col.accessor('billType', {
    id: 'billType',
    header: 'Bill Type',
    cell: (info) => (
      <span style={{ fontSize: '12px' }}>{getBillTypeLabel(info.getValue())}</span>
    ),
    size: 120,
  }),
  col.accessor('createdBy', {
    id: 'createdBy',
    header: 'Created By',
    cell: (info) => info.getValue(),
    size: 100,
    meta: { cellStyle: { fontSize: '12px', color: 'var(--color-text-secondary)' } },
  }),
  col.accessor('createdOn', {
    id: 'createdOn',
    header: 'Created On',
    cell: (info) => formatDate(info.getValue()),
    size: 120,
    meta: { cellStyle: { fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' } },
  }),
  col.accessor('updatedOn', {
    id: 'updatedOn',
    header: 'Last Updated',
    cell: (info) => formatDate(info.getValue()),
    size: 120,
    meta: { cellStyle: { fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' } },
  }),
  col.display({
    id: 'actions',
    header: '',
    size: 80,
    cell: (info) => {
      const row = info.row.original;
      const isSystem = 'isSystem' in row.source && row.source.isSystem;
      if (isSystem) return null;
      return (
        <button
          type="button"
          style={editBtnStyle}
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/reports/edit/${row.id}`;
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--color-cta-primary)';
            (e.currentTarget as HTMLElement).style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'none';
            (e.currentTarget as HTMLElement).style.color = 'var(--color-cta-primary)';
          }}
        >
          Edit
        </button>
      );
    },
    enableSorting: false,
  }),
];
