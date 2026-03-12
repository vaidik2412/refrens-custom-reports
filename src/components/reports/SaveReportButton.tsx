'use client';

import { useState } from 'react';
import SplitButton from '@/components/ui/SplitButton';
import SaveReportModal from './SaveReportModal';
import type { SavedQuery, SystemReport, DateFieldConfig } from '@/types';

interface SaveReportButtonProps {
  filters: Record<string, any>;
  activeReport: (SavedQuery | SystemReport) | null;
  isDirty: boolean;
  onCreateReport: (payload: {
    displayName: string;
    description: string;
    dateFields: DateFieldConfig[];
    query: Record<string, any>;
  }) => Promise<SavedQuery>;
  onUpdateReport: (id: string, payload: Partial<SavedQuery>) => Promise<SavedQuery>;
  onDeleteReport: (id: string) => Promise<void>;
  onReportCreated?: (report: SavedQuery) => void;
}

function isCustomReport(report: SavedQuery | SystemReport | null): report is SavedQuery {
  return report !== null && !('isSystem' in report);
}

/** Returns true if the report is editable (user-created, not a default report) */
function isEditableReport(report: SavedQuery | SystemReport | null): report is SavedQuery {
  return isCustomReport(report) && !report.isDefault;
}

export default function SaveReportButton({
  filters,
  activeReport,
  isDirty,
  onCreateReport,
  onUpdateReport,
  onDeleteReport,
  onReportCreated,
}: SaveReportButtonProps) {
  const [modalMode, setModalMode] = useState<'create' | 'save-as' | 'edit' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // editableReport = user-created custom report (not a default/system report)
  const editableReport = isEditableReport(activeReport) ? activeReport : null;
  const hasFilters = Object.keys(filters).length > 0;

  // Determine the primary action and dropdown items
  const getPrimaryAction = () => {
    if (editableReport && isDirty) {
      return {
        label: 'Save Report',
        action: async () => {
          await onUpdateReport(editableReport._id, { query: filters } as any);
        },
      };
    }
    return {
      label: 'Save as New Report',
      action: () => setModalMode('create'),
    };
  };

  const getDropdownItems = () => {
    const items: { label: string; value: string; danger?: boolean; divider?: boolean }[] = [];

    if (editableReport) {
      if (isDirty) {
        items.push({ label: 'Save as New Report', value: 'save-as' });
        items.push({ label: '', value: '', divider: true });
      }
      items.push({ label: 'Edit Report Details', value: 'edit' });
      items.push({ label: '', value: '', divider: true });
      items.push({ label: 'Delete Report', value: 'delete', danger: true });
    } else if (hasFilters) {
      // No editable report — "Save as New" is the only meaningful option, and it's already primary
    }

    return items;
  };

  const primary = getPrimaryAction();
  const dropdownItems = getDropdownItems();

  const handleDropdownSelect = (value: string) => {
    switch (value) {
      case 'save-as':
        setModalMode('save-as');
        break;
      case 'edit':
        setModalMode('edit');
        break;
      case 'delete':
        setConfirmDelete(true);
        break;
    }
  };

  const handleModalSave = async (payload: {
    displayName: string;
    description: string;
    dateFields: DateFieldConfig[];
    query: Record<string, any>;
  }) => {
    if (modalMode === 'edit' && editableReport) {
      await onUpdateReport(editableReport._id, {
        displayName: payload.displayName,
        description: payload.description,
        dateFields: payload.dateFields,
        query: payload.query,
      } as any);
    } else {
      const created = await onCreateReport(payload);
      onReportCreated?.(created);
    }
  };

  // Don't render if there are no filters and no active editable report
  if (!hasFilters && !editableReport) return null;

  return (
    <>
      {dropdownItems.length > 0 ? (
        <SplitButton
          label={primary.label}
          onClick={primary.action}
          items={dropdownItems}
          onSelect={handleDropdownSelect}
        />
      ) : (
        <button
          onClick={primary.action}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 16px',
            background: 'var(--color-cta-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-input)',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '-0.25px',
            cursor: 'pointer',
          }}
        >
          {primary.label}
        </button>
      )}

      {/* Save / Save As / Edit Modal */}
      <SaveReportModal
        open={modalMode !== null}
        onClose={() => setModalMode(null)}
        onSave={handleModalSave}
        filters={filters}
        existingReport={editableReport}
        saveAsNew={modalMode === 'save-as' || modalMode === 'create'}
      />

      {/* Delete Confirmation */}
      {confirmDelete && editableReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 55,
          }}
          onClick={(e) => e.target === e.currentTarget && setConfirmDelete(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-modal)',
              padding: '24px',
              width: '400px',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
              Delete Report
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
              Are you sure you want to delete &ldquo;{editableReport.displayName}&rdquo;? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-input)',
                  background: '#FFFFFF',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteReport(editableReport._id);
                  setConfirmDelete(false);
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 'var(--radius-input)',
                  background: 'var(--color-error)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
