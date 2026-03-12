'use client';

import { CSSProperties } from 'react';
import { useFilters } from '@/hooks/useFilters';
import { useSavedQueries } from '@/hooks/useSavedQueries';
import { useInvoices } from '@/hooks/useInvoices';
import ReportSelectorDropdown from './ReportSelectorDropdown';
import SaveReportButton from './SaveReportButton';
import FilterBar from './FilterBar';
import AppliedFiltersPills from './AppliedFiltersPills';
import InvoiceTable from './InvoiceTable';
import type { SavedQuery, SystemReport } from '@/types';

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  paddingBottom: '8px',
};

const titleSectionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const pageHeaderStyle: CSSProperties = {
  fontSize: '22px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  letterSpacing: '-0.5px',
  margin: 0,
};

export default function ReportsDashboard() {
  const {
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
  } = useFilters();

  const {
    queries: savedQueries,
    loading: queriesLoading,
    createQuery,
    updateQuery,
    deleteQuery,
  } = useSavedQueries();

  const {
    data: invoices,
    total,
    loading: invoicesLoading,
    page,
    setPage,
    limit,
  } = useInvoices(filters);

  const handleSelectReport = (report: SavedQuery | SystemReport) => {
    applyReport(report);
  };

  const handleClearReport = () => {
    setActiveReport(null);
    clearFilters();
  };

  const handleDeleteReport = async (id: string) => {
    await deleteQuery(id);
    setActiveReport(null);
    clearFilters();
  };

  const handleReportCreated = (report: SavedQuery) => {
    applyReport(report);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={headerStyle}>
        <div style={titleSectionStyle}>
          <h1 style={pageHeaderStyle}>Invoices</h1>
          <ReportSelectorDropdown
            savedQueries={savedQueries}
            loading={queriesLoading}
            activeReport={activeReport}
            onSelectReport={handleSelectReport}
            onClearReport={handleClearReport}
          />
        </div>
        <SaveReportButton
          filters={filters}
          activeReport={activeReport}
          isDirty={isDirty}
          onCreateReport={createQuery}
          onUpdateReport={updateQuery}
          onDeleteReport={handleDeleteReport}
          onReportCreated={handleReportCreated}
        />
      </div>

      {/* Active report indicator */}
      {activeReport && 'displayName' in activeReport && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--color-chip-bg)',
            borderRadius: 'var(--radius-input)',
            marginBottom: '4px',
            fontSize: '13px',
          }}
        >
          <span style={{ color: 'var(--color-chip-text)', fontWeight: 500 }}>
            Report: {activeReport.displayName}
          </span>
          {isDirty && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-warning)',
                fontStyle: 'italic',
              }}
            >
              (modified)
            </span>
          )}
          {'description' in activeReport && activeReport.description && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '4px' }}>
              — {activeReport.description}
            </span>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        setFilter={setFilter}
        removeFilter={removeFilter}
      />

      {/* Applied Filters Pills */}
      <AppliedFiltersPills
        filters={filters}
        removeFilter={removeFilter}
        clearFilters={clearFilters}
      />

      {/* Invoice Table */}
      <InvoiceTable
        data={invoices}
        total={total}
        loading={invoicesLoading}
        page={page}
        setPage={setPage}
        limit={limit}
      />
    </div>
  );
}
