import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthShell({
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-md',
}) {
  return (
    <div className="min-h-screen bg-surface px-4 py-8 text-ink sm:flex sm:items-center sm:justify-center sm:py-12">
      <div className={`w-full ${maxWidth}`}>
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5" aria-label="IKTIS home">
            <img src="/icons.svg" alt="" aria-hidden="true" className="h-9 w-9 object-contain" />
            <span className="font-display text-2xl font-medium tracking-tight">IKTIS</span>
          </Link>
        </div>

        <main className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm sm:p-8">
          <header className="mb-6">
            <h1 className="font-display text-2xl font-medium tracking-tight text-ink">{title}</h1>
            <p className="mt-2 text-sm leading-5 text-ink-muted">{description}</p>
          </header>
          {children}
          {footer && <div className="mt-6 border-t border-border/60 pt-5 text-center">{footer}</div>}
        </main>

        <p className="mt-6 text-center text-xs text-ink-muted">
          <span className="material-symbols-outlined mr-1 align-[-3px] text-[14px]" aria-hidden="true">shield</span>
          Secure session and private landlord data
        </p>
        <nav aria-label="Legal" className="mt-3 text-center text-xs text-ink-muted">
          <Link to="/privacy" className="transition-colors hover:text-ink hover:underline">Privacy Policy</Link>
          <span className="mx-2" aria-hidden="true">·</span>
          <Link to="/terms" className="transition-colors hover:text-ink hover:underline">Terms of Service</Link>
        </nav>
      </div>
    </div>
  );
}
