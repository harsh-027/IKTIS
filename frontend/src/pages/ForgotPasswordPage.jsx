import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const response = await authApi.forgotPassword({ email });
      setMessage(response.data.data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to process the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-[420px] bg-surface-canvas rounded-[24px] border border-border/80 p-6 sm:p-8 shadow-xs">
        <h1 className="text-xl font-bold text-ink">Forgot password?</h1>
        <p className="text-xs text-ink-muted mt-1 mb-6">
          Enter your email and we will send recovery instructions if an account exists.
        </p>
        {error && <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">{error}</div>}
        {message && <div role="status" className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="reset-email" className="block text-xs font-bold text-ink-muted uppercase tracking-wider">
            Email address
            <input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-full border border-border bg-surface-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary" />
          </label>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-full bg-primary text-white text-sm font-bold disabled:opacity-60">
            {isSubmitting ? 'Sending...' : 'Send recovery link'}
          </button>
        </form>
        <Link to="/login" className="block mt-5 text-center text-xs font-semibold text-primary hover:underline">Back to Sign In</Link>
      </div>
    </div>
  );
}
