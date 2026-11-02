import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, CircleDollarSign, Home, Menu, X } from 'lucide-react';
import SoftBlurIn from '../components/smoothui/soft-blur-in';
import RollingText from '../components/smoothui/rolling-text';

function IktisMark({ className = '' }) {
  return <img src="/icons.svg" alt="" aria-hidden="true" className={className} />;
}

function Roll({ children }) {
  return String(children).split(/(\d[\d,./%]*)/).map((part, index) =>
    /\d/.test(part) ? <RollingText key={index} text={part} /> : part,
  );
}

const navItems = [
  { label: 'How it works', href: '#hero' },
  { label: 'Sign in', href: '/login' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="iktis-landing min-h-screen overflow-hidden bg-[#f7f9fc] text-[#122033]">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="IKTIS home">
            <span className="flex h-9 w-9 items-center justify-center">
              <IktisMark className="h-8 w-8 object-contain" />
            </span>
            <span className="text-[17px] font-extrabold tracking-[-0.03em] text-[#123653]">IKTIS</span>
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] font-semibold text-[#607187] md:flex" aria-label="Primary">
            {navItems.map((item) =>
              item.href.startsWith('#') ? (
                <a key={item.label} href={item.href} className="transition-colors hover:text-[#164e78]">
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.href} className="transition-colors hover:text-[#164e78]">
                  {item.label}
                </Link>
              ),
            )}
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#164e78] px-5 py-2.5 text-white shadow-[0_8px_24px_rgba(22,78,120,0.18)] transition hover:-translate-y-0.5 hover:bg-[#103b5b]"
            >
              Get started <ArrowRight size={14} />
            </Link>
          </nav>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6e0ea] bg-white text-[#164e78] md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="mx-6 rounded-2xl border border-[#dfe7ef] bg-white p-3 shadow-xl md:hidden" aria-label="Mobile">
            <a href="#hero" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#607187]">
              How it works
            </a>
            <Link to="/login" className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#607187]">
              Sign in
            </Link>
            <Link to="/register" className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#164e78] px-4 py-3 text-sm font-bold text-white">
              Get started <ArrowRight size={14} />
            </Link>
          </nav>
        )}
      </header>

      <main id="hero" className="relative">
        <section className="relative mx-auto flex min-h-[850px] max-w-[1180px] flex-col items-center px-6 pb-20 pt-36 text-center lg:px-8 lg:pt-40">
          <div className="absolute left-[-16%] top-[12%] h-[360px] w-[360px] rounded-full bg-[#dbeaf6] blur-3xl" aria-hidden="true" />
          <div className="absolute right-[-14%] top-[30%] h-[420px] w-[420px] rounded-full bg-[#e6edf7] blur-3xl" aria-hidden="true" />

          <div className="relative z-10 max-w-[700px]">
            <h1 className="text-balance text-[clamp(2.6rem,5.5vw,5.2rem)] font-extrabold leading-[0.94] tracking-[-0.075em] text-[#102b43]">
              <SoftBlurIn>Know what's due.</SoftBlurIn><br />
              <SoftBlurIn className="text-[#3e7ea1]">Know what's paid.</SoftBlurIn>
            </h1>
            <p className="mx-auto mt-7 max-w-[540px] text-[17px] leading-7 text-[#607187] sm:text-[19px]">
              No scattered records. No forgotten payments. Just a clearer way to manage your rental business.
            </p>
          </div>

          <div className="relative z-10 mt-16 w-full max-w-[930px] lg:mt-20">
            <div className="absolute -inset-8 rounded-[42px] bg-[#dce9f3]/60 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[24px] border border-[#cfdae4] bg-white text-left shadow-[0_28px_70px_rgba(31,67,97,0.16)]">
              <div className="flex items-center justify-between border-b border-[#e7edf2] px-5 py-4 sm:px-7">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf5f9]"><IktisMark className="h-5 w-5 object-contain" /></span>
                  <div>
                    <p className="text-xs font-bold text-[#173653]"><Roll>Portfolio overview</Roll></p>
                    <p className="text-[10px] text-[#91a0ad]"><Roll>October 2026</Roll></p>
                  </div>
                </div>
                <span className="rounded-full bg-[#eef8f3] px-3 py-1 text-[10px] font-bold text-[#36805f]"><Roll>All up to date</Roll></span>
              </div>
              <div className="grid gap-4 bg-[#fbfcfd] p-5 sm:grid-cols-[1.05fr_1.7fr] sm:p-7">
                <div className="rounded-2xl border border-[#e4ebf0] bg-white p-5">
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-xs font-bold text-[#607187]"><Roll>This month</Roll></p>
                    <CircleDollarSign size={17} className="text-[#e28553]" />
                  </div>
                  <p className="text-3xl font-extrabold tracking-tight text-[#122f47]"><Roll>₹2,48,500</Roll></p>
                  <p className="mt-1 text-xs text-[#8b9aa8]"><Roll>collected rent</Roll></p>
                  <div className="mt-7 flex items-end gap-1.5">
                    {[38, 50, 42, 67, 58, 76, 86, 72, 94, 82, 100, 91].map((height, index) => (
                      <span key={index} className="flex-1 rounded-t bg-[#b9d8e6]" style={{ height: `${height}px` }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#e4ebf0] bg-white p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-xs font-bold text-[#607187]"><Roll>Properties & occupancy</Roll></p>
                    <span className="text-xs font-bold text-[#3e7ea1]"><Roll>92% occupied</Roll></span>
                  </div>
                  <div className="space-y-3">
                    {[
                      ['Riverside Apartments', '18 / 20 rooms', '₹1,42,000'],
                      ['Maple Residency', '12 / 14 rooms', '₹86,500'],
                      ['Greenview Homes', '5 / 6 rooms', '₹20,000'],
                    ].map(([name, rooms, amount]) => (
                      <div key={name} className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3.5 py-3">
                        <div>
                          <p className="text-xs font-bold text-[#25445d]"><Roll>{name}</Roll></p>
                          <p className="mt-1 text-[10px] text-[#8a99a7]"><Roll>{rooms}</Roll></p>
                        </div>
                        <p className="text-xs font-bold text-[#3e7ea1]"><Roll>{amount}</Roll></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#e7edf2] px-5 py-4 sm:px-7">
                <p className="text-xs font-medium text-[#91a0ad]"><Roll>A clear view of what is paid, pending, and next.</Roll></p>
                <div className="hidden items-center gap-1 text-[10px] font-bold text-[#3e7ea1] sm:flex"><Roll>View dashboard</Roll> <ChevronDown size={12} className="-rotate-90" /></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden text-[#102b43]">
        <div className="absolute inset-x-0 bottom-[-42px] select-none text-center text-[26vw] font-black leading-none tracking-[-0.1em] text-[#102b43]/[0.035]" aria-hidden="true">
          IKTIS
        </div>
        <div className="relative mx-auto max-w-[1180px] px-6 pb-8 pt-16 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <Link to="/" className="flex items-center gap-2.5" aria-label="IKTIS home">
              <IktisMark className="h-9 w-9 object-contain" />
              <span className="text-lg font-extrabold tracking-[-0.04em]">IKTIS</span>
            </Link>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs font-semibold text-[#607187]">
              <Link to="/privacy" className="transition hover:text-[#164e78]">Privacy</Link>
              <Link to="/terms" className="transition hover:text-[#164e78]">Terms</Link>
              <a href="mailto:hello@iktis.app" className="transition hover:text-[#164e78]">Contact</a>
              <Link to="/login" className="transition hover:text-[#164e78]">Sign in</Link>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-[#d6e0ea] pt-5 text-xs text-[#7692a7] sm:flex-row">
            <p>© {new Date().getFullYear()} IKTIS. Built for better-managed homes.</p>
            <p className="flex items-center gap-1.5"><Check size={13} className="text-[#79c4a0]" /> Secure landlord workspace</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
