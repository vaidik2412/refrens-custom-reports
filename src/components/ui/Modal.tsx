'use client';

import { CSSProperties, useEffect, useCallback } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
};

const modalStyle: CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 'var(--radius-modal)',
  width: 'var(--width-modal)',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: 'var(--shadow-modal)',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px 16px',
  borderBottom: '1px solid #F3F4F6',
  flexShrink: 0,
};

const titleStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  letterSpacing: '-0.25px',
};

const closeBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  padding: '4px',
  lineHeight: 1,
};

const bodyStyle: CSSProperties = {
  padding: '24px',
  flex: 1,
  overflowY: 'auto',
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  padding: '16px 24px',
  borderTop: '1px solid #F3F4F6',
  flexShrink: 0,
};

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          <button style={closeBtnStyle} onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
}
