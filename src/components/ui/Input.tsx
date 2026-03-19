'use client';

import { CSSProperties, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  background: 'var(--color-bg-card)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-text-label)',
  marginBottom: '4px',
  letterSpacing: '-0.25px',
};

export default function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ width: '100%' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        style={{
          ...inputStyle,
          borderColor: error ? 'var(--color-error)' : undefined,
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-cta-primary)';
          e.target.style.boxShadow = 'var(--shadow-focus)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--color-border-input)';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px', display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  );
}

export function Textarea({
  label,
  style,
  ...props
}: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div style={{ width: '100%' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <textarea
        style={{
          ...inputStyle,
          minHeight: '80px',
          resize: 'vertical' as const,
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-cta-primary)';
          e.target.style.boxShadow = 'var(--shadow-focus)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color-border-input)';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
    </div>
  );
}
