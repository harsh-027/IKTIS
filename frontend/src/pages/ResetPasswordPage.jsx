import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api.js';
import AuthShell from '../components/AuthShell.jsx';

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
    <AuthShell
      title="Set a new password"
      description="Choose a new password for your IKTIS account."
      footer={<Link to="/login" className="text-sm font-medium text-primary hover:underline">Back to sign in</Link>}
    >
      {error && <div role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <label htmlFor="new-password" className="block text-sm font-medium text-ink">
          New password
          <div className="relative mt-1.5">
            <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full rounded-lg border border-border bg-white px-4 py-2.5 pr-12 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-soft hover:text-ink">
<span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </label>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-ink">
          Confirm password
          <input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </label>
        <button type="submit" disabled={isSubmitting} className="min-h-11 w-full rounded-lg bg-tertiary-fixed-dim py-3 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-tertiary-fixed disabled:opacity-60">
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  );
}
