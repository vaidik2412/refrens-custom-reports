'use client';

import { CSSProperties, ButtonHTMLAttributes, useState } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  borderRadius: 'var(--radius-input)',
  border: '1px solid transparent',
  fontWeight: 500,
  letterSpacing: '-0.25px',
  lineHeight: 1,
  cursor: 'pointer',
  transition:
    'background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, CSSProperties> = {
  sm: {
    minHeight: 'var(--height-button-sm)',
    padding: '0 12px',
    fontSize: '13px',
  },
  md: {
    minHeight: 'var(--height-button)',
    padding: '0 16px',
    fontSize: '14px',
  },
};

const variantStyles: Record<
  ButtonVariant,
  {
    default: CSSProperties;
    hover: CSSProperties;
    active: CSSProperties;
    focus: CSSProperties;
  }
> = {
  primary: {
    default: {
      background: 'var(--color-cta-primary)',
      color: 'var(--color-bg-card)',
      borderColor: 'var(--color-cta-primary)',
      boxShadow: '0 1px 2px rgba(20, 28, 39, 0.08)',
    },
    hover: {
      background: 'var(--color-cta-primary-hover)',
      borderColor: 'var(--color-cta-primary-hover)',
    },
    active: {
      background: 'var(--color-cta-primary-hover)',
      borderColor: 'var(--color-cta-primary-hover)',
      boxShadow: 'inset 0 1px 2px rgba(20, 28, 39, 0.12)',
    },
    focus: {
      boxShadow: 'var(--shadow-focus)',
    },
  },
  secondary: {
    default: {
      background: 'var(--color-bg-card)',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border-strong)',
      boxShadow: '0 1px 2px rgba(20, 28, 39, 0.04)',
    },
    hover: {
      background: 'var(--color-bg-hover)',
      borderColor: 'var(--color-icon-border)',
    },
    active: {
      background: 'var(--color-bg-pressed)',
      borderColor: 'var(--color-icon-border)',
    },
    focus: {
      boxShadow: 'var(--shadow-focus)',
    },
  },
  ghost: {
    default: {
      background: 'transparent',
      color: 'var(--color-cta-primary)',
      borderColor: 'transparent',
    },
    hover: {
      background: 'var(--color-cta-soft-bg)',
      borderColor: 'var(--color-cta-soft-border)',
    },
    active: {
      background: 'rgba(123, 62, 255, 0.12)',
      borderColor: 'var(--color-cta-soft-border)',
    },
    focus: {
      boxShadow: 'var(--shadow-focus)',
    },
  },
  danger: {
    default: {
      background: 'transparent',
      color: 'var(--color-error)',
      borderColor: 'rgba(239, 68, 68, 0.16)',
    },
    hover: {
      background: 'var(--color-error-hover-bg)',
      borderColor: 'rgba(239, 68, 68, 0.24)',
    },
    active: {
      background: 'rgba(239, 68, 68, 0.12)',
      borderColor: 'rgba(239, 68, 68, 0.28)',
    },
    focus: {
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.12)',
    },
  },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  children,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onFocus,
  onBlur,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  const interactionStyle = disabled
    ? {}
    : pressed
      ? variantStyles[variant].active
      : hovered
        ? variantStyles[variant].hover
        : {};

  return (
    <button
      type={props.type ?? 'button'}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant].default,
        ...interactionStyle,
        ...(focused ? variantStyles[variant].focus : {}),
        opacity: disabled ? 0.56 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      disabled={disabled}
      onMouseEnter={(event) => {
        if (!disabled) {
          setHovered(true);
        }
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        setHovered(false);
        setPressed(false);
        onMouseLeave?.(event);
      }}
      onMouseDown={(event) => {
        if (!disabled) {
          setPressed(true);
        }
        onMouseDown?.(event);
      }}
      onMouseUp={(event) => {
        setPressed(false);
        onMouseUp?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        setPressed(false);
        onBlur?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
