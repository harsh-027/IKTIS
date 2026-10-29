import React, { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Dialog({ title, onClose, maxWidth = 'max-w-md', children, labelledBy }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = labelledBy || `dialog-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousActiveElement = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = () => [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)];

    const initialFocus = focusable().find((element) => element.autofocus) || focusable()[0];
    initialFocus?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement instanceof HTMLElement) previousActiveElement.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={dialogRef}
        className={`bg-canvas rounded-[18px] border border-border shadow-2xl w-full ${maxWidth} p-5 sm:p-6 max-h-[92dvh] flex flex-col my-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex="-1"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-5 shrink-0">
          <h2 id={titleId} className="text-base sm:text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label={`Close ${title}`}
            className="text-ink-muted hover:text-ink text-base leading-none rounded-full min-h-[40px] min-w-[40px] inline-flex items-center justify-center hover:bg-canvas-soft cursor-pointer transition"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}
