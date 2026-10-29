import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      const serverMessage = err.response?.data?.error?.message;
      setError(serverMessage || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col justify-center items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white shadow-md mb-3">
            <span className="material-symbols-outlined text-[30px]">domain</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink font-heading">
            IKTIS
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 font-medium">
            Calm Precision Landlord Rental Management
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface-canvas rounded-[24px] border border-border/80 p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-ink">
              Sign In
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Enter your credentials to access your landlord dashboard
            </p>
          </div>

          {location.state?.message && (
            <div role="status" className="mb-5 p-3.5 rounded-[14px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm">
              {location.state.message}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm leading-snug flex items-start gap-2.5"
            >
              <span className="material-symbols-outlined text-[18px] text-rose-600 mt-0.5 shrink-0">
                error
              </span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-ink-muted pointer-events-none">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="landlord@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-surface-canvas text-ink text-sm placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-ink-muted pointer-events-none">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 rounded-full border border-border bg-surface-canvas text-ink text-sm placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] rounded-full text-ink-muted hover:text-ink hover:bg-canvas-soft inline-flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 px-4 rounded-full bg-primary hover:bg-primary-focus text-white text-sm font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <p className="text-xs text-ink-muted">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-primary hover:underline ml-1"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Security watermark footer */}
        <p className="text-center text-[11px] text-ink-muted/70 mt-6 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">shield</span>
          <span>Encrypted session & strict multi-tenant tenant isolation</span>
        </p>
        <nav aria-label="Legal" className="text-center text-xs text-ink-muted mt-3">
          <Link to="/privacy" className="hover:text-ink hover:underline">Privacy Policy</Link>
          <span className="mx-2" aria-hidden="true">·</span>
          <Link to="/terms" className="hover:text-ink hover:underline">Terms of Service</Link>
        </nav>
      </div>
    </div>
  );
}
