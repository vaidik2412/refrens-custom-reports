'use client';

import { CSSProperties, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useAIReport } from '@/hooks/useAIReport';
import type { AIFilterInstruction, AIReportResult } from '@/types/ai-report';

// ── Props ────────────────────────────────────────────────────────────

interface AIReportPromptProps {
  /** Called when AI successfully generates filters. Receives the flat query object and suggested name. */
  onFiltersGenerated: (query: Record<string, any>, suggestedName?: string) => void;
  /** Result count from the preview table (shown in feedback) */
  total?: number;
  /** Whether the preview table is loading */
  previewLoading?: boolean;
}

// ── Styles ───────────────────────────────────────────────────────────

const containerStyle: CSSProperties = {
  marginBottom: '0',
};

const inputRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const inputRowFocusStyle: CSSProperties = {
  ...inputRowStyle,
  borderColor: 'var(--color-cta-primary)',
  boxShadow: 'var(--shadow-focus)',
};

const inputRowLoadingStyle: CSSProperties = {
  ...inputRowStyle,
  borderColor: 'var(--color-cta-primary)',
  opacity: 0.85,
};

const iconStyle: CSSProperties = {
  flexShrink: 0,
  width: '18px',
  height: '18px',
  color: 'var(--color-text-secondary)',
};

const inputStyle: CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '14px',
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  fontFamily: 'inherit',
};

const submitBtnStyle: CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  border: 'none',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-cta-primary)',
  color: '#fff',
  cursor: 'pointer',
  transition: 'opacity 0.15s',
};

const submitBtnDisabledStyle: CSSProperties = {
  ...submitBtnStyle,
  background: 'var(--color-border)',
  cursor: 'default',
};

const feedbackStyle: CSSProperties = {
  marginTop: '8px',
  padding: '8px 12px',
  borderRadius: 'var(--radius-input)',
  fontSize: '13px',
  lineHeight: 1.5,
};

const successFeedbackStyle: CSSProperties = {
  ...feedbackStyle,
  background: 'var(--color-success-bg, #f0fdf4)',
  color: 'var(--color-success-text, #166534)',
  border: '1px solid var(--color-success-border, #bbf7d0)',
};

const errorFeedbackStyle: CSSProperties = {
  ...feedbackStyle,
  background: 'var(--color-error-banner-bg)',
  color: 'var(--color-error-banner-text)',
  border: '1px solid var(--color-error-banner-border)',
};

// ── SVG Icons ────────────────────────────────────────────────────────

function SparklesIcon() {
  return (
    <svg style={iconStyle} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 1l2.39 5.12L18 8.24l-4.09 3.55L15.18 18 10 14.77 4.82 18l1.27-6.21L2 8.24l5.61-2.12L10 1z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Convert AI filter instructions into a flat MongoDB query object */
function filtersToQuery(filters: AIFilterInstruction[]): Record<string, any> {
  const query: Record<string, any> = {};
  for (const f of filters) {
    query[f.key] = f.value;
  }
  return query;
}

// ── Component ────────────────────────────────────────────────────────

export default function AIReportPrompt({
  onFiltersGenerated,
  total,
  previewLoading,
}: AIReportPromptProps) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [appliedResult, setAppliedResult] = useState<AIReportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { loading, result, error, generateReport } = useAIReport();

  const showResult = appliedResult || result;

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const aiResult = await generateReport(trimmed);
    if (!aiResult || !aiResult.success) return;

    // Convert filter instructions to flat query and pass to parent
    const query = filtersToQuery(aiResult.filters);
    onFiltersGenerated(query, aiResult.suggestedName);
    setAppliedResult(aiResult);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Clear feedback when user starts typing again
  useEffect(() => {
    if (input.length > 0 && appliedResult) {
      setAppliedResult(null);
    }
  }, [input, appliedResult]);

  const rowStyle = loading
    ? inputRowLoadingStyle
    : focused
      ? inputRowFocusStyle
      : inputRowStyle;

  const canSubmit = input.trim().length > 0 && !loading;

  return (
    <div style={containerStyle}>
      <div style={rowStyle}>
        <SparklesIcon />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the report you want... e.g. &quot;unpaid invoices from last quarter in USD&quot;"
          style={inputStyle}
          disabled={loading}
          aria-label="Describe the report you want"
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={canSubmit ? submitBtnStyle : submitBtnDisabledStyle}
          title="Generate report"
          aria-label="Generate report"
        >
          {loading ? <SpinnerIcon /> : <ArrowIcon />}
        </button>
      </div>

      {/* Success feedback */}
      {showResult && showResult.success && (
        <div style={successFeedbackStyle}>
          <span>{showResult.explanation}</span>
          {total !== undefined && !previewLoading && (
            <span style={{ fontWeight: 500, marginLeft: '6px' }}>
              ({total} {total === 1 ? 'result' : 'results'})
            </span>
          )}
          {showResult.suggestedName && (
            <span style={{ color: 'var(--color-text-secondary)', marginLeft: '8px', fontSize: '12px' }}>
              — Save as &quot;{showResult.suggestedName}&quot;?
            </span>
          )}
        </div>
      )}

      {/* Error feedback */}
      {error && (
        <div style={errorFeedbackStyle}>
          <span>{error}</span>
          {showResult && !showResult.success && showResult.suggestion && (
            <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', opacity: 0.85 }}>
              Try: {showResult.suggestion}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
