'use client';

import { useState } from 'react';
import SplitButton from '@/components/ui/SplitButton';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SaveReportModal from './SaveReportModal';
import type { SavedQuery, SystemReport, DateFieldConfig } from '@/types';
import { buildSavedQueryPayload } from '@/lib/saved-query-contract';

interface SaveReportButtonProps {
  filters: Record<string, any>;
  dateFields: DateFieldConfig[];
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
  onReportUpdated?: (report: SavedQuery) => void;
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
  dateFields,
  activeReport,
  isDirty,
  onCreateReport,
  onUpdateReport,
  onDeleteReport,
  onReportCreated,
  onReportUpdated,
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
          const canonicalPayload = buildSavedQueryPayload(filters, dateFields);
          const updated = await onUpdateReport(editableReport._id, canonicalPayload as any);
          onReportUpdated?.(updated);
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
      const updated = await onUpdateReport(editableReport._id, {
        displayName: payload.displayName,
        description: payload.description,
        dateFields: payload.dateFields,
        query: payload.query,
      } as any);
      onReportUpdated?.(updated);
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
        <Button onClick={primary.action}>
          {primary.label}
        </Button>
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
        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="Delete Report"
          width={420}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await onDeleteReport(editableReport._id);
                  setConfirmDelete(false);
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '24px', color: 'var(--color-text-secondary)' }}>
            Are you sure you want to delete &ldquo;{editableReport.displayName}&rdquo;? This action cannot be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
