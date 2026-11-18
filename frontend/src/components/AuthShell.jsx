import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthShell({
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-md',
  glass = false,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] px-4 py-8 text-white sm:flex sm:items-center sm:justify-center sm:py-12">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0a0a0a]" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,#34404a_0%,#171a1d_45%,#0a0a0a_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.2)_0%,rgba(10,10,10,0.06)_18%,transparent_34%,transparent_66%,rgba(10,10,10,0.12)_82%,rgba(10,10,10,0.22)_100%)]" />
      </div>
      <div className={`relative z-10 w-full ${maxWidth}`}>
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5" aria-label="IKTIS home">
            <img src="/icons.svg" alt="" aria-hidden="true" className="h-9 w-9 object-contain" />
            <span className="font-display text-2xl font-medium tracking-tight">IKTIS</span>
          </Link>
        </div>

        <main className={`rounded-2xl border p-5 sm:p-8 ${glass ? 'border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-md' : 'border-border/70 bg-white text-ink shadow-sm'}`}>
          <header className="mb-6">
            <h1 className={`font-display text-2xl font-medium tracking-tight ${glass ? 'text-white' : 'text-ink'}`}>{title}</h1>
            <p className={`mt-2 text-sm leading-5 ${glass ? 'text-white/70' : 'text-ink-muted'}`}>{description}</p>
          </header>
          {children}
          {footer && <div className={`mt-6 border-t pt-5 text-center ${glass ? 'border-white/15' : 'border-border/60'}`}>{footer}</div>}
        </main>

        <p className="mt-6 text-center text-xs text-white/60">
          <span className="material-symbols-outlined mr-1 align-[-3px] text-[14px]" aria-hidden="true">shield</span>
          Secure session and private landlord data
        </p>
        <nav aria-label="Legal" className="mt-3 text-center text-xs text-white/60">
          <Link to="/privacy" className="transition-colors hover:text-white hover:underline">Privacy Policy</Link>
          <span className="mx-2" aria-hidden="true">·</span>
          <Link to="/terms" className="transition-colors hover:text-white hover:underline">Terms of Service</Link>
        </nav>
      </div>
    </div>
  );
}
