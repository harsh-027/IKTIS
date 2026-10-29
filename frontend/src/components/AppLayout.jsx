import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-all px-2.5 sm:px-3 py-1.5 min-h-[40px] rounded-full active:scale-[0.98] ${
      isActive
        ? 'bg-ink text-white font-semibold shadow-sm'
        : 'text-ink-muted hover:text-ink hover:bg-canvas-soft'
    }`;

  return (
    <div className="min-h-screen bg-surface flex flex-col text-ink antialiased">
      {/* Top Header */}
      <header className="bg-canvas/85 backdrop-blur-xl border-b border-border/80 sticky top-0 z-30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            {/* Brand Logo & Name */}
            <NavLink
              to="/"
              className="flex items-center gap-2 font-semibold tracking-tight text-ink min-h-[44px] shrink-0"
            >
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[18px]">domain</span>
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight">IKTIS</span>
            </NavLink>

            {/* Main Navigation with Icons */}
            <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-x-auto no-scrollbar py-1">
              <NavLink to="/" end className={navLinkClasses}>
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/properties" className={navLinkClasses}>
                <span className="material-symbols-outlined text-[18px]">apartment</span>
                <span>Properties</span>
              </NavLink>
              <NavLink to="/tenants" className={navLinkClasses}>
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span>Tenants</span>
              </NavLink>
              <NavLink to="/rent-charges" className={navLinkClasses}>
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Charges</span>
              </NavLink>
              <NavLink to="/payments" className={navLinkClasses}>
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span>Payments</span>
              </NavLink>
              <NavLink to="/reports" className={navLinkClasses}>
                <span className="material-symbols-outlined text-[18px]">analytics</span>
                <span>Reports</span>
              </NavLink>
            </nav>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-ink leading-tight truncate max-w-[150px]">
                {user?.name || 'Landlord'}
              </p>
              <p className="text-[11px] text-ink-muted leading-tight truncate max-w-[150px]">
                {user?.email}
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition active:scale-[0.98] cursor-pointer shrink-0 shadow-sm"
              aria-label="Sign out"
              title="Sign out of account"
            >
              <span className="material-symbols-outlined text-[16px] text-ink-muted">logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Outlet />
      </main>

    </div>
  );
}
