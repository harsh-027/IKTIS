import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi } from '../services/api.js';
import Dialog from './Dialog.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const closePasswordForm = () => {
    if (isChangingPassword) return;
    setIsPasswordFormOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess('Password changed successfully. Other active sessions were signed out.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const details = error.response?.data?.error?.details;
      setPasswordError(
        details?.length
          ? details.map((detail) => detail.message).join(' ')
          : error.response?.data?.error?.message || 'Unable to change password.'
      );
    } finally {
      setIsChangingPassword(false);
    }
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
              onClick={() => {
                setPasswordSuccess('');
                setPasswordError('');
                setIsPasswordFormOpen(true);
              }}
              className="inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition active:scale-[0.98] cursor-pointer shrink-0 shadow-sm"
              aria-label="Change password"
              title="Change account password"
            >
              <span className="material-symbols-outlined text-[16px] text-ink-muted">key</span>
              <span className="hidden sm:inline">Password</span>
            </button>

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

      {isPasswordFormOpen && (
        <Dialog title="Change password" onClose={closePasswordForm}>
          <p className="text-xs text-ink-muted -mt-2 mb-5">
            Changing your password signs out other active sessions.
          </p>

          {passwordError && (
            <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
              <label className="block text-xs font-semibold text-ink">
                Current password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block text-xs font-semibold text-ink">
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block text-xs font-semibold text-ink">
                Confirm new password
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full min-h-[44px] rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-focus disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChangingPassword ? 'Changing password...' : 'Change password'}
              </button>
          </form>
        </Dialog>
      )}
    </div>
  );
}
