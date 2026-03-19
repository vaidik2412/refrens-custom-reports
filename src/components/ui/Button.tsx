'use client';

import { CSSProperties, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  borderRadius: 'var(--radius-input)',
  fontSize: '14px',
  fontWeight: 500,
  letterSpacing: '-0.25px',
  cursor: 'pointer',
  transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
  whiteSpace: 'nowrap' as const,
};

const variants: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--color-cta-primary)',
    color: 'var(--color-bg-card)',
    border: 'none',
  },
  secondary: {
    background: 'var(--color-bg-card)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border-input)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-cta-primary)',
    border: 'none',
  },
  danger: {
    background: 'transparent',
    color: 'var(--color-error)',
    border: 'none',
  },
};

const sizes = {
  sm: { padding: '6px 12px', height: '32px', fontSize: '13px' },
  md: { padding: '8px 16px', height: '36px', fontSize: '14px' },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        ...baseStyle,
        ...variants[variant],
        ...sizes[size],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
