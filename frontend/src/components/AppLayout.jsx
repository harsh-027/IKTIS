import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
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
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `group ${isActive ? 'active' : ''} inline-flex shrink-0 items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm font-medium transition-all px-2.5 sm:px-3 py-1.5 min-h-[44px] min-w-[44px] sm:min-w-0 rounded-full active:scale-[0.98] whitespace-nowrap ${
      isActive
        ? 'bg-ink text-white font-semibold shadow-sm'
        : 'text-ink-muted hover:text-ink hover:bg-canvas-soft'
    }`;

  return (
    <div className="min-h-screen bg-surface flex flex-col text-ink antialiased">
      <header className="bg-canvas/85 backdrop-blur-xl border-b border-border/80 sticky top-0 z-30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div ref={profileMenuRef} className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto sm:shrink-0 min-h-16">
            <NavLink
              to="/"
              className="flex items-center gap-2 font-semibold tracking-tight text-ink min-h-[44px] shrink-0"
            >
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[18px]">domain</span>
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight">IKTIS</span>
            </NavLink>

            <div className="relative flex items-center shrink-0 sm:hidden">
              <button
                onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-ink hover:bg-canvas-soft transition active:scale-[0.98] cursor-pointer"
                aria-label="Open profile menu"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
              >
                <span className="material-symbols-outlined text-[22px] text-ink-muted">account_circle</span>
              </button>
              {isProfileMenuOpen && (
                <ProfileMenu user={user} onSignOut={handleSignOut} />
              )}
            </div>
          </div>

          <nav className="w-full sm:flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 sm:py-1 sm:justify-center border-t border-border/60 sm:border-t-0">
            <NavLink to="/" end className={navLinkClasses}>
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span className="hidden sm:inline group-[.active]:inline">Dashboard</span>
            </NavLink>
            <NavLink to="/properties" className={navLinkClasses}>
              <span className="material-symbols-outlined text-[18px]">apartment</span>
              <span className="hidden sm:inline group-[.active]:inline">Properties</span>
            </NavLink>
            <NavLink to="/tenants" className={navLinkClasses}>
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span className="hidden sm:inline group-[.active]:inline">Tenants</span>
            </NavLink>
            <NavLink to="/rent-charges" className={navLinkClasses}>
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span className="hidden sm:inline group-[.active]:inline">Charges</span>
            </NavLink>
            <NavLink to="/payments" className={navLinkClasses}>
              <span className="material-symbols-outlined text-[18px]">payments</span>
              <span className="hidden sm:inline group-[.active]:inline">Payments</span>
            </NavLink>
            <NavLink to="/reports" className={navLinkClasses}>
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              <span className="hidden sm:inline group-[.active]:inline">Reports</span>
            </NavLink>
          </nav>

          <div className="relative hidden sm:flex items-center shrink-0">
            <button
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-ink hover:bg-canvas-soft transition active:scale-[0.98] cursor-pointer"
              aria-label="Open profile menu"
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
            >
              <span className="material-symbols-outlined text-[22px] text-ink-muted">account_circle</span>
            </button>
            {isProfileMenuOpen && (
              <ProfileMenu user={user} onSignOut={handleSignOut} />
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {children || <Outlet />}
      </main>
    </div>
  );
}

function ProfileMenu({ user, onSignOut }) {
  return (
    <div
      role="menu"
      aria-label="Profile menu"
      className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 rounded-2xl border border-border bg-canvas p-3 shadow-lg"
    >
      <div className="px-2 pb-3 border-b border-border/60">
        <p className="text-sm font-semibold text-ink truncate">{user?.name || 'Landlord'}</p>
        <p className="text-xs text-ink-muted truncate mt-0.5">{user?.email || 'No email available'}</p>
      </div>
      <button
        type="button"
        role="menuitem"
        onClick={onSignOut}
        className="mt-2 w-full inline-flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm font-medium text-ink hover:bg-canvas-soft transition cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px] text-ink-muted">logout</span>
        <span>Sign Out</span>
      </button>
    </div>
  );
}
