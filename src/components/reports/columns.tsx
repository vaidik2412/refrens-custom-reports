'use client';

import { createColumnHelper } from '@tanstack/react-table';
import type { InvoiceRow } from '@/types';
import {
  formatCurrency,
  formatDate,
  formatBoolean,
  formatValue,
  getBillTypeLabel,
  StatusBadge,
} from './formatters';

const col = createColumnHelper<InvoiceRow>();

export const coreColumns = [
  col.accessor((row) => row.invoiceNumber || row.documentNumber || '', {
    id: 'invoiceNumber',
    header: 'Invoice #',
    cell: (info) => info.getValue() || '\u2014',
    size: 130,
    meta: { sortField: 'invoiceNumber' },
  }),
  col.accessor('billType', {
    id: 'billType',
    header: 'Type',
    cell: (info) => (
      <span style={{ fontSize: '12px' }}>
        {getBillTypeLabel(info.getValue() || '')}
      </span>
    ),
    size: 140,
    meta: { sortField: 'billType' },
  }),
  col.accessor((row) => row.billedTo?.name || '', {
    id: 'billedTo',
    header: 'Billed To',
    cell: (info) => info.getValue() || '\u2014',
    size: 180,
    meta: { sortField: 'billedTo.name', cellStyle: { maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' } },
  }),
  col.accessor('invoiceDate', {
    id: 'invoiceDate',
    header: 'Date',
    cell: (info) => formatDate(info.getValue() || ''),
    size: 110,
    meta: { sortField: 'invoiceDate' },
  }),
  col.accessor('dueDate', {
    id: 'dueDate',
    header: 'Due Date',
    cell: (info) => formatDate(info.getValue() || ''),
    size: 110,
    meta: { sortField: 'dueDate' },
  }),
  col.accessor((row) => row.totals?.total || 0, {
    id: 'amount',
    header: 'Amount',
    cell: (info) => formatCurrency(info.getValue(), info.row.original.currency || 'INR'),
    size: 120,
    meta: { sortField: 'totals.total', align: 'right' },
  }),
  col.accessor((row) => row.balance?.due || 0, {
    id: 'balance',
    header: 'Balance',
    cell: (info) => formatCurrency(info.getValue(), info.row.original.currency || 'INR'),
    size: 120,
    meta: { sortField: 'balance.due', align: 'right' },
  }),
  col.accessor('status', {
    id: 'status',
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue() || 'DRAFT'} />,
    size: 120,
    meta: { sortField: 'status' },
  }),
  col.accessor('currency', {
    id: 'currency',
    header: 'Currency',
    cell: (info) => (
      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        {info.getValue() || '\u2014'}
      </span>
    ),
    size: 80,
    meta: { sortField: 'currency' },
  }),
];

export const extendedColumns = [
  col.accessor((row) => row.billedBy?.name || '', {
    id: 'billedBy',
    header: 'Billed By',
    cell: (info) => info.getValue() || '\u2014',
    size: 180,
    meta: { sortField: 'billedBy.name', cellStyle: { maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' } },
  }),
  col.accessor((row) => row.totals?.subTotal || 0, {
    id: 'subTotal',
    header: 'Subtotal',
    cell: (info) => formatCurrency(info.getValue(), info.row.original.currency || 'INR'),
    size: 120,
    meta: { sortField: 'totals.subTotal', align: 'right' },
  }),
  col.accessor('taxType', {
    id: 'taxType',
    header: 'Tax Type',
    cell: (info) => formatValue(info.getValue()),
    size: 100,
    meta: { sortField: 'taxType' },
  }),
  col.accessor('einvoiceGeneratedStatus', {
    id: 'einvoiceGeneratedStatus',
    header: 'E-Invoice',
    cell: (info) => formatValue(info.getValue()),
    size: 120,
    meta: { sortField: 'einvoiceGeneratedStatus' },
  }),
  col.accessor('source', {
    id: 'source',
    header: 'Source',
    cell: (info) => formatValue(info.getValue()),
    size: 100,
    meta: { sortField: 'source' },
  }),
  col.accessor('isExpenditure', {
    id: 'isExpenditure',
    header: 'Expenditure',
    cell: (info) => formatBoolean(info.getValue()),
    size: 100,
    meta: { sortField: 'isExpenditure' },
  }),
  col.accessor('igst', {
    id: 'igst',
    header: 'IGST',
    cell: (info) => formatBoolean(info.getValue()),
    size: 70,
    meta: { sortField: 'igst' },
  }),
  col.accessor('reverseCharge', {
    id: 'reverseCharge',
    header: 'Reverse Charge',
    cell: (info) => formatBoolean(info.getValue()),
    size: 130,
    meta: { sortField: 'reverseCharge' },
  }),
  col.accessor('placeOfSupply', {
    id: 'placeOfSupply',
    header: 'Place of Supply',
    cell: (info) => formatValue(info.getValue()),
    size: 140,
    meta: { sortField: 'placeOfSupply' },
  }),
  col.accessor((row) => row.recurringInvoice?.frequency || '', {
    id: 'recurringFrequency',
    header: 'Recurring',
    cell: (info) => formatValue(info.getValue()),
    size: 100,
    meta: { sortField: 'recurringInvoice.frequency' },
  }),
  col.accessor('tags', {
    id: 'tags',
    header: 'Tags',
    cell: (info) => formatValue(info.getValue()),
    size: 200,
    enableSorting: false,
    meta: { cellStyle: { maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis' } },
  }),
];

export const allColumns = [...coreColumns, ...extendedColumns];

/** Default visibility where only core columns are shown */
export const compactVisibility: Record<string, boolean> = Object.fromEntries(
  extendedColumns.map((c) => [c.id!, false])
);
