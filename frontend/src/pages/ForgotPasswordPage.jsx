import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api.js';
import AuthShell from '../components/AuthShell.jsx';

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
    <AuthShell
      title="Recover your password"
      description="Enter your email and we will send recovery instructions if an account exists."
      footer={<Link to="/login" className="text-sm font-medium text-primary hover:underline">Back to sign in</Link>}
    >
      {error && <div role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
      {message && <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <label htmlFor="reset-email" className="block text-sm font-medium text-ink">
          Email address
          <input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </label>
        <button type="submit" disabled={isSubmitting} className="min-h-11 w-full rounded-lg bg-tertiary-fixed-dim py-3 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-tertiary-fixed disabled:opacity-60">
          {isSubmitting ? 'Sending...' : 'Send recovery link'}
        </button>
      </form>
    </AuthShell>
  );
}
