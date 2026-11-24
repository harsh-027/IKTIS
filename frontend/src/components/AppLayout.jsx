import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icons8Icon from './Icons8Icon.jsx';
import { isTrustedWebActivity } from '../lib/environment.js';

const primaryNavigation = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/properties', label: 'Properties', icon: 'apartment' },
  { to: '/tenants', label: 'Tenants', icon: 'user_group' },
  { to: '/payments', label: 'Payments', icon: 'transaction' },
];

const secondaryNavigation = [
  { to: '/reports', label: 'Reports', icon: 'graph_report' },
];

const profileNavigation = [
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

function NavigationLink({ item, mobile = false }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => (
        mobile
          ? `group inline-flex min-h-10 items-center justify-center rounded-full transition-colors ${isActive
            ? 'min-w-[112px] gap-2 bg-primary px-4 text-xs text-white'
            : 'min-w-10 px-2 text-secondary hover:bg-surface-soft'}`
          : `desktop-nav-link group inline-flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${isActive
            ? 'is-active w-[calc(100%+1rem)] bg-primary-container text-white'
            : 'text-ink-muted hover:bg-surface-soft hover:text-ink'}`
      )}
    >
      {({ isActive }) => (
        <>
          <Icons8Icon icon={item.icon} className="text-[20px]" />
          <span className={mobile && !isActive ? 'sr-only' : ''}>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const desktopAccountRef = useRef(null);
  const mobileAccountRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        !desktopAccountRef.current?.contains(event.target)
        && !mobileAccountRef.current?.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsProfileMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    await logout();
    navigate(isTrustedWebActivity() ? '/' : '/login');
  };

  return (
    <div className="min-h-screen bg-surface text-ink antialiased">
      <header className="sticky top-0 z-30 hidden border-b border-border/60 bg-surface/95 lg:block">
        <div className="mx-auto flex min-h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="inline-flex min-h-11 shrink-0 items-center gap-2" aria-label="IKTIS dashboard">
            <img src="/icons.svg" alt="" aria-hidden="true" className="h-8 w-8 object-contain" />
            <span className="font-display text-lg font-medium tracking-tight">IKTIS</span>
          </NavLink>

          <div ref={desktopAccountRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink"
              aria-label="Open account menu"
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
            >
              <Icons8Icon icon="profile" className="text-[24px]" />
            </button>
            {isProfileMenuOpen && (
              <ProfileMenu user={user} onSignOut={handleSignOut} />
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px]">
        <aside className="hidden w-60 shrink-0 border-r border-border/60 px-4 py-6 lg:relative lg:z-20 lg:block">
          <p className="mb-2 px-3 text-xs font-medium text-ink-muted">Navigation</p>
          <nav className="space-y-1" aria-label="Primary">
            {primaryNavigation.map((item) => <NavigationLink key={item.to} item={item} />)}
          </nav>
          <p className="mb-2 mt-8 px-3 text-xs font-medium text-ink-muted">More</p>
          <nav className="space-y-1" aria-label="Secondary">
            {secondaryNavigation.map((item) => <NavigationLink key={item.to} item={item} />)}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-7 lg:relative lg:z-10 lg:px-8 lg:pb-10">
          {children || <Outlet />}
        </main>
      </div>

      <nav
        className="mobile-bottom-nav fixed inset-x-4 bottom-4 z-30 flex items-center justify-between gap-1 rounded-full border border-border/60 bg-white px-2 py-2 shadow-[0_8px_24px_-4px_rgba(27,38,50,0.08)] lg:hidden"
        aria-label="Primary mobile"
      >
        {primaryNavigation.map((item) => <NavigationLink key={item.to} item={item} mobile />)}
        <div ref={mobileAccountRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-soft"
            aria-label="Open account menu"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="menu"
          >
            <Icons8Icon icon="profile" className="text-[20px]" />
          </button>
          {isProfileMenuOpen && <ProfileMenu user={user} onSignOut={handleSignOut} mobile />}
        </div>
      </nav>
    </div>
  );
}

function ProfileMenu({ user, onSignOut, mobile = false }) {
  return (
    <div
      role="menu"
      aria-label="Account menu"
      className={`absolute right-0 z-40 w-64 rounded-xl border border-border bg-white p-3 shadow-lg ${mobile ? 'bottom-[calc(100%+8px)] top-auto' : 'top-[calc(100%+8px)]'}`}
    >
      <div className="border-b border-border/60 px-2 pb-3">
        <p className="truncate text-sm font-medium text-ink">{user?.name || 'Landlord'}</p>
        <p className="mt-0.5 truncate text-xs text-ink-muted">{user?.email || 'No email available'}</p>
      </div>
      <div className="mt-2 space-y-1">
        {profileNavigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            role="menuitem"
            className="inline-flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-soft"
          >
            <Icons8Icon icon={item.icon} className="text-[20px] text-ink-muted" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          role="menuitem"
          onClick={onSignOut}
          className="inline-flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-soft"
        >
            <Icons8Icon icon="logout" className="text-[18px] text-ink-muted" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
