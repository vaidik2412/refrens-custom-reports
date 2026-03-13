'use client';

import { BILL_TYPE_OPTIONS } from '@/lib/constants';

export const statusColors: Record<string, { bg: string; text: string }> = {
  PAID: { bg: '#ECFDF5', text: '#059669' },
  UNPAID: { bg: '#FEF3C7', text: '#D97706' },
  OVERDUE: { bg: '#FEE2E2', text: '#DC2626' },
  PARTIALLY_PAID: { bg: '#EFF6FF', text: '#2563EB' },
  DRAFT: { bg: 'var(--color-bg-alt)', text: 'var(--color-text-secondary)' },
};

export function StatusBadge({ status }: { status: string }) {
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

export function formatCurrency(amount: number, currency: string): string {
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

export function formatDate(dateStr: string): string {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatBoolean(value: unknown): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '\u2014';
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '\u2014';
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '\u2014';
  return String(value);
}

export function getBillTypeLabel(billType: string): string {
  return BILL_TYPE_OPTIONS.find((o) => o.value === billType)?.label || billType || '\u2014';
}
