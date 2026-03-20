'use client';

import { CSSProperties, useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import RadioGroup from '@/components/ui/RadioGroup';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import { DYNAMIC_PRESET_LABELS, PRESET_GROUPS } from '@/lib/date-utils';
import { buildSavedQueryPayload, normalizeDateFields } from '@/lib/saved-query-contract';
import type { DateFieldConfig, DynamicPreset, SavedQuery } from '@/types';

interface SaveReportModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    displayName: string;
    description: string;
    dateFields: DateFieldConfig[];
    query: Record<string, any>;
  }) => void;
  filters: Record<string, any>;
  /** If editing an existing report, provide its data */
  existingReport?: SavedQuery | null;
  /** Whether this is a "save as new" action */
  saveAsNew?: boolean;
  /** Hide the date behaviour (Fixed/Dynamic) section — use when dates are explicitly set by query builder */
  hideDateBehaviour?: boolean;
}

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  marginBottom: '18px',
};

const dateFieldRowStyle: CSSProperties = {
  background: 'var(--color-bg-alt)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '14px',
  marginBottom: '10px',
};

const presetSelectStyle: CSSProperties = {
  minHeight: 'var(--height-input)',
  padding: '8px 12px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-card)',
  outline: 'none',
  width: '100%',
  marginTop: '8px',
  letterSpacing: '-0.25px',
  boxShadow: '0 1px 2px rgba(20, 28, 39, 0.04)',
};

const helperTextStyle: CSSProperties = {
  fontSize: '12px',
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
};

const rowTitleStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  marginBottom: '10px',
};

const DATE_FILTER_KEYS = ['invoiceDate', 'dueDate', 'lastPaymentDate', 'createdAt'];

const DATE_FIELD_LABELS: Record<string, string> = {
  invoiceDate: 'Invoice Date',
  dueDate: 'Due Date',
  lastPaymentDate: 'Last Payment Date',
  createdAt: 'Created At',
};

export default function SaveReportModal({
  open,
  onClose,
  onSave,
  filters,
  existingReport,
  saveAsNew = false,
  hideDateBehaviour = false,
}: SaveReportModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dateConfigs, setDateConfigs] = useState<Record<string, DateFieldConfig>>({});
  const [saving, setSaving] = useState(false);
  // Tracks un-normalized display inputs for custom_period (not saved to DB)
  const [customInputs, setCustomInputs] = useState<Record<string, {
    direction: 'this' | 'next';
    number: number;
    unit: 'days' | 'weeks' | 'months';
  }>>({});

  // Initialize from existing report or filters
  useEffect(() => {
    if (!open) return;
    setCustomInputs({});

    if (existingReport && !saveAsNew) {
      setName(existingReport.displayName);
      setDescription(existingReport.description || '');
      // Build dateConfigs from existing dateFields
      const configs: Record<string, DateFieldConfig> = {};
      if (existingReport.dateFields) {
        for (const df of existingReport.dateFields) {
          configs[df.accessor] = df;
        }
      }
      // Fill in date filters not already configured
      for (const key of DATE_FILTER_KEYS) {
        if (filters[key] && !configs[key]) {
          configs[key] = {
            accessor: key,
            dateBehaviour: 'fixed',
            fixedDateRange: filters[key],
          };
        }
      }
      setDateConfigs(configs);
    } else {
      setName(saveAsNew && existingReport ? `${existingReport.displayName} (Copy)` : '');
      setDescription(saveAsNew && existingReport ? existingReport.description || '' : '');
      // When hideDateBehaviour is true, the caller handles dateFields — skip auto-population
      if (hideDateBehaviour) {
        setDateConfigs({});
      } else {
        // Auto-create date configs for active date filters
        const configs: Record<string, DateFieldConfig> = {};
        for (const key of DATE_FILTER_KEYS) {
          if (filters[key]) {
            configs[key] = {
              accessor: key,
              dateBehaviour: 'fixed',
              fixedDateRange: filters[key],
            };
          }
        }
        setDateConfigs(configs);
      }
    }
  }, [open, existingReport, saveAsNew, filters, hideDateBehaviour]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    // Build clean query without date fields that are dynamic
    const dateFields: DateFieldConfig[] = [];

    for (const [accessor, config] of Object.entries(dateConfigs)) {
      dateFields.push(config);
    }

    const payload = buildSavedQueryPayload(filters, normalizeDateFields(dateFields));

    try {
      await onSave({
        displayName: name.trim(),
        description: description.trim(),
        dateFields: payload.dateFields,
        query: payload.query,
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const updateDateConfig = (accessor: string, updates: Partial<DateFieldConfig>) => {
    setDateConfigs((prev) => ({
      ...prev,
      [accessor]: { ...prev[accessor], accessor, ...updates },
    }));
  };

  const toDaysMultiplier = (unit: 'days' | 'weeks' | 'months') =>
    unit === 'weeks' ? 7 : unit === 'months' ? 30 : 1;

  const updateCustomInput = (
    accessor: string,
    field: 'direction' | 'number' | 'unit',
    value: any
  ) => {
    setCustomInputs((prev) => {
      const current = prev[accessor] || { direction: 'next', number: 7, unit: 'days' };
      const next = { ...current, [field]: value };
      // Normalize to days and update the config
      const days = next.number * toDaysMultiplier(next.unit);
      updateDateConfig(accessor, {
        dynamicPreset: 'custom_period',
        customDirection: next.direction,
        customNumber: days,
        customUnit: 'days',
      });
      return { ...prev, [accessor]: next };
    });
  };

  const activeDateKeys = DATE_FILTER_KEYS.filter((key) => filters[key]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existingReport && !saveAsNew ? 'Edit Report' : 'Save as New Report'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving...' : 'Save Report'}
          </Button>
        </>
      }
    >
      {/* Report Name */}
      <div style={fieldStyle}>
        <Input
          label="Report Name *"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Q1 2026 Invoices"
          autoFocus
        />
      </div>

      {/* Description */}
      <div style={fieldStyle}>
        <Textarea
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional description for this report..."
          style={{ minHeight: '88px' }}
        />
      </div>

      {/* Date Behaviour — only show if there are active date filters and not hidden */}
      {!hideDateBehaviour && activeDateKeys.length > 0 && (
        <div style={fieldStyle}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-label)' }}>
            Date Behaviour
          </div>
          <p style={{ ...helperTextStyle, margin: '0 0 8px' }}>
            Choose whether date filters stay fixed or update dynamically each time you open this report.
          </p>
          {activeDateKeys.map((key) => {
            const config = dateConfigs[key] || {
              accessor: key,
              dateBehaviour: 'fixed' as const,
              fixedDateRange: filters[key],
            };
            return (
              <div key={key} style={dateFieldRowStyle}>
                <div style={rowTitleStyle}>
                  {DATE_FIELD_LABELS[key] || key}
                </div>
                <RadioGroup
                  options={[
                    { label: 'Fixed', value: 'fixed' },
                    { label: 'Dynamic', value: 'dynamic' },
                  ]}
                  value={config.dateBehaviour}
                  onChange={(v) => {
                    if (v === 'fixed') {
                      updateDateConfig(key, {
                        dateBehaviour: 'fixed',
                        fixedDateRange: filters[key],
                        dynamicPreset: undefined,
                      });
                    } else {
                      updateDateConfig(key, {
                        dateBehaviour: 'dynamic',
                        dynamicPreset: 'this_month',
                        fixedDateRange: undefined,
                      });
                    }
                  }}
                />
                {config.dateBehaviour === 'fixed' && filters[key] && (
                  <div style={{ ...helperTextStyle, marginTop: '10px' }}>
                    Fixed: {filters[key].$gte} to {filters[key].$lte}
                  </div>
                )}
                {config.dateBehaviour === 'dynamic' && (
                  <>
                    <select
                      value={config.dynamicPreset || 'this_month'}
                      onChange={(e) => {
                        const preset = e.target.value as DynamicPreset;
                        if (preset === 'custom_period') {
                          const ci = customInputs[key] || { direction: 'next', number: 7, unit: 'days' };
                          updateDateConfig(key, {
                            dynamicPreset: 'custom_period',
                            customDirection: ci.direction,
                            customNumber: ci.number * toDaysMultiplier(ci.unit),
                            customUnit: 'days',
                          });
                        } else {
                          updateDateConfig(key, {
                            dynamicPreset: preset,
                            customDirection: undefined,
                            customNumber: undefined,
                            customUnit: undefined,
                          });
                        }
                      }}
                      style={presetSelectStyle}
                    >
                      {PRESET_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.presets.map((preset) => (
                            <option key={preset} value={preset}>
                              {DYNAMIC_PRESET_LABELS[preset]}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>

                    {config.dynamicPreset === 'custom_period' && (() => {
                      const ci = customInputs[key] || { direction: 'next', number: 7, unit: 'days' };
                      return (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                          <select
                            value={ci.direction}
                            onChange={(e) => updateCustomInput(key, 'direction', e.target.value)}
                            style={{ ...presetSelectStyle, marginTop: 0, width: 'auto', flex: '0 0 auto' }}
                          >
                            <option value="this">This</option>
                            <option value="next">Next</option>
                          </select>
                          <input
                            type="number"
                            min={1}
                            value={ci.number}
                            onChange={(e) => updateCustomInput(key, 'number', Math.max(1, parseInt(e.target.value) || 1))}
                            style={{
                              ...presetSelectStyle,
                              marginTop: 0,
                              width: '64px',
                              flex: '0 0 auto',
                              textAlign: 'center',
                            }}
                          />
                          <select
                            value={ci.unit}
                            onChange={(e) => updateCustomInput(key, 'unit', e.target.value)}
                            style={{ ...presetSelectStyle, marginTop: 0, width: 'auto', flex: '1 1 auto' }}
                          >
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                            <option value="months">Months</option>
                          </select>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
