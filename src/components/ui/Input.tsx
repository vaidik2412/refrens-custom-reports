'use client';

import { CSSProperties, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid rgba(0,0,0,0.15)',
  borderRadius: 'var(--radius-input)',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  background: '#FFFFFF',
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
          e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--color-error)' : 'rgba(0,0,0,0.15)';
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
          e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(0,0,0,0.15)';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
    </div>
  );
}
