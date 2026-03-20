'use client';

import { CSSProperties, useState, useRef, useEffect, useMemo } from 'react';
import { SYSTEM_REPORTS, NOB_ORDER, NOB_DISPLAY_NAMES } from '@/lib/constants';
import type { SavedQuery, SystemReport } from '@/types';

interface ReportSelectorDropdownProps {
  savedQueries: SavedQuery[];
  loading: boolean;
  activeReport: (SavedQuery | SystemReport) | null;
  onSelectReport: (report: SavedQuery | SystemReport) => void;
  onClearReport: () => void;
}

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: 'var(--height-input)',
  padding: '0 14px',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-input)',
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-card)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.25px',
  minWidth: '200px',
  justifyContent: 'space-between',
  boxShadow: '0 1px 2px rgba(20, 28, 39, 0.04)',
};

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-popover)',
  zIndex: 50,
  minWidth: '300px',
  maxHeight: '420px',
  overflowY: 'auto',
  padding: '6px 0',
};

const sectionLabelStyle: CSSProperties = {
  padding: '10px 12px 6px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '9px 12px',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  width: '100%',
  textAlign: 'left',
  letterSpacing: '-0.25px',
};

const dividerStyle: CSSProperties = {
  height: '1px',
  background: 'var(--color-border)',
  margin: '6px 0',
};

const nobHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  width: '100%',
  textAlign: 'left',
  letterSpacing: '-0.15px',
};

const nobItemStyle: CSSProperties = {
  ...itemStyle,
  paddingLeft: '30px',
  fontSize: '13px',
};

function getReportId(report: SavedQuery | SystemReport): string {
  return 'isSystem' in report ? report.id : report._id;
}

export default function ReportSelectorDropdown({
  savedQueries,
  loading,
  activeReport,
  onSelectReport,
  onClearReport,
}: ReportSelectorDropdownProps) {
  const [open, setOpen] = useState(false);
  const [expandedNobs, setExpandedNobs] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Split saved queries into default reports and user-created reports
  const { defaultReports, customReports } = useMemo(() => {
    const defaults: SavedQuery[] = [];
    const custom: SavedQuery[] = [];
    for (const sq of savedQueries) {
      if (sq.isDefault) {
        defaults.push(sq);
      } else {
        custom.push(sq);
      }
    }
    return { defaultReports: defaults, customReports: custom };
  }, [savedQueries]);

  // Group default reports by NOB, ordered by NOB_ORDER
  const groupedDefaults = useMemo(() => {
    const groups: { nob: string; label: string; reports: SavedQuery[] }[] = [];
    const byNob: Record<string, SavedQuery[]> = {};
    for (const r of defaultReports) {
      const nob = r.nob || 'OTHER';
      if (!byNob[nob]) byNob[nob] = [];
      byNob[nob].push(r);
    }
    for (const nob of NOB_ORDER) {
      if (byNob[nob]) {
        groups.push({
          nob,
          label: NOB_DISPLAY_NAMES[nob] || nob,
          reports: byNob[nob],
        });
      }
    }
    // Any NOBs not in NOB_ORDER
    for (const nob of Object.keys(byNob)) {
      if (!NOB_ORDER.includes(nob as any)) {
        groups.push({
          nob,
          label: NOB_DISPLAY_NAMES[nob] || nob,
          reports: byNob[nob],
        });
      }
    }
    return groups;
  }, [defaultReports]);

  // Auto-expand the NOB group containing the active report
  useEffect(() => {
    if (activeReport && 'isDefault' in activeReport && (activeReport as SavedQuery).isDefault) {
      const nob = (activeReport as SavedQuery).nob;
      if (nob && !expandedNobs.has(nob)) {
        setExpandedNobs((prev) => new Set([...prev, nob]));
      }
    }
  }, [activeReport]);

  const toggleNob = (nob: string) => {
    setExpandedNobs((prev) => {
      const next = new Set(prev);
      if (next.has(nob)) {
        next.delete(nob);
      } else {
        next.add(nob);
      }
      return next;
    });
  };

  const activeId = activeReport ? getReportId(activeReport) : null;
  const displayName = activeReport
    ? ('displayName' in activeReport ? activeReport.displayName : '')
    : 'All Invoices';

  const renderItem = (
    report: SavedQuery | SystemReport,
    id: string,
    label: string,
    style: CSSProperties = itemStyle,
    showDescription = false,
    description?: string
  ) => (
    <button
      key={id}
      style={{
        ...style,
        fontWeight: activeId === id ? 500 : 400,
        background: activeId === id ? 'var(--color-menu-selected)' : 'transparent',
      }}
      onClick={() => {
        onSelectReport(report);
        setOpen(false);
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          activeId === id ? 'var(--color-menu-selected)' : 'var(--color-menu-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          activeId === id ? 'var(--color-menu-selected)' : 'transparent';
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      {showDescription && description && (
        <span
          style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {description}
        </span>
      )}
    </button>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        style={{
          ...triggerStyle,
          borderColor: open ? 'var(--color-border-input-focus)' : 'var(--color-border-strong)',
          boxShadow: open ? 'var(--shadow-focus)' : triggerStyle.boxShadow,
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M5 6h6M5 8h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {displayName}
        </span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>&#x25BC;</span>
      </button>
      {open && (
        <div style={menuStyle}>
          {/* All Invoices — no report */}
          <button
            style={{
              ...itemStyle,
              fontWeight: !activeReport ? 500 : 400,
              background: !activeReport ? 'var(--color-bg-alt)' : 'none',
            }}
            onClick={() => {
              onClearReport();
              setOpen(false);
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-menu-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                !activeReport ? 'var(--color-menu-selected)' : 'transparent';
            }}
          >
            All Invoices
          </button>

          <div style={dividerStyle} />

          {/* System Reports */}
          <div style={sectionLabelStyle}>System Reports</div>
          {SYSTEM_REPORTS.map((report) =>
            renderItem(report, report.id, report.displayName)
          )}

          {/* Default Reports — grouped by NOB */}
          {groupedDefaults.length > 0 && (
            <>
              <div style={dividerStyle} />
              <div style={sectionLabelStyle}>Default Reports</div>
              {groupedDefaults.map((group) => {
                const isExpanded = expandedNobs.has(group.nob);
                // Check if any report in this group is active
                const hasActiveChild = group.reports.some((r) => activeId === r._id);
                return (
                  <div key={group.nob}>
                    <button
                      style={{
                        ...nobHeaderStyle,
                        color: hasActiveChild
                          ? 'var(--color-cta-primary)'
                          : 'var(--color-text-secondary)',
                        background: hasActiveChild ? 'var(--color-menu-selected)' : 'transparent',
                      }}
                      onClick={() => toggleNob(group.nob)}
                    >
                      <span
                        style={{
                          fontSize: '9px',
                          transition: 'transform 0.15s',
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          display: 'inline-block',
                          width: '12px',
                        }}
                      >
                        &#x25B6;
                      </span>
                      <span>{group.label}</span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--color-text-secondary)',
                          marginLeft: 'auto',
                        }}
                      >
                        {group.reports.length}
                      </span>
                    </button>
                    {isExpanded &&
                      group.reports.map((r) =>
                        renderItem(r, r._id, r.displayName, nobItemStyle)
                      )}
                  </div>
                );
              })}
            </>
          )}

          {/* User-created Custom Reports */}
          {customReports.length > 0 && (
            <>
              <div style={dividerStyle} />
              <div style={sectionLabelStyle}>My Reports</div>
              {customReports.map((sq) =>
                renderItem(sq, sq._id, sq.displayName, itemStyle, true, sq.description)
              )}
            </>
          )}

          {loading && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Loading reports...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
