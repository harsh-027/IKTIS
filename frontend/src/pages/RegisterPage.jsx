import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ name, email, password, termsAccepted, privacyPolicyAccepted });
      navigate('/');
    } catch (err) {
      const serverMessage = err.response?.data?.error?.message;
      const details = err.response?.data?.error?.details;
      if (details && details.length > 0) {
        setError(details.map((d) => d.message).join(' '));
      } else {
        setError(serverMessage || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col justify-center items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-[440px]">
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

        {/* Card */}
        <div className="bg-surface-canvas rounded-[24px] border border-border/80 p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-ink">
              Create Landlord Account
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Start managing properties, tenancies, and collections with precision
            </p>
          </div>

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
                htmlFor="name"
                className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-ink-muted pointer-events-none">
                  person
                </span>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-surface-canvas text-ink text-sm placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] transition"
                />
              </div>
            </div>

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
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-surface-canvas text-ink text-sm placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-ink-muted pointer-events-none">
                  verified_user
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-surface-canvas text-ink text-sm placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] transition"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs text-ink-muted">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={privacyPolicyAccepted}
                  onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  I acknowledge the <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 px-4 rounded-full bg-primary hover:bg-primary-focus text-white text-sm font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <p className="text-xs text-ink-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-primary hover:underline ml-1"
              >
                Sign In
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
