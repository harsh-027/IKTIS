import React from 'react';
import { Bell, Building2, CalendarClock, Check, ChevronRight, KeyRound, ReceiptText, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import iktisLogo from '../assets/iktis-logo.svg';
import useReducedMotion from '../hooks/useReducedMotion.js';

function Reveal({ children, delay = 0, className = '' }) {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (reduceMotion || !ref.current) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return <div ref={ref} className={`${className} transition-[opacity,transform] duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function HeroBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-screen -translate-x-1/2 overflow-hidden bg-[#0a0a0a]" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,#34404a_0%,#171a1d_45%,#0a0a0a_100%)]" />
      {!reduceMotion && (
        <video
          autoPlay
          muted
          playsInline
          preload="metadata"
          src="/video/hero-background.mp4"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.2)_0%,rgba(10,10,10,0.06)_18%,transparent_34%,transparent_66%,rgba(10,10,10,0.12)_82%,rgba(10,10,10,0.22)_100%)]" />
    </div>
  );
}

function Brand() {
  return <Link to="/" className="flex items-center gap-2.5 text-white" aria-label="IKTIS home"><img src={iktisLogo} alt="" className="h-7 w-7 object-contain" /><span className="font-display text-xl font-medium tracking-tight">iktis</span></Link>;
}

const capabilities = [
  ['01', 'Property overview', 'Keep each property, room and occupancy detail organised in one place.'],
  ['02', 'Rent tracking', 'See what is due, paid and outstanding across your portfolio.'],
  ['03', 'Clear records', 'Keep tenant, payment and receipt information close at hand.'],
];

const pipelineSteps = [
  { icon: Building2, title: 'Add property', subtitle: 'Property record' },
  { icon: UserRound, title: 'Add tenant', subtitle: 'Tenant profile' },
  { icon: CalendarClock, title: 'Rent due', subtitle: 'Charge created' },
];

const pipelineTimeline = [900, 1900, 800, 1900, 800, 1900, 800, 1900, 800, 1900];

function usePipelinePhase(reduceMotion) {
  const [phase, setPhase] = React.useState(reduceMotion ? pipelineTimeline.length : 0);

  React.useEffect(() => {
    if (reduceMotion) {
      setPhase(pipelineTimeline.length);
      return undefined;
    }

    let cancelled = false;
    let timer;
    let nextPhase = 0;
    const advance = () => {
      if (cancelled) return;
      setPhase(nextPhase);
      if (nextPhase >= pipelineTimeline.length) {
        timer = window.setTimeout(() => {
          nextPhase = 0;
          advance();
        }, 1800);
        return;
      }
      timer = window.setTimeout(() => {
        nextPhase += 1;
        advance();
      }, pipelineTimeline[nextPhase]);
    };
    advance();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reduceMotion]);

  return phase;
}

function PipelineNode({ icon: Icon, title, subtitle, state }) {
  return (
    <div className={`pipeline-node ${state === 'active' ? 'is-active' : ''} ${state === 'complete' ? 'is-complete' : ''}`}>
      <div className="pipeline-node-icon"><Icon size={20} strokeWidth={1.8} /></div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-white/90">{title}</p>
        <p className="mt-1 truncate text-[11px] text-white/40">{subtitle}</p>
      </div>
      {state === 'complete' && <span className="pipeline-node-success" aria-label="Complete"><Check size={9} strokeWidth={3} /></span>}
    </div>
  );
}

function PipelineConnector({ state }) {
  const lineState = `${state === 'active' ? 'is-active' : ''} ${state === 'complete' ? 'is-complete' : ''}`;
  return <div className="pipeline-connector" aria-hidden="true"><svg viewBox="0 0 42 2" preserveAspectRatio="none"><line x1="0" y1="1" x2="42" y2="1" pathLength="1" className={`pipeline-svg-line ${lineState}`} /></svg></div>;
}

function PipelineBranch({ entryState, notifyState, dealState }) {
  const lineClass = (state) => `pipeline-svg-line ${state === 'active' ? 'is-active' : ''} ${state === 'complete' ? 'is-complete' : ''}`;
  return (
    <div className="pipeline-branch" aria-hidden="true">
      <svg viewBox="0 0 38 128" preserveAspectRatio="none">
        <path d="M0 64 H8" pathLength="1" className={lineClass(entryState)} />
        <path d="M8 64 C15 64 12 29 24 29 H38" pathLength="1" className={lineClass(notifyState)} />
        <path d="M8 64 C15 64 12 99 24 99 H38" pathLength="1" className={lineClass(dealState)} />
      </svg>
    </div>
  );
}

function PipelineSection() {
  const reduceMotion = useReducedMotion();
  const phase = usePipelinePhase(reduceMotion);
  const nodeState = (index) => (phase > index * 2 + 1 ? 'complete' : phase === index * 2 + 1 ? 'active' : 'idle');
  const connectorState = (index) => (phase > index * 2 + 2 ? 'complete' : phase === index * 2 + 2 ? 'active' : 'idle');
  const entryState = phase >= 8 ? 'complete' : phase >= 6 ? 'active' : 'idle';
  const outputState = phase >= 8 ? 'complete' : phase === 7 ? 'active' : 'idle';
  const notifyState = outputState;
  const dealState = outputState;

  return (
    <section aria-label="IKTIS workflow pipeline" className="relative bg-[#0a0a0a] px-5 py-20 sm:px-8 sm:py-28 md:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="pipeline-frame">
          <div className="pipeline-grid" aria-hidden="true" />
          <div className="pipeline-scroll">
            <div className="pipeline-flow">
              {pipelineSteps.map((step, index) => (
                <React.Fragment key={step.title}>
                  <PipelineNode {...step} state={nodeState(index)} />
                  {index < pipelineSteps.length - 1 && <PipelineConnector state={connectorState(index)} />}
                </React.Fragment>
              ))}

              <PipelineBranch entryState={entryState} notifyState={notifyState} dealState={dealState} />

              <div className="pipeline-outputs">
                <PipelineNode icon={Bell} title="Send reminder" subtitle="Tenant notice" state={notifyState} />
                <PipelineNode icon={ReceiptText} title="Update ledger" subtitle="Payment record" state={dealState} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const lenisOptions = React.useMemo(() => ({
    autoRaf: true,
    lerp: 0.12,
    smoothWheel: true,
    syncTouch: false,
    anchors: true,
  }), []);

  if (reduceMotion) return <LandingExperience />;
  return <ReactLenis root options={lenisOptions}><LandingExperience /></ReactLenis>;
}

function LandingExperience() {
  return (
    <div className="iktis-video-landing relative min-h-screen overflow-clip bg-[#0a0a0a] font-sans text-white selection:bg-white/20">
      <div className="relative z-10">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-black/15 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 md:px-12">
            <nav className="hidden items-center gap-8 text-sm text-white/85 md:flex lg:gap-10" aria-label="Primary navigation">
              <Reveal delay={100}><a href="#capabilities" className="hover:text-white">Rent management</a></Reveal>
            </nav>
            <Reveal><Brand /></Reveal>
            <div className="flex items-center gap-3">
              <Reveal delay={300}><Link to="/login" className="hidden text-sm text-white/85 hover:text-white md:inline">Sign in</Link></Reveal>
              <Reveal delay={400}><Link to="/register" className="rounded-md border border-white bg-white px-4 py-2 text-xs text-black backdrop-blur-md transition-colors duration-300 hover:bg-white/85 sm:px-5 sm:text-sm">Get started</Link></Reveal>
            </div>
          </div>
        </header>

        <main>
          <section className="relative isolate mx-auto flex min-h-screen max-w-[1440px] flex-col justify-between bg-[#0a0a0a] px-5 pb-12 pt-28 sm:px-8 sm:pb-12 sm:pt-32 md:min-h-[100svh] md:px-12 md:pb-16">
            <HeroBackground />
            <div className="relative z-10 flex flex-col justify-between gap-8 sm:flex-row">
              <div className="space-y-2">
                {['PROPERTY MANAGEMENT', 'RENT TRACKING', 'TENANT RECORDS'].map((label, index) => <Reveal key={label} delay={150 + index * 120}><p className="font-mono text-xs uppercase tracking-[0.15em] text-black drop-shadow-none">/ {label}</p></Reveal>)}
              </div>
              <Reveal delay={300} className="max-w-xs sm:text-right"><p className="text-lg leading-relaxed text-black drop-shadow-none sm:text-xl">A clearer way to manage your properties, tenants and rent.</p></Reveal>
            </div>

            <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
              <div>
                <Reveal delay={150}><div className="mb-5 inline-flex border-l-2 border-black bg-white/90 px-3 py-1.5 text-black backdrop-blur-md"><span className="font-mono text-[11px] uppercase tracking-[0.15em]">Property management, made clear</span></div></Reveal>
                <Reveal delay={280}><h1 className="font-display text-5xl font-normal leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">Your home.<br />In your hands.</h1></Reveal>
              </div>
              <Reveal delay={420} className="w-full max-w-sm">
                <div className="flex items-center gap-4 rounded-xl border border-white/15 bg-white/15 p-4 backdrop-blur-md">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/10"><KeyRound size={28} strokeWidth={1.5} /></div>
                  <div className="min-w-0 space-y-1.5 pr-1">
                    <p className="text-sm font-medium text-white">Your rental portfolio</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/65">One considered workspace</p>
                    <Link to="/register" className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-medium text-black transition-colors duration-300 hover:bg-white/85">Create your account <ChevronRight size={14} /></Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          <PipelineSection />

          <section id="capabilities" className="mx-auto flex min-h-screen max-w-[1440px] flex-col justify-between gap-16 px-5 pb-12 pt-28 sm:px-8 sm:pb-12 sm:pt-32 md:min-h-[100svh] md:px-12 md:pb-16">
            <div className="flex flex-col justify-between gap-8 sm:flex-row">
              <Reveal delay={120}><div className="inline-flex border-l-2 border-white bg-white/15 px-3 py-1.5 backdrop-blur-md"><span className="font-mono text-[11px] uppercase tracking-[0.15em]">A clearer view of every home</span></div></Reveal>
              <Reveal delay={220} className="max-w-sm sm:text-right"><p className="text-lg leading-relaxed text-white drop-shadow-md sm:text-xl">Stay on top of the details that keep a rental portfolio running smoothly.</p></Reveal>
            </div>

            <div className="flex flex-1 flex-col justify-end gap-12 md:flex-row md:items-end md:justify-between md:gap-16">
              <div className="max-w-xl">
                <Reveal delay={180}><h2 className="text-5xl font-normal leading-[1.05] tracking-tight drop-shadow-lg sm:text-6xl lg:text-7xl">Manage with<br />more clarity.</h2></Reveal>
                <Reveal delay={320}><p className="mt-6 max-w-md text-sm leading-relaxed text-white/80 drop-shadow-md sm:text-base">From property and tenant details to rent and payments, IKTIS brings the essentials together so you can make each next step with confidence.</p></Reveal>
              </div>

              <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 px-5 backdrop-blur-md sm:px-6">
                {capabilities.map(([number, title, body], index) => <Reveal key={number} delay={300 + index * 110}><article className={`flex gap-5 py-5 ${index < capabilities.length - 1 ? 'border-b border-white/15' : ''}`}><span className="pt-1 font-mono text-[11px] tracking-[0.15em] text-white/55">{number}</span><div className="flex-1"><h3 className="flex items-center justify-between text-base font-medium text-white sm:text-lg">{title}<ChevronRight size={16} className="text-white/40 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-white" /></h3><p className="mt-1.5 text-sm leading-relaxed text-white/70">{body}</p></div></article></Reveal>)}
              </div>
            </div>
          </section>
        </main>

        <footer className="relative z-10 flex flex-col items-start justify-between gap-4 border-t border-white/15 bg-black/20 px-5 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:px-8 md:px-12"><Brand /><div className="flex flex-wrap gap-5"><Link to="/privacy" className="hover:text-white">Privacy</Link><Link to="/terms" className="hover:text-white">Terms</Link><span>© {new Date().getFullYear()} IKTIS</span></div></footer>
      </div>
    </div>
  );
}
