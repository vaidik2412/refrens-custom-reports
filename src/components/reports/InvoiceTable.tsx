'use client';

import { CSSProperties, useState, useEffect, useRef, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type SortingState,
  type VisibilityState,
  type ColumnOrderState,
} from '@tanstack/react-table';
import type { InvoiceRow, SortParam } from '@/types';
import { allColumns } from './columns';
import ColumnVisibilityDropdown from './ColumnVisibilityDropdown';

// ── Props ──────────────────────────────────────────────────────────

interface InvoiceTableProps {
  data: InvoiceRow[];
  total: number;
  loading: boolean;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  onSortChange?: (sort: SortParam | undefined) => void;
  defaultColumnVisibility?: Record<string, boolean>;
}

// ── Styles ─────────────────────────────────────────────────────────

const tableContainerStyle: CSSProperties = {
  overflowX: 'auto',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
};

const tableStyle: CSSProperties = {
  borderCollapse: 'collapse',
  fontSize: '13px',
  letterSpacing: '-0.25px',
  tableLayout: 'fixed',
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
  overflow: 'hidden',
};

const tdStyle: CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
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
  borderRadius: 'var(--radius-tag)',
  background: 'var(--color-bg-card)',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  letterSpacing: '-0.25px',
};

const resizeHandleStyle: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 0,
  height: '100%',
  width: '4px',
  cursor: 'col-resize',
  userSelect: 'none',
  touchAction: 'none',
};

// ── Component ──────────────────────────────────────────────────────

export default function InvoiceTable({
  data,
  total,
  loading,
  page,
  setPage,
  limit,
  onSortChange,
  defaultColumnVisibility,
}: InvoiceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'invoiceDate', desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    defaultColumnVisibility ?? {}
  );
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    allColumns.map((c) => c.id!)
  );

  const draggedCol = useRef<string | null>(null);

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, columnVisibility, columnOrder },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  // Propagate sort to parent
  useEffect(() => {
    if (!onSortChange) return;
    if (sorting.length > 0) {
      const col = allColumns.find((c) => c.id === sorting[0].id);
      const field = (col?.meta as any)?.sortField || sorting[0].id;
      onSortChange({ field, direction: sorting[0].desc ? 'desc' : 'asc' });
    } else {
      onSortChange(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  // ── Drag handlers for column reorder ───────────────────────────
  const onDragStart = useCallback((colId: string) => {
    draggedCol.current = colId;
  }, []);

  const onDrop = useCallback(
    (targetId: string) => {
      const fromId = draggedCol.current;
      if (!fromId || fromId === targetId) return;
      setColumnOrder((prev) => {
        const newOrder = [...prev];
        const fromIdx = newOrder.indexOf(fromId);
        const toIdx = newOrder.indexOf(targetId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, fromId);
        return newOrder;
      });
      draggedCol.current = null;
    },
    []
  );

  // ── Render helpers ─────────────────────────────────────────────

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
          background: 'var(--color-bg-card)',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>
          &#x1F4C4;
        </div>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            marginBottom: '4px',
          }}
        >
          No invoices found
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Try adjusting your filters to see results.
        </div>
      </div>
    );
  }

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '8px',
        }}
      >
        <ColumnVisibilityDropdown table={table} />
      </div>

      {/* Table */}
      <div style={tableContainerStyle}>
        <table
          style={{
            ...tableStyle,
            width: table.getCenterTotalSize(),
            minWidth: '100%',
          }}
        >
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as any;
                  const align = meta?.align || 'left';
                  const isSorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      style={{
                        ...thStyle,
                        width: header.getSize(),
                        textAlign: align,
                        position: 'relative',
                        cursor: header.column.getCanSort()
                          ? 'pointer'
                          : 'default',
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                      draggable
                      onDragStart={() => onDragStart(header.column.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDrop(header.column.id)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span
                            style={{
                              fontSize: '10px',
                              opacity: isSorted ? 1 : 0.3,
                              color: isSorted
                                ? 'var(--color-cta-primary)'
                                : 'var(--color-text-secondary)',
                            }}
                          >
                            {isSorted === 'asc'
                              ? '\u2191'
                              : isSorted === 'desc'
                                ? '\u2193'
                                : '\u2195'}
                          </span>
                        )}
                      </span>
                      {/* Resize handle */}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        style={{
                          ...resizeHandleStyle,
                          background: header.column.getIsResizing()
                            ? 'var(--color-cta-primary)'
                            : 'transparent',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                style={{
                  background:
                    idx % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-alt)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    'var(--color-row-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    idx % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-alt)';
                }}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as any;
                  const align = meta?.align || 'left';
                  const cellStyleOverride = meta?.cellStyle || {};
                  const isAmount = align === 'right';

                  return (
                    <td
                      key={cell.id}
                      style={{
                        ...tdStyle,
                        width: cell.column.getSize(),
                        textAlign: align,
                        ...(isAmount
                          ? { fontVariantNumeric: 'tabular-nums' }
                          : {}),
                        ...(cell.column.id === 'invoiceNumber'
                          ? { fontWeight: 500 }
                          : {}),
                        ...cellStyleOverride,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={paginationStyle}>
        <span
          style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {total > 0
            ? `Showing ${from}\u2013${to} of ${total}`
            : 'No results'}
          {loading && ' (loading...)'}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
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
            type="button"
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
