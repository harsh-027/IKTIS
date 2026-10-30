import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SettingsPage() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saveState, setSaveState] = useState({ type: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleteState, setDeleteState] = useState({ type: '', message: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSaveState({ type: '', message: '' });
    setIsSaving(true);

    try {
      await updateProfile({ name, email });
      setSaveState({ type: 'success', message: 'Profile details updated.' });
    } catch (error) {
      setSaveState({
        type: 'error',
        message: error.response?.data?.error?.message || 'Unable to update profile details.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deletePhrase !== 'DELETE') return;

    setDeleteState({ type: '', message: '' });
    setIsDeleting(true);
    try {
      await deleteAccount();
      navigate('/landing', { replace: true });
    } catch (error) {
      setDeleteState({
        type: 'error',
        message: error.response?.data?.error?.message || 'Unable to delete your account.',
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Account</p>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink mt-1">Settings</h1>
        <p className="text-sm text-ink-muted mt-1">Manage your profile details and account data.</p>
      </div>

      <section className="bg-canvas rounded-[18px] border border-slate-100 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Profile details</h2>
        <p className="text-sm text-ink-muted mt-1">These details are used for your account and receipts.</p>

        <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="settings-name" className="block text-xs font-semibold text-ink mb-1.5">Name</label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-border bg-canvas text-base sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label htmlFor="settings-email" className="block text-xs font-semibold text-ink mb-1.5">Email address</label>
            <input
              id="settings-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-border bg-canvas text-base sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              autoComplete="email"
              required
            />
          </div>

          {saveState.message && (
            <p className={`text-sm ${saveState.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`} role="status">
              {saveState.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-full bg-primary hover:bg-primary-focus text-white text-sm font-semibold transition disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="bg-canvas rounded-[18px] border border-rose-200 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold text-rose-800">Delete account</h2>
        <p className="text-sm text-rose-700 mt-1 leading-relaxed">
          This permanently deletes your profile and all properties, rooms, tenants, tenancies, rent charges, payments, receipts, and sessions. This cannot be undone.
        </p>

        <div className="mt-5 space-y-3">
          <label htmlFor="delete-account-confirm" className="block text-xs font-semibold text-rose-800">
            Type DELETE to confirm
          </label>
          <input
            id="delete-account-confirm"
            type="text"
            value={deletePhrase}
            onChange={(event) => setDeletePhrase(event.target.value)}
            className="w-full min-h-[44px] px-3.5 rounded-xl border border-rose-200 bg-canvas text-base sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition"
            autoComplete="off"
            aria-describedby="delete-account-warning"
          />
          <p id="delete-account-warning" className="text-xs text-rose-700">
            All account data will be removed from the database.
          </p>

          {deleteState.message && (
            <p className="text-sm text-rose-700" role="alert">{deleteState.message}</p>
          )}

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deletePhrase !== 'DELETE' || isDeleting}
            className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? 'Deleting account...' : 'Delete account permanently'}
          </button>
        </div>
      </section>
    </div>
  );
}
