import React from 'react';
import { ArrowRight, BarChart3, Building2, CheckCircle2, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import iktisLogo from '../assets/iktis-logo.svg';

const features = [
  { icon: Building2, title: 'Organise every property', description: 'Keep properties, rooms and occupancy details together in one clear workspace.' },
  { icon: ClipboardList, title: 'Stay on top of rent', description: 'Track charges, payments and outstanding balances without scattered spreadsheets.' },
  { icon: BarChart3, title: 'Understand your portfolio', description: 'See the numbers that matter and make confident decisions for every home you manage.' },
];

function Brand({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="IKTIS home">
      <img src={iktisLogo} alt="" aria-hidden="true" className={compact ? 'h-8 w-8' : 'h-9 w-9'} />
      <span className="text-base font-semibold tracking-[0.12em] text-slate-950">IKTIS</span>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f4] text-slate-950">
      <header className="border-b border-slate-200/80 bg-[#f7f7f4]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Brand />
          <nav className="flex items-center gap-4 text-sm sm:gap-7" aria-label="Primary navigation">
            <a href="#features" className="hidden text-slate-600 transition-colors hover:text-slate-950 sm:inline">Features</a>
            <Link to="/login" className="text-slate-600 transition-colors hover:text-slate-950">Sign in</Link>
            <Link to="/register" className="inline-flex items-center rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white transition-colors hover:bg-slate-800">Get started</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
          <div className="max-w-3xl">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Property management, made clear</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-6xl">Run your rental portfolio with confidence.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">IKTIS gives landlords one simple place to manage properties, rooms, tenants, rent and payments.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800">Get started <ArrowRight size={16} /></Link>
              <Link to="/login" className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950">Sign in to IKTIS</Link>
            </div>
          </div>
          <div className="mt-16 grid gap-4 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:mt-20 sm:grid-cols-3 sm:gap-8">
            {['One workspace for every property', 'Clear rent and payment tracking', 'Built for independent landlords'].map((item) => (
              <div key={item} className="flex items-start gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-slate-700" /><span>{item}</span></div>
            ))}
          </div>
        </section>

        <section id="features" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Everything in one place</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">A calmer way to manage homes.</h2>
              <p className="mt-4 leading-7 text-slate-600">Less time searching for information. More time making your properties work better.</p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-xl border border-slate-200 bg-[#fbfbfa] p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Icon size={20} strokeWidth={1.8} /></div>
                  <h3 className="mt-6 text-lg font-semibold text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Brand compact />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2"><Link to="/privacy" className="hover:text-slate-950">Privacy</Link><Link to="/terms" className="hover:text-slate-950">Terms</Link><a href="mailto:hello@iktis.app" className="hover:text-slate-950">Contact</a><span>© {new Date().getFullYear()} IKTIS</span></div>
      </footer>
    </div>
  );
}
