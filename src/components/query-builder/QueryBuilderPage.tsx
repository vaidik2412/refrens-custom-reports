'use client';

import { CSSProperties, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BillTypeStep from './BillTypeStep';
import ConditionList from './ConditionList';
import Button from '@/components/ui/Button';
import InvoiceTable from '@/components/reports/InvoiceTable';
import SaveReportModal from '@/components/reports/SaveReportModal';
import AIReportPrompt from '@/components/reports/AIReportPrompt';
import { useInvoices } from '@/hooks/useInvoices';
import { useSavedQueries } from '@/hooks/useSavedQueries';
import { conditionsToMongoQuery } from '@/lib/conditions-to-mongo';
import { aiFiltersToQueryGroup } from '@/lib/ai-filters-to-conditions';
import { getFieldEntry, getFieldsForBillType } from '@/lib/field-registry';
import { encodeFilters } from '@/lib/url-encoding';
import type { QueryGroup, QueryCondition } from '@/types/query-builder';
import type { DateFieldConfig, SavedQuery, SortParam } from '@/types';

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
  lineHeight: '32px',
  letterSpacing: '-0.25px',
  margin: 0,
  flex: 1,
};

const backLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
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
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-card)',
  padding: '24px',
  boxShadow: '0 1px 2px rgba(20, 28, 39, 0.04)',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  lineHeight: '28px',
  letterSpacing: '-0.25px',
  margin: '0 0 16px 0',
};

const disabledOverlayStyle: CSSProperties = {
  opacity: 0.45,
  pointerEvents: 'none',
};

const previewHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--color-border)',
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
  paddingTop: '16px',
  borderTop: '1px solid var(--color-border)',
};

// ── Helpers ─────────────────────────────────────────────────────────

function createEmptyGroup(): QueryGroup {
  return {
    id: crypto.randomUUID(),
    logicalOperator: 'AND',
    conditions: [],
    groups: [],
  };
}

function isValidCondition(c: QueryCondition): boolean {
  if (!c.field) return false;
  if (c.value?.dynamic === true && c.value?.preset) return true;
  if (c.value === undefined || c.value === null || c.value === '') return false;
  if (Array.isArray(c.value) && c.value.length === 0) return false;
  return true;
}

function hasValidConditions(group: QueryGroup): boolean {
  if (group.conditions.some(isValidCondition)) return true;
  return (group.groups || []).some((g) => hasValidConditions(g));
}

// ── Component ───────────────────────────────────────────────────────

interface QueryBuilderPageProps {
  /** When provided, the builder opens in edit mode for this report */
  existingReport?: SavedQuery;
}

export default function QueryBuilderPage({ existingReport }: QueryBuilderPageProps = {}) {
  const router = useRouter();
  const { createQuery, updateQuery } = useSavedQueries();
  const isEditMode = !!existingReport;

  // Step 1: Bill Type
  const [billType, setBillType] = useState<string | null>(
    existingReport?.query?.billType || null
  );

  // Step 2: Conditions — restore from queryGroupTree if available, else reconstruct from query
  const [group, setGroup] = useState<QueryGroup>(() => {
    if (existingReport?.queryGroupTree) {
      return existingReport.queryGroupTree;
    }
    if (existingReport?.query) {
      // Reconstruct conditions from the saved mongo query
      const queryWithoutBillType = { ...existingReport.query };
      delete queryWithoutBillType.billType;

      // Also merge in date fields that were extracted from query
      if (existingReport.dateFields) {
        for (const df of existingReport.dateFields) {
          if (df.dateBehaviour === 'dynamic' && df.dynamicPreset) {
            queryWithoutBillType[df.accessor] = { $dynamic: df.dynamicPreset };
          } else if (df.fixedDateRange) {
            queryWithoutBillType[df.accessor] = df.fixedDateRange;
          }
        }
      }

      const filters = Object.entries(queryWithoutBillType).map(([key, value]) => ({ key, value }));
      if (filters.length > 0) {
        return aiFiltersToQueryGroup(filters);
      }
    }
    return createEmptyGroup();
  });

  // Preview — in edit mode, start with the existing query so results show immediately
  const [previewQuery, setPreviewQuery] = useState<Record<string, any> | null>(() => {
    if (existingReport && billType) {
      return conditionsToMongoQuery(billType, group);
    }
    return null;
  });
  const [previewSort, setPreviewSort] = useState<SortParam | undefined>(undefined);
  const stableEmptyQuery = useMemo(() => ({}), []);
  const { data, total, loading, page, setPage, limit } = useInvoices(previewQuery || stableEmptyQuery, previewSort);

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);

  // AI-generated report
  const [aiSuggestedName, setAiSuggestedName] = useState<string | undefined>(undefined);

  const handleAIFiltersGenerated = useCallback(
    (query: Record<string, any>, suggestedName?: string) => {
      // Extract billType from AI query if present, default to INVOICE
      const aiQuery = { ...query };
      const aiBillType = aiQuery.billType || 'INVOICE';
      delete aiQuery.billType;

      setBillType(aiBillType);
      setAiSuggestedName(suggestedName);

      // Convert AI filters to conditions so the condition builder shows them
      const filters = Object.entries(aiQuery).map(([key, value]) => ({ key, value }));
      const newGroup = aiFiltersToQueryGroup(filters);
      setGroup(newGroup);

      // Derive preview query from conditions (resolves dynamic dates properly)
      const resolvedQuery = conditionsToMongoQuery(aiBillType, newGroup);
      setPreviewQuery(resolvedQuery);
    },
    []
  );

  const handleBillTypeChange = useCallback(
    (newBillType: string) => {
      const subGroups = group.groups || [];
      const totalConditions = group.conditions.length + subGroups.reduce((sum, g) => sum + g.conditions.length, 0);
      if (totalConditions > 0 && billType !== null) {
        const newFieldKeys = new Set(
          getFieldsForBillType(newBillType).map((f) => f.key)
        );

        const hasIncompatibleCondition = (conditions: QueryCondition[]) =>
          conditions.some((c) => c.field && !newFieldKeys.has(c.field));

        const hasIncompatible =
          hasIncompatibleCondition(group.conditions) ||
          subGroups.some((g) => hasIncompatibleCondition(g.conditions));

        if (hasIncompatible) {
          const confirmed = window.confirm(
            'Changing the document type will remove filters that don\'t apply to the new type. Continue?'
          );
          if (!confirmed) return;

          const filterConditions = (conditions: QueryCondition[]) =>
            conditions.filter((c) => !c.field || newFieldKeys.has(c.field));

          setGroup({
            ...group,
            conditions: filterConditions(group.conditions),
            groups: subGroups
              .map((g) => ({ ...g, conditions: filterConditions(g.conditions) }))
              .filter((g) => g.conditions.length > 0),
          });
        }
      }
      setBillType(newBillType);
      setPreviewQuery(null);
    },
    [billType, group]
  );

  const hasAIQuery = previewQuery !== null && !hasValidConditions(group);
  const canPreview = billType !== null && hasValidConditions(group);
  const canSave = billType !== null && (hasValidConditions(group) || hasAIQuery);

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
      // Extract dynamic date conditions into dateFields (from all levels)
      const dateFields: DateFieldConfig[] = [...payload.dateFields];
      const query = { ...payload.query };

      const allConditions = [
        ...group.conditions,
        ...(group.groups || []).flatMap((g) => g.conditions),
      ];

      for (const c of allConditions) {
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

      const redirectQuery = previewQuery || conditionsToMongoQuery(billType!, group);
      const encoded = encodeFilters(redirectQuery);

      if (isEditMode && existingReport) {
        const updated = await updateQuery(existingReport._id, {
          ...payload,
          dateFields,
          query,
          queryGroupTree: group,
        } as any);
        router.push(`/reports/invoices?fq=${encoded}&reportId=${existingReport._id}&reportKind=saved`);
        return updated;
      }

      const created = await createQuery({
        ...payload,
        dateFields,
        query,
        queryGroupTree: group,
      });
      router.push(`/reports/invoices?fq=${encoded}`);
      return created;
    },
    [createQuery, router, group, billType, previewQuery]
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
      <h1 style={titleStyle}>{isEditMode ? 'Edit Report' : 'Create New Report'}</h1>

      {/* AI Report Prompt */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Describe your report</h2>
        <AIReportPrompt
          onFiltersGenerated={handleAIFiltersGenerated}
          total={previewQuery ? total : undefined}
          previewLoading={loading}
        />
      </div>

      {/* Divider */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        color: 'var(--color-text-secondary)',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '-0.25px',
      }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        <span>or build manually</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
      </div>

      {/* Step 1: Bill Type */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>1. Select Document Type</h2>
        <BillTypeStep value={billType} onChange={handleBillTypeChange} />
      </div>

      {/* Step 2: Filters */}
      <div style={{ ...sectionStyle, ...(billType ? {} : disabledOverlayStyle) }}>
        <h2 style={sectionTitleStyle}>2. Add Filters</h2>
        <ConditionList group={group} onUpdate={setGroup} billType={billType} />
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
          {isEditMode ? 'Update Report' : 'Save Report'}
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
            onSortChange={setPreviewSort}
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
        filters={previewQuery || stableEmptyQuery}
        existingReport={isEditMode ? existingReport : undefined}
        saveAsNew={!isEditMode}
        hideDateBehaviour
        defaultName={isEditMode ? existingReport?.displayName : aiSuggestedName}
      />
    </div>
  );
}
