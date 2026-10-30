import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const features = [
  {
    icon: 'apartment',
    eyebrow: 'Property & Rooms',
    title: 'Know every space at a glance.',
    description: 'Keep properties, rooms, availability, and occupancy organised in one dependable place.',
  },
  {
    icon: 'group',
    eyebrow: 'Tenant Management',
    title: 'Keep people and tenancies connected.',
    description: 'Manage tenant details and room assignments with the context you need, when you need it.',
  },
  {
    icon: 'payments',
    eyebrow: 'Rent Tracking',
    title: 'Make every payment count.',
    description: 'Create monthly charges, record full or partial payments, and see what is still outstanding.',
  },
  {
    icon: 'analytics',
    eyebrow: 'Clear Overview',
    title: 'Turn records into confidence.',
    description: 'See collection rates, balances, occupancy, and recent activity in a focused dashboard.',
  },
];

const steps = [
  ['01', 'Add your properties', 'Create properties and rooms so your portfolio reflects the way you actually manage it.'],
  ['02', 'Bring in your tenants', 'Register tenants and connect them to their rooms and active tenancies.'],
  ['03', 'Stay on top of rent', 'Generate charges, record payments, and keep an honest view of every balance.'],
];

function BrandMark() {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white" aria-hidden="true">
      <span className="material-symbols-outlined text-[20px]">domain</span>
    </span>
  );
}

function DashboardPreview() {
  return (
    <div className="landing-preview-shell" aria-label="Preview of the IKTIS dashboard">
      <div className="landing-preview-window">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-sm font-bold tracking-tight text-ink">IKTIS</span>
          </div>
          <span className="hidden text-xs font-medium text-ink-muted sm:inline">Portfolio overview</span>
          <span className="material-symbols-outlined text-[20px] text-ink-muted sm:hidden" aria-hidden="true">more_horiz</span>
        </div>

        <div className="space-y-4 bg-surface-soft/70 p-4 sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-primary">Portfolio overview</p>
              <p className="text-lg font-bold tracking-tight text-ink sm:text-xl">Everything in view.</p>
            </div>
            <span className="rounded-full border border-border bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-muted">October 2026</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['Properties', '12', 'apartment'],
              ['Rooms', '48', 'meeting_room'],
              ['Occupied', '87.5%', 'hotel'],
              ['Collected', '₹2,18,400', 'payments'],
            ].map(([label, value, icon]) => (
              <div key={label} className="rounded-2xl border border-border/80 bg-canvas p-3">
                <span className="material-symbols-outlined mb-3 text-[17px] text-primary" aria-hidden="true">{icon}</span>
                <p className="text-xs font-medium text-ink-muted">{label}</p>
                <p className="mt-0.5 truncate text-sm font-bold tracking-tight text-ink sm:text-base">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.05fr_.95fr]">
            <div className="rounded-2xl border border-border/80 bg-canvas p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink">Monthly financials</p>
                  <p className="mt-1 text-xs text-ink-muted">October 2026</p>
                </div>
                <span className="material-symbols-outlined text-[18px] text-ink-muted" aria-hidden="true">more_horiz</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Rent charged</span>
                  <span className="font-semibold text-ink">₹2,50,000</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Payments collected</span>
                  <span className="font-semibold text-emerald-700">₹2,18,400</span>
                </div>
                <div className="pt-1">
                  <div className="mb-1 flex justify-between text-xs font-medium text-ink-muted">
                    <span>Collection rate</span><span>87.4%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas-soft">
                    <div className="h-full w-[87.4%] rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-canvas p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold text-ink">Recent payments</p>
                <span className="text-[10px] font-medium text-primary">View all</span>
              </div>
              <div className="space-y-3">
                {[
                  ['Aarav Mehta', '₹18,000', 'Paid'],
                  ['Nisha Shah', '₹15,500', 'Paid'],
                  ['Rohan Iyer', '₹12,000', 'Partial'],
                ].map(([name, amount, status]) => (
                  <div key={name} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-xs font-bold text-ink">{name.charAt(0)}</span>
                      <span className="truncate text-xs font-medium text-ink">{name}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-ink">{amount}</p>
                      <p className={`text-xs ${status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>{status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="landing-preview-caption">
        <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">insights</span>
        <span>A calm, current view of your rental operation.</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page min-h-screen bg-surface text-ink">
      <header className="landing-nav">
        <div className="landing-container flex min-h-16 items-center justify-between">
          <Link to="/" className="inline-flex min-h-[44px] items-center gap-2 font-bold tracking-tight text-ink" aria-label="IKTIS home">
            <BrandMark />
            <span className="text-lg">IKTIS</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            <a href="#features-heading" className="landing-nav-link hidden sm:inline-flex">Features</a>
            <a href="#workflow-heading" className="landing-nav-link hidden sm:inline-flex">How it works</a>
            {isAuthenticated ? (
              <Link to="/" className="landing-nav-cta">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="landing-nav-link">Sign In</Link>
                <Link to="/register" className="landing-nav-cta">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-container landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-kicker"><span className="landing-kicker-dot" /> Calm precision for property operators</p>
            <h1>Your properties. <span>Your people.</span> One clear picture.</h1>
            <p className="landing-hero-description">IKTIS helps you manage properties, rooms, tenants, rent payments, and outstanding balances in one simple place.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="landing-primary-button">Get Started <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span></Link>
              <Link to="/login" className="landing-secondary-button">Sign In</Link>
            </div>
            <p className="mt-5 text-xs text-ink-muted"><span className="material-symbols-outlined mr-1 align-[-3px] text-[15px] text-primary" aria-hidden="true">check_circle</span>Built for landlords who prefer clarity over clutter.</p>
          </div>
          <DashboardPreview />
        </section>

        <section className="landing-section border-y border-border/70 bg-canvas-soft/55" aria-labelledby="features-heading">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-kicker">The essentials, together</p>
              <h2 id="features-heading">Less chasing. More knowing.</h2>
              <p>One focused workspace for the parts of property management that need your attention every day.</p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[24px] border border-border/80 bg-border/80 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <article key={feature.eyebrow} className="bg-canvas p-6 sm:p-7">
                  <span className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-canvas-soft text-primary">
                    <span className="material-symbols-outlined text-[26px]" aria-hidden="true">{feature.icon}</span>
                  </span>
                  <p className="text-xs font-bold text-primary">{feature.eyebrow}</p>
                  <h3 className="mt-2 text-lg font-bold tracking-tight text-ink">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="workflow-heading">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-kicker">A simpler rhythm</p>
              <h2 id="workflow-heading">Set it up once. Stay in control.</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3 md:gap-10">
              {steps.map(([number, title, description]) => (
                <article key={number} className="relative border-t border-border pt-5">
                  <p className="text-xs font-bold tracking-[0.12em] text-primary">{number}</p>
                  <h3 className="mt-5 text-xl font-bold tracking-tight text-ink">{title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-ink-muted">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-container pb-20 sm:pb-28" aria-labelledby="cta-heading">
          <div className="landing-final-cta">
            <div>
              <p className="landing-kicker text-blue-200">A clearer way to manage</p>
              <h2 id="cta-heading">Your next clear picture starts here.</h2>
              <p>Bring your properties, people, and payments into one calm workspace.</p>
            </div>
            <Link to="/register" className="landing-light-button">Create your account <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-canvas">
        <div className="landing-container flex flex-col gap-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-bold tracking-tight"><BrandMark /><span>IKTIS</span></div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted" aria-label="Footer navigation">
            <Link to="/privacy" className="hover:text-ink hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-ink hover:underline">Terms of Service</Link>
            <a href="mailto:harshit.work009@gmail.com" className="hover:text-ink hover:underline">Contact & grievances</a>
          </nav>
          <p className="text-xs text-ink-muted">© {new Date().getFullYear()} IKTIS</p>
        </div>
      </footer>
    </div>
  );
}
