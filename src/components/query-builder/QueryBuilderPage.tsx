'use client';

import { CSSProperties, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BillTypeStep from './BillTypeStep';
import ConditionList from './ConditionList';
import Button from '@/components/ui/Button';
import InvoiceTable from '@/components/reports/InvoiceTable';
import SaveReportModal from '@/components/reports/SaveReportModal';
import { useInvoices } from '@/hooks/useInvoices';
import { useSavedQueries } from '@/hooks/useSavedQueries';
import { conditionsToMongoQuery } from '@/lib/conditions-to-mongo';
import { getFieldEntry } from '@/lib/field-registry';
import { encodeFilters } from '@/lib/url-encoding';
import type { QueryGroup, QueryCondition } from '@/types/query-builder';
import type { DateFieldConfig } from '@/types';

// ── Styles ──────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const titleStyle: CSSProperties = {
  fontSize: '22px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  letterSpacing: '-0.5px',
  margin: 0,
  flex: 1,
};

const backLinkStyle: CSSProperties = {
  fontSize: '13px',
  color: 'var(--color-cta-primary)',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  fontWeight: 500,
  letterSpacing: '-0.25px',
};

const sectionStyle: CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  padding: '20px',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  letterSpacing: '-0.25px',
  margin: '0 0 12px 0',
};

const disabledOverlayStyle: CSSProperties = {
  opacity: 0.45,
  pointerEvents: 'none',
};

const previewHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '12px',
};

const resultCountStyle: CSSProperties = {
  fontSize: '13px',
  color: 'var(--color-text-secondary)',
  fontWeight: 400,
  letterSpacing: '-0.25px',
};

const footerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
  paddingTop: '8px',
  borderTop: '1px solid var(--color-border)',
};

// ── Helpers ─────────────────────────────────────────────────────────

function createEmptyGroup(): QueryGroup {
  return {
    id: crypto.randomUUID(),
    logicalOperator: 'AND',
    conditions: [],
  };
}

function hasValidConditions(group: QueryGroup): boolean {
  return group.conditions.some((c) => {
    if (!c.field) return false;
    // Dynamic date values are always valid if they have a preset
    if (c.value?.dynamic === true && c.value?.preset) return true;
    if (c.value === undefined || c.value === null || c.value === '') return false;
    if (Array.isArray(c.value) && c.value.length === 0) return false;
    return true;
  });
}

// ── Component ───────────────────────────────────────────────────────

export default function QueryBuilderPage() {
  const router = useRouter();
  const { createQuery } = useSavedQueries();

  // Step 1: Bill Type
  const [billType, setBillType] = useState<string | null>(null);

  // Step 2: Conditions
  const [group, setGroup] = useState<QueryGroup>(createEmptyGroup);

  // Preview
  const [previewQuery, setPreviewQuery] = useState<Record<string, any> | null>(null);
  const { data, total, loading, page, setPage, limit } = useInvoices(previewQuery || {});

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);

  const canPreview = billType !== null && hasValidConditions(group);
  const canSave = billType !== null && hasValidConditions(group);

  const handlePreview = useCallback(() => {
    if (!billType) return;
    const query = conditionsToMongoQuery(billType, group);
    setPreviewQuery(query);
  }, [billType, group]);

  const handleSave = useCallback(
    async (payload: {
      displayName: string;
      description: string;
      dateFields: DateFieldConfig[];
      query: Record<string, any>;
    }) => {
      // Extract dynamic date conditions into dateFields
      const dateFields: DateFieldConfig[] = [...payload.dateFields];
      const query = { ...payload.query };

      for (const c of group.conditions) {
        if (c.value?.dynamic === true && c.value?.preset) {
          const entry = getFieldEntry(c.field);
          const accessor = entry?.mongoField || c.field;
          const toDays = (unit: string) =>
            unit === 'weeks' ? 7 : unit === 'months' ? 30 : 1;

          dateFields.push({
            accessor,
            dateBehaviour: 'dynamic',
            dynamicPreset: c.value.preset,
            dateOperator: c.operator as '$between' | '$gte' | '$lte',
            ...(c.value.preset === 'custom_period'
              ? {
                  customDirection: c.value.direction || 'next',
                  customNumber:
                    (c.value.number || 7) * toDays(c.value.unit || 'days'),
                  customUnit: 'days' as const,
                }
              : {}),
          });
          // Remove the resolved date from query — it'll be resolved dynamically on report open
          delete query[accessor];
        }
      }

      const created = await createQuery({
        ...payload,
        dateFields,
        query,
      });
      const encoded = encodeFilters(query);
      router.push(`/reports/invoices?fq=${encoded}`);
      return created;
    },
    [createQuery, router, group]
  );

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button
          type="button"
          style={backLinkStyle}
          onClick={() => router.push('/reports')}
        >
          &larr; Reports
        </button>
      </div>
      <h1 style={titleStyle}>Create New Report</h1>

      {/* Step 1: Bill Type */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>1. Select Document Type</h2>
        <BillTypeStep value={billType} onChange={setBillType} />
      </div>

      {/* Step 2: Filters */}
      <div style={{ ...sectionStyle, ...(billType ? {} : disabledOverlayStyle) }}>
        <h2 style={sectionTitleStyle}>2. Add Filters</h2>
        <ConditionList group={group} onUpdate={setGroup} />
      </div>

      {/* Preview + Actions */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button
          variant="secondary"
          disabled={!canPreview}
          onClick={handlePreview}
        >
          Preview Results
        </Button>
        <Button
          variant="primary"
          disabled={!canSave}
          onClick={() => {
            // Always compute fresh query when opening Save modal
            const query = conditionsToMongoQuery(billType!, group);
            setPreviewQuery(query);
            setShowSaveModal(true);
          }}
        >
          Save Report
        </Button>
      </div>

      {/* Preview Results */}
      {previewQuery && (
        <div style={sectionStyle}>
          <div style={previewHeaderStyle}>
            <h2 style={{ ...sectionTitleStyle, margin: 0 }}>Preview</h2>
            <span style={resultCountStyle}>
              {loading ? 'Loading...' : `${total} result${total !== 1 ? 's' : ''} found`}
            </span>
          </div>
          <InvoiceTable
            data={data}
            total={total}
            loading={loading}
            page={page}
            setPage={setPage}
            limit={limit}
          />
        </div>
      )}

      {/* Footer */}
      <div style={footerStyle}>
        <Button variant="ghost" onClick={() => router.push('/reports')}>
          Cancel
        </Button>
      </div>

      {/* Save Modal */}
      <SaveReportModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
        filters={previewQuery || {}}
        saveAsNew
        hideDateBehaviour
      />
    </div>
  );
}
