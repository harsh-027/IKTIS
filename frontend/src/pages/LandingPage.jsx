import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, CircleDollarSign, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import useReducedMotion from '../hooks/useReducedMotion.js';
import useScrollAnimation from '../hooks/useScrollAnimation.js';

function IktisMark({ className = '' }) {
  return <img src="/icons.svg" alt="" aria-hidden="true" className={className} />;
}

const navItems = [
  { label: 'How it works', href: '#hero' },
  { label: 'Sign in', href: '/login' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();
  const animationScopeRef = useScrollAnimation((gsap) => {
    gsap.fromTo(
      '[data-landing-footer]',
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '[data-landing-footer]',
          start: 'top 90%',
          once: true,
        },
      },
    );
  });

  return (
    <motion.div
      ref={animationScopeRef}
      className="iktis-landing min-h-screen overflow-hidden bg-[#f7f4ee] text-[#1f1b16]"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-[1300px] items-center justify-between px-6 py-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="IKTIS home">
            <span className="flex h-9 w-9 items-center justify-center">
              <IktisMark className="h-8 w-8 object-contain" />
            </span>
            <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#1f1b16]">IKTIS</span>
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] font-medium text-[#71685d] md:flex" aria-label="Primary">
            {navItems.map((item) =>
              item.href.startsWith('#') ? (
                <a key={item.label} href={item.href} className="transition-colors hover:text-[#1f1b16]">
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.href} className="transition-colors hover:text-[#1f1b16]">
                  {item.label}
                </Link>
              ),
            )}
            <motion.div
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-[#245d7a] px-5 py-2.5 text-white transition-colors hover:bg-[#1d4d65]"
              >
                Get started <ArrowRight size={14} />
              </Link>
            </motion.div>
          </nav>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8d0c4] bg-[#fdfbf7] text-[#245d7a] md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.nav
              initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mx-6 rounded-xl border border-[#d8d0c4] bg-[#fdfbf7] p-3 shadow-[0_8px_24px_rgba(52,43,32,0.08)] md:hidden"
              aria-label="Mobile"
            >
            <a href="#hero" onClick={() => setMenuOpen(false)} className="block rounded-lg px-4 py-3 text-sm font-medium text-[#71685d]">
              How it works
            </a>
            <Link to="/login" className="block rounded-lg px-4 py-3 text-sm font-medium text-[#71685d]">
              Sign in
            </Link>
            <Link to="/register" className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-[#245d7a] px-4 py-3 text-sm font-medium text-white">
              Get started <ArrowRight size={14} />
            </Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main id="hero" className="relative">
        <section className="relative mx-auto grid min-h-[760px] max-w-[1300px] items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8 lg:pt-28">
          <div className="relative z-10 max-w-[520px]">
            <motion.p
              className="mb-5 text-xs font-medium text-[#8a7b6a]"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              Rental management, kept clear
            </motion.p>
            <motion.h1
              className="text-balance text-[clamp(2.8rem,5vw,5rem)] font-medium leading-[1.02] tracking-[-0.045em] text-[#1f1b16]"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              Keep every rent payment in view
            </motion.h1>
            <motion.p
              className="mt-6 max-w-[480px] text-[17px] leading-7 text-[#71685d] sm:text-[18px]"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.24, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              Track what is due, what is paid, and how each property is performing from one landlord workspace.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap items-center gap-4"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link to="/register" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#245d7a] px-5 text-sm font-medium text-white transition-colors hover:bg-[#1d4d65]">
                  Get started <ArrowRight size={15} />
                </Link>
              </motion.div>
              <motion.a
                href="#hero"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#d8d0c4] bg-[#fdfbf7] px-5 text-sm font-medium text-[#1f1b16] transition-colors hover:bg-white"
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                See how it works <ChevronDown size={15} />
              </motion.a>
            </motion.div>
          </div>

          <motion.div
            className="relative z-10 w-full"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.36, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="landing-product-preview relative overflow-hidden rounded-2xl border border-[#d8d0c4] bg-[#fdfbf7] text-left shadow-[0_16px_40px_rgba(52,43,32,0.1)]">
              <div className="flex items-center justify-between border-b border-[#e7e0d5] px-4 py-3 sm:px-7 sm:py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f0f2]"><IktisMark className="h-5 w-5 object-contain" /></span>
                  <div>
                    <p className="text-xs font-semibold text-[#1f1b16]">Portfolio overview</p>
                    <p className="text-[10px] text-[#8a7b6a]">October 2026</p>
                  </div>
                </div>
                <span className="rounded-md bg-[#e8f0ea] px-2.5 py-1 text-[10px] font-medium text-[#3d6c50] sm:px-3">All up to date</span>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-[#f7f3ed] p-3 sm:grid-cols-[1.05fr_1.7fr] sm:gap-4 sm:p-7">
                <div className="min-w-0 rounded-xl border border-[#e7e0d5] bg-[#fdfbf7] p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between sm:mb-6">
                    <p className="text-xs font-medium text-[#71685d]">This month</p>
                    <CircleDollarSign size={16} className="text-[#b76b3d] sm:h-[17px] sm:w-[17px]" />
                  </div>
                  <p className="text-2xl font-medium tracking-tight tabular-nums text-[#1f1b16] sm:text-3xl">₹2,48,500</p>
                  <p className="mt-1 text-xs text-[#8a7b6a]">Collected rent</p>
                  <div className="mt-4 border-t border-[#e7e0d5] pt-3 sm:hidden">
                    <p className="text-[10px] text-[#8a7b6a]">Outstanding rent</p>
                    <p className="mt-1 text-sm font-medium tabular-nums text-[#1f1b16]">₹0</p>
                  </div>
                  <div className="mt-7 hidden items-end gap-1.5 sm:flex">
                    {[38, 50, 42, 67, 58, 76, 86, 72, 94, 82, 100, 91].map((height, index) => (
                      <span key={index} className="flex-1 rounded-t bg-[#9dbbc3]" style={{ height: `${height}px` }} />
                    ))}
                  </div>
                </div>
                <div className="col-span-2 min-w-0 rounded-xl border border-[#e7e0d5] bg-[#fdfbf7] p-4 sm:col-span-1 sm:p-5">
                  <div className="mb-3 flex items-center justify-between sm:mb-5">
                    <p className="text-xs font-medium text-[#71685d]">Properties & occupancy</p>
                    <span className="text-xs font-medium text-[#245d7a]">92% occupied</span>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      ['Riverside Apartments', '18 / 20 rooms', '₹1,42,000'],
                      ['Maple Residency', '12 / 14 rooms', '₹86,500'],
                      ['Greenview Homes', '5 / 6 rooms', '₹20,000'],
                    ].map(([name, rooms, amount], index) => (
                      <div key={name} className={`${index === 2 ? 'hidden sm:flex' : 'flex'} items-center justify-between rounded-lg bg-[#f7f3ed] px-3.5 py-2.5 sm:py-3`}>
                        <div>
                          <p className="text-xs font-medium text-[#3c352d]">{name}</p>
                          <p className="mt-1 text-[10px] text-[#8a7b6a]">{rooms}</p>
                        </div>
                        <p className="text-xs font-medium tabular-nums text-[#245d7a]">{amount}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#e7e0d5] pt-3 sm:hidden">
                    <div>
                      <p className="text-[10px] text-[#8a7b6a]">Recent payment</p>
                      <p className="mt-1 text-xs font-medium text-[#3c352d]">Riverside Apartments</p>
                    </div>
                    <p className="text-xs font-medium tabular-nums text-[#245d7a]">₹1,42,000</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#e7e0d5] px-4 py-3 sm:px-7 sm:py-4">
                <p className="text-xs font-medium text-[#8a7b6a]">A clear view of what is paid, pending, and next</p>
                <div className="hidden items-center gap-1 text-[10px] font-medium text-[#245d7a] sm:flex">View dashboard <ChevronDown size={12} className="-rotate-90" /></div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer data-landing-footer className="relative overflow-hidden text-[#1f1b16]">
        <div className="relative mx-auto max-w-[1300px] px-6 pb-8 pt-16 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <Link to="/" className="flex items-center gap-2.5" aria-label="IKTIS home">
              <IktisMark className="h-9 w-9 object-contain" />
              <span className="text-lg font-semibold tracking-[-0.02em]">IKTIS</span>
            </Link>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs font-medium text-[#71685d]">
              <Link to="/privacy" className="transition-colors hover:text-[#1f1b16]">Privacy</Link>
              <Link to="/terms" className="transition-colors hover:text-[#1f1b16]">Terms</Link>
              <a href="mailto:hello@iktis.app" className="transition-colors hover:text-[#1f1b16]">Contact</a>
              <Link to="/login" className="transition-colors hover:text-[#1f1b16]">Sign in</Link>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-[#d8d0c4] pt-5 text-xs text-[#8a7b6a] sm:flex-row">
            <p>© {new Date().getFullYear()} IKTIS. Built for better-managed homes.</p>
            <p className="flex items-center gap-1.5"><Check size={13} className="text-[#3d6c50]" /> Built for landlords</p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
