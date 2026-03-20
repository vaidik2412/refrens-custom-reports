'use client';

import { CSSProperties, ReactNode, useCallback, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number | string;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: 'var(--color-overlay)',
  zIndex: 80,
};

const modalStyle: CSSProperties = {
  width: 'var(--width-modal)',
  maxWidth: 'calc(100vw - 32px)',
  maxHeight: 'min(88vh, 760px)',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-bg-card)',
  borderRadius: 'var(--radius-modal)',
  boxShadow: 'var(--shadow-modal)',
  border: '1px solid rgba(20, 28, 39, 0.04)',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '20px 24px 16px',
  borderBottom: '1px solid var(--color-border-modal)',
  flexShrink: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 600,
  lineHeight: '28px',
  letterSpacing: '-0.25px',
  color: 'var(--color-text-primary)',
};

const closeButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  border: '1px solid transparent',
  borderRadius: '999px',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease',
};

const bodyStyle: CSSProperties = {
  padding: '24px',
  overflowY: 'auto',
  flex: 1,
};

const footerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
  padding: '16px 24px 20px',
  borderTop: '1px solid var(--color-border-modal)',
  flexShrink: 0,
};

export default function Modal({ open, onClose, title, children, footer, width }: ModalProps) {
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [handleEscape, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      style={overlayStyle}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={{ ...modalStyle, ...(width ? { width } : {}) }}>
        <div style={headerStyle}>
          {typeof title === 'string' ? <h2 style={titleStyle}>{title}</h2> : title}
          <button
            type="button"
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = 'var(--color-bg-hover)';
              event.currentTarget.style.borderColor = 'var(--color-border)';
              event.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'transparent';
              event.currentTarget.style.borderColor = 'transparent';
              event.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
        {footer ? <div style={footerStyle}>{footer}</div> : null}
      </div>
    </div>
  );
}
