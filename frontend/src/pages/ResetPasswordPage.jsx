import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api.js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token: searchParams.get('token') || '', newPassword: password });
      navigate('/login', { state: { message: 'Password reset successfully. Please sign in.' } });
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-[420px] bg-surface-canvas rounded-[24px] border border-border/80 p-6 sm:p-8 shadow-xs">
        <h1 className="text-xl font-bold text-ink">Reset password</h1>
        <p className="text-xs text-ink-muted mt-1 mb-6">Choose a new password for your IKTIS account.</p>
        {error && <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="new-password" className="block text-xs font-bold text-ink-muted uppercase tracking-wider">
            New password
            <div className="relative mt-1.5">
              <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full px-4 pr-12 py-2.5 rounded-full border border-border bg-surface-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] rounded-full text-ink-muted hover:text-ink hover:bg-canvas-soft inline-flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </label>
          <label htmlFor="confirm-password" className="block text-xs font-bold text-ink-muted uppercase tracking-wider">
            Confirm password
            <input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-full border border-border bg-surface-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary" />
          </label>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-full bg-primary text-white text-sm font-bold disabled:opacity-60">
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
        <Link to="/login" className="block mt-5 text-center text-xs font-semibold text-primary hover:underline">Back to Sign In</Link>
      </div>
    </div>
  );
}
