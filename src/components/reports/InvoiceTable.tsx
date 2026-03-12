'use client';

import { CSSProperties } from 'react';
import { BILL_TYPE_OPTIONS } from '@/lib/constants';

interface InvoiceTableProps {
  data: any[];
  total: number;
  loading: boolean;
  page: number;
  setPage: (page: number) => void;
  limit: number;
}

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
  whiteSpace: 'nowrap',
};

const paginationStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 0',
};

const pageBtnStyle: CSSProperties = {
  padding: '6px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  background: '#FFFFFF',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  letterSpacing: '-0.25px',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  PAID: { bg: '#ECFDF5', text: '#059669' },
  UNPAID: { bg: '#FEF3C7', text: '#D97706' },
  OVERDUE: { bg: '#FEE2E2', text: '#DC2626' },
  PARTIALLY_PAID: { bg: '#EFF6FF', text: '#2563EB' },
  DRAFT: { bg: 'var(--color-bg-alt)', text: 'var(--color-text-secondary)' },
};

function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] || statusColors.DRAFT;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        background: colors.bg,
        color: colors.text,
        letterSpacing: '0.3px',
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount?.toFixed(2) || '0'}`;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function InvoiceTable({
  data,
  total,
  loading,
  page,
  setPage,
  limit,
}: InvoiceTableProps) {
  const totalPages = Math.ceil(total / limit);
  const from = page * limit + 1;
  const to = Math.min((page + 1) * limit, total);

  if (loading && data.length === 0) {
    return (
      <div
        style={{
          padding: '48px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: '14px',
        }}
      >
        Loading invoices...
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div
        style={{
          padding: '48px',
          textAlign: 'center',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-input)',
          background: '#FFFFFF',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>&#x1F4C4;</div>
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          No invoices found
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Try adjusting your filters to see results.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Invoice #</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Billed To</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Due Date</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Balance</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Currency</th>
            </tr>
          </thead>
          <tbody>
            {data.map((inv, idx) => (
              <tr
                key={inv._id || idx}
                style={{
                  background: idx % 2 === 0 ? '#FFFFFF' : 'var(--color-bg-alt)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#F5F3FF';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    idx % 2 === 0 ? '#FFFFFF' : 'var(--color-bg-alt)';
                }}
              >
                <td style={{ ...tdStyle, fontWeight: 500 }}>
                  {inv.invoiceNumber || inv.documentNumber || '—'}
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '12px' }}>
                    {BILL_TYPE_OPTIONS.find((o) => o.value === inv.billType)?.label || inv.billType || '—'}
                  </span>
                </td>
                <td style={{ ...tdStyle, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {inv.billedTo?.name || '—'}
                </td>
                <td style={tdStyle}>{formatDate(inv.invoiceDate)}</td>
                <td style={tdStyle}>{formatDate(inv.dueDate)}</td>
                <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                  {formatCurrency(inv.totals?.total || 0, inv.currency || 'INR')}
                </td>
                <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                  {formatCurrency(inv.balance?.due || 0, inv.currency || 'INR')}
                </td>
                <td style={tdStyle}>
                  <StatusBadge status={inv.status || 'DRAFT'} />
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {inv.currency || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={paginationStyle}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {total > 0 ? `Showing ${from}–${to} of ${total}` : 'No results'}
          {loading && ' (loading...)'}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{
              ...pageBtnStyle,
              opacity: page === 0 ? 0.4 : 1,
              cursor: page === 0 ? 'not-allowed' : 'pointer',
            }}
            onClick={() => page > 0 && setPage(page - 1)}
            disabled={page === 0}
          >
            &#x2190; Prev
          </button>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              padding: '0 8px',
            }}
          >
            Page {page + 1} of {totalPages || 1}
          </span>
          <button
            style={{
              ...pageBtnStyle,
              opacity: page >= totalPages - 1 ? 0.4 : 1,
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            }}
            onClick={() => page < totalPages - 1 && setPage(page + 1)}
            disabled={page >= totalPages - 1}
          >
            Next &#x2192;
          </button>
        </div>
      </div>
    </div>
  );
}
