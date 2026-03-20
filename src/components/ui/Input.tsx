'use client';

import { CSSProperties, InputHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const wrapperStyle: CSSProperties = {
  width: '100%',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-text-label)',
  marginBottom: '6px',
  letterSpacing: '-0.25px',
};

const helpTextStyle: CSSProperties = {
  display: 'block',
  marginTop: '6px',
  fontSize: '12px',
  lineHeight: '20px',
  color: 'var(--color-error)',
};

const fieldBaseStyle: CSSProperties = {
  width: '100%',
  minHeight: 'var(--height-input)',
  padding: '9px 12px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  fontSize: '14px',
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  outline: 'none',
  background: 'var(--color-bg-card)',
  transition: 'border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease',
};

function getFieldStateStyle({
  focused,
  hovered,
  error,
}: {
  focused: boolean;
  hovered: boolean;
  error?: string;
}): CSSProperties {
  if (error) {
    return {
      borderColor: 'rgba(239, 68, 68, 0.28)',
      boxShadow: focused ? '0 0 0 3px rgba(239, 68, 68, 0.12)' : 'none',
    };
  }

  if (focused) {
    return {
      borderColor: 'var(--color-border-input-focus)',
      boxShadow: 'var(--shadow-focus)',
    };
  }

  if (hovered) {
    return {
      borderColor: 'var(--color-border-input-hover)',
    };
  }

  return {};
}

export default function Input({
  label,
  error,
  style,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div style={wrapperStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        style={{
          ...fieldBaseStyle,
          ...getFieldStateStyle({ focused, hovered, error }),
          ...style,
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onMouseEnter={(event) => {
          setHovered(true);
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          setHovered(false);
          onMouseLeave?.(event);
        }}
        {...props}
      />
      {error && <span style={helpTextStyle}>{error}</span>}
    </div>
  );
}

export function Textarea({
  label,
  style,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  ...props
}: { label?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div style={wrapperStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <textarea
        style={{
          ...fieldBaseStyle,
          minHeight: '96px',
          resize: 'vertical',
          ...getFieldStateStyle({ focused, hovered }),
          ...style,
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onMouseEnter={(event) => {
          setHovered(true);
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          setHovered(false);
          onMouseLeave?.(event);
        }}
        {...props}
      />
    </div>
  );
}
