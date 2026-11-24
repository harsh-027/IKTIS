import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icons8Icon from '../components/Icons8Icon.jsx';

const screens = [
  {
    eyebrow: 'PROPERTY MANAGEMENT',
    title: 'Your Properties, All in One Place.',
    description: 'Manage all your rental properties from one simple dashboard.',
    visual: 'properties',
  },
  {
    eyebrow: 'TENANT MANAGEMENT',
    title: 'Stay Connected with Your Tenants.',
    description: 'Keep tenant details, room assignments and rental information organised.',
    visual: 'tenants',
  },
  {
    eyebrow: 'RENT & PAYMENTS',
    title: 'Rent Management Made Simple.',
    description: 'Track rent payments, manage outstanding dues and generate receipts effortlessly.',
    visual: 'payments',
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const scrollerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback((index) => {
    const nextIndex = Math.min(screens.length - 1, Math.max(0, index));
    scrollerRef.current?.scrollTo({
      left: nextIndex * scrollerRef.current.clientWidth,
      behavior: 'smooth',
    });
    setActiveIndex(nextIndex);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    const handleScroll = () => {
      const index = Math.round(scroller.scrollLeft / scroller.clientWidth);
      setActiveIndex(Math.min(screens.length - 1, Math.max(0, index)));
    };
    scroller.addEventListener('scroll', handleScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="onboarding-shell min-h-screen bg-[#f7f3ec] text-[#172331]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-6 pt-6 sm:px-7">
        <header className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <img src="/icons.svg" alt="" aria-hidden="true" className="h-8 w-8 object-contain" />
            <span className="font-display text-xl font-medium tracking-tight">IKTIS</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-full px-3 py-2 text-xs font-semibold text-[#59636c] transition hover:bg-white"
          >
            Skip
          </button>
        </header>

        <div
          ref={scrollerRef}
          className="onboarding-scroller mt-5 flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth"
          aria-label="IKTIS onboarding"
        >
          {screens.map((screen) => (
            <section key={screen.visual} className="flex w-full shrink-0 snap-center flex-col" aria-label={screen.title}>
              <OnboardingVisual type={screen.visual} />
              <div className="px-1 pt-7">
                <p className="text-[10px] font-bold tracking-[0.18em] text-[#d7793e]">{screen.eyebrow}</p>
                <h1 className="mt-3 max-w-[340px] font-display text-[2.25rem] font-medium leading-[1.08] tracking-[-0.045em] text-[#172331]">
                  {screen.title}
                </h1>
                <p className="mt-4 max-w-[330px] text-[15px] leading-6 text-[#69727a]">{screen.description}</p>
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-5 flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-1.5" aria-label={`Screen ${activeIndex + 1} of ${screens.length}`}>
            {screens.map((screen, index) => (
              <button
                key={screen.visual}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Go to screen ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-[#e38a4c]' : 'w-1.5 bg-[#d5cfc5]'}`}
              />
            ))}
          </div>
          {activeIndex < screens.length - 1 ? (
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#ffad69] px-6 text-sm font-bold text-[#172331] shadow-[0_10px_24px_rgba(214,126,61,0.18)] transition hover:bg-[#ffa15a] active:scale-[0.98]"
            >
              Next
              <Icons8Icon icon="arrow_forward" className="text-[17px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#ffad69] px-6 text-sm font-bold text-[#172331] shadow-[0_10px_24px_rgba(214,126,61,0.18)] transition hover:bg-[#ffa15a] active:scale-[0.98]"
            >
              Get Started
              <Icons8Icon icon="arrow_forward" className="text-[17px]" />
            </button>
          )}
        </footer>
      </div>
    </main>
  );
}

function OnboardingVisual({ type }) {
  if (type === 'properties') {
    return (
      <div className="onboarding-visual relative h-[300px] overflow-hidden rounded-[30px] bg-[#dcecf0] p-4 shadow-[0_14px_40px_rgba(73,84,83,0.12)]">
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#b8dbe1]" />
        <div className="relative h-full rounded-[22px] bg-white p-4 shadow-sm">
          <VisualHeader label="Properties" icon="apartment" />
          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f8f4ed] p-3">
            <div><p className="text-[9px] uppercase tracking-wider text-[#8b9295]">Portfolio</p><p className="mt-1 text-xl font-bold">3 properties</p></div>
            <div className="rounded-xl bg-[#ffad69] p-2.5"><Icons8Icon icon="building" className="text-[22px]" /></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MiniProperty name="Green View" rooms="12 rooms" color="bg-[#d9eee9]" />
            <MiniProperty name="Sunrise Homes" rooms="8 rooms" color="bg-[#f7e2c9]" />
          </div>
          <div className="absolute -bottom-5 left-6 right-6 h-10 rounded-xl bg-[#172331] opacity-90" />
        </div>
      </div>
    );
  }

  if (type === 'tenants') {
    return (
      <div className="onboarding-visual relative h-[300px] overflow-hidden rounded-[30px] bg-[#f2e6d9] p-4 shadow-[0_14px_40px_rgba(73,84,83,0.12)]">
        <div className="absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-[#f6c795]" />
        <div className="relative h-full rounded-[22px] bg-white p-4 shadow-sm">
          <VisualHeader label="Tenants" icon="user_group" />
          <div className="mt-4 flex items-center justify-between"><p className="text-lg font-bold">Your tenants</p><span className="rounded-full bg-[#eef6f4] px-2 py-1 text-[9px] font-bold text-[#378173]">6 active</span></div>
          <div className="mt-3 space-y-2"><MiniTenant name="Ananya Sharma" room="Room 204 · Green View" initials="AS" /><MiniTenant name="Rohan Mehta" room="Room 101 · Sunrise Homes" initials="RM" /><MiniTenant name="Priya Nair" room="Room 302 · Green View" initials="PN" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-visual relative h-[300px] overflow-hidden rounded-[30px] bg-[#e7e1f0] p-4 shadow-[0_14px_40px_rgba(73,84,83,0.12)]">
      <div className="absolute -right-10 bottom-0 h-44 w-44 rounded-full bg-[#cfc0e5]" />
      <div className="relative h-full rounded-[22px] bg-white p-4 shadow-sm">
        <VisualHeader label="Rent & Collections" icon="transaction" />
        <div className="mt-4 grid grid-cols-2 gap-2"><MiniMetric label="Collected" value="₹48,000" color="bg-[#e1f1e8]" /><MiniMetric label="Outstanding" value="₹12,500" color="bg-[#fff0db]" /></div>
        <div className="mt-3 rounded-xl border border-[#edf0f1] p-3"><div className="flex items-center justify-between"><p className="text-[10px] font-bold">November 2026</p><span className="text-[9px] text-[#d7793e]">62% collected</span></div><div className="mt-3 h-2 rounded-full bg-[#eef0f1]"><div className="h-full w-[62%] rounded-full bg-[#ffad69]" /></div><div className="mt-3 flex items-center gap-2 text-[9px] text-[#7a8287]"><Icons8Icon icon="receipt" className="text-[15px]" /> Receipts ready to generate</div></div>
      </div>
    </div>
  );
}

function VisualHeader({ label, icon }) {
  return <div className="flex items-center gap-2 border-b border-[#edf0f1] pb-3"><div className="rounded-lg bg-[#fff0df] p-1.5"><Icons8Icon icon={icon} className="text-[17px]" /></div><span className="text-xs font-bold">IKTIS <span className="font-normal text-[#92999d]">/ {label}</span></span></div>;
}

function MiniProperty({ name, rooms, color }) {
  return <div className="rounded-xl border border-[#edf0f1] p-2.5"><div className={`h-12 rounded-lg ${color}`} /><p className="mt-2 truncate text-[10px] font-bold">{name}</p><p className="mt-0.5 text-[9px] text-[#8b9295]">{rooms}</p></div>;
}

function MiniTenant({ name, room, initials }) {
  return <div className="flex items-center gap-2 rounded-xl bg-[#f8faf9] p-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8ebe5] text-[9px] font-bold text-[#31776b]">{initials}</div><div className="min-w-0"><p className="truncate text-[10px] font-bold">{name}</p><p className="truncate text-[9px] text-[#8b9295]">{room}</p></div><Icons8Icon icon="arrow_forward" className="ml-auto text-[14px] text-[#a1a8ab]" /></div>;
}

function MiniMetric({ label, value, color }) {
  return <div className={`rounded-xl ${color} p-3`}><p className="text-[9px] text-[#69727a]">{label}</p><p className="mt-1 text-base font-bold">{value}</p></div>;
}
