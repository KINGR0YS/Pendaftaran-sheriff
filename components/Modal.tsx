'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, footer }: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  if (!mounted) return null;

  const modalRoot = document.getElementById('modal-root') || document.body;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          maxHeight: '85vh',
          overflow: 'hidden'
        }}
      >
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
          {children}
        </div>
        
        {footer && (
          <div 
            className="modal-footer" 
            style={{ 
              marginTop: '1rem', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '0.75rem', 
              flexShrink: 0,
              borderTop: '1px solid var(--color-border-custom)',
              paddingTop: '1rem'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    modalRoot
  );
}
