import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { tenantApi } from '../services/api.js';

// ─── Calm Precision Modal ──────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={handleBackdrop}
    >
      <div className="bg-canvas rounded-[18px] border border-border shadow-2xl w-full max-w-md p-5 sm:p-6 max-h-[90dvh] flex flex-col my-auto">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-ink-muted hover:text-ink transition text-base leading-none rounded-full min-h-[40px] min-w-[40px] inline-flex items-center justify-center hover:bg-canvas-soft cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Tenant Form ─────────────────────────────────────────────────────────────
function TenantForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [fullName, setFullName] = useState(initial.fullName || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [email, setEmail] = useState(initial.email || '');
  const [notes, setNotes] = useState(initial.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    try {
      await onSubmit({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to save tenant.';
      setError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="tenant-name" className="block text-xs font-semibold text-ink-muted mb-1">
          Full Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="tenant-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Rahul Sharma"
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          disabled={loading}
          maxLength={191}
          required
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="tenant-phone" className="block text-xs font-semibold text-ink-muted mb-1">
          Phone Number
        </label>
        <input
          id="tenant-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +91 98765 43210"
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          disabled={loading}
          maxLength={30}
        />
      </div>

      <div>
        <label htmlFor="tenant-email" className="block text-xs font-semibold text-ink-muted mb-1">
          Email Address
        </label>
        <input
          id="tenant-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. rahul.sharma@example.com"
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          disabled={loading}
          maxLength={191}
        />
      </div>

      <div>
        <label htmlFor="tenant-notes" className="block text-xs font-semibold text-ink-muted mb-1">
          Notes / Identification
        </label>
        <textarea
          id="tenant-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Aadhaar verified, lease requirements, emergency contact..."
          rows={3}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer"
        >
          {loading ? 'Saving...' : initial.id ? 'Save Changes' : 'Create Tenant'}
        </button>
      </div>
    </form>
  );
}

// ─── Main TenantsPage ────────────────────────────────────────────────────────
export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'unassigned', 'archived'
  const [includeArchived, setIncludeArchived] = useState(false);

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [archiveError, setArchiveError] = useState('');

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tenantApi.list({
        includeArchived: true,
        search: search.trim() || undefined,
      });
      setTenants(res.data?.data?.tenants || []);
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to load tenants.'
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreate = async (formData) => {
    setActionLoading(true);
    try {
      await tenantApi.create(formData);
      setCreateOpen(false);
      await fetchTenants();
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    if (!editTenant) return;
    setActionLoading(true);
    try {
      await tenantApi.update(editTenant.id, formData);
      setEditTenant(null);
      await fetchTenants();
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    setActionLoading(true);
    setArchiveError('');
    try {
      await tenantApi.archive(archiveTarget.id);
      setArchiveTarget(null);
      await fetchTenants();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to archive tenant.';
      setArchiveError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered tenants based on category pill
  const filteredTenants = tenants.filter((t) => {
    const isArchived = !!t.archivedAt;
    const hasRoom = !!t.currentTenancy;

    if (statusFilter === 'archived') {
      if (!isArchived) return false;
    } else if (statusFilter === 'active') {
      if (isArchived || !hasRoom) return false;
    } else if (statusFilter === 'unassigned') {
      if (isArchived || hasRoom) return false;
    } else {
      // 'all'
      if (isArchived && !includeArchived) return false;
    }
    return true;
  });

  const totalTenantsCount = tenants.filter(t => !t.archivedAt).length;
  const activeLeaseCount = tenants.filter(t => !t.archivedAt && t.currentTenancy).length;
  const unassignedCount = tenants.filter(t => !t.archivedAt && !t.currentTenancy).length;

  return (
    <div className="space-y-5 pb-8">
      {/* ─── Page Header & Quick Action ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
            Tenants &amp; Occupants
          </h1>
          <p className="text-xs text-ink-muted">
            Manage resident profiles, contact records, and active tenancy assignments
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary-focus text-white text-xs sm:text-sm font-semibold transition active:scale-[0.98] shadow-sm min-h-[40px] cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>New Tenant</span>
        </button>
      </div>

      {/* ─── Bento Overview Metric Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-canvas rounded-[18px] border border-slate-100 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Registered Tenants
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight tabular-nums">
            {loading ? '—' : totalTenantsCount}
          </div>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            Active resident profiles
          </span>
        </div>

        <div className="bg-canvas rounded-[18px] border border-slate-100 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Active Room Leases
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight tabular-nums">
            {loading ? '—' : activeLeaseCount}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
            Occupying unit rooms
          </span>
        </div>

        <div className="bg-canvas rounded-[18px] border border-slate-100 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Awaiting Assignment
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight tabular-nums">
            {loading ? '—' : unassignedCount}
          </div>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            Ready to be assigned to room
          </span>
        </div>
      </div>

      {/* ─── Search & Status Segmented Filters ─────────────────────────── */}
      <div className="space-y-2">
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3.5 text-ink-muted text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by full name, phone number, or email..."
            className="w-full h-11 pl-10 pr-24 rounded-full bg-canvas text-ink text-xs sm:text-sm border border-border shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            aria-label="Search tenants"
          />
          <span className="absolute right-3 text-[11px] font-medium text-ink-muted bg-canvas-soft px-2.5 py-1 rounded-full border border-border">
            {filteredTenants.length} total
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
              }`}
            >
              <span>All Tenants</span>
              <span className="text-[11px] opacity-75">({totalTenantsCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
              }`}
            >
              <span>Active Leases</span>
              <span className="text-[11px] opacity-75">({activeLeaseCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('unassigned')}
              className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
                statusFilter === 'unassigned'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
              }`}
            >
              <span>Unassigned</span>
              <span className="text-[11px] opacity-75">({unassignedCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
                statusFilter === 'archived'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
              }`}
            >
              <span>Archived</span>
            </button>
          </div>

          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted cursor-pointer select-none px-2 py-1 min-h-[36px] shrink-0 bg-canvas rounded-full border border-border">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/30 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Show archived in &apos;All&apos;</span>
          </label>
        </div>
      </div>

      {/* ─── Tenants List ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-canvas rounded-[18px] border border-slate-100 p-8 text-center text-ink-muted shadow-sm">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading tenant records...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="bg-canvas rounded-[18px] border border-slate-100 p-8 sm:p-12 text-center shadow-sm space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-canvas-soft flex items-center justify-center mx-auto mb-2 text-ink-muted">
            <span className="material-symbols-outlined text-[28px]">group</span>
          </div>
          <p className="text-sm font-semibold text-ink">No tenants found</p>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            {search
              ? 'No tenants match your search filter. Try clearing your query.'
              : 'Add your first tenant to begin assigning rooms and managing tenancies.'}
          </p>
          {!search && (
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-full shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Create First Tenant</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredTenants.map((tenant) => {
            const isArchived = !!tenant.archivedAt;
            const current = tenant.currentTenancy;
            const initials = tenant.fullName
              ? tenant.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
              : 'TN';

            return (
              <div
                key={tenant.id}
                className={`bg-canvas rounded-[18px] border border-slate-100 p-4 sm:p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between gap-3 relative overflow-hidden ${
                  isArchived ? 'opacity-70 bg-canvas-soft/40' : ''
                }`}
              >
                <div>
                  {/* Top Bar: Avatar, Name & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-canvas">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/tenants/${tenant.id}`}
                          className="text-base font-bold text-ink hover:text-primary transition truncate block"
                        >
                          {tenant.fullName}
                        </Link>
                        <span className="text-[11px] text-ink-muted">ID: {tenant.id.slice(0, 8)}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isArchived ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-badge-partial-bg text-badge-partial-text border border-badge-partial-border">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          <span>Archived</span>
                        </span>
                      ) : current ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-badge-paid-bg text-badge-paid-text border border-badge-paid-border">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>Active Lease</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-canvas-soft text-ink-muted border border-border">
                          <span>Unassigned</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Room Badge or Status */}
                  <div className="my-2.5">
                    {current ? (
                      <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/60 text-xs text-primary flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="material-symbols-outlined text-[16px] shrink-0">apartment</span>
                          <span className="font-semibold truncate">
                            {current.roomLabel} • {current.propertyName}
                          </span>
                        </div>
                        <span className="font-bold text-ink shrink-0 tabular-nums">
                          ₹{current.agreedRent?.toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-canvas-soft rounded-xl border border-slate-100 text-xs text-ink-muted flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">door_front</span>
                        <span>{isArchived ? 'Profile archived' : 'Not currently assigned to any room'}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-1 text-xs text-ink-muted border-t border-border/50 pt-2.5">
                    {tenant.phone && (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="material-symbols-outlined text-[15px] text-ink-muted">call</span>
                        <a href={`tel:${tenant.phone}`} className="hover:text-primary transition font-mono">
                          {tenant.phone}
                        </a>
                      </div>
                    )}
                    {tenant.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="material-symbols-outlined text-[15px] text-ink-muted">mail</span>
                        <a href={`mailto:${tenant.email}`} className="hover:text-primary transition truncate">
                          {tenant.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center gap-2 pt-2.5 border-t border-border/50">
                  <Link
                    to={`/tenants/${tenant.id}`}
                    className="flex-1 text-center bg-canvas-soft hover:bg-surface-container text-ink rounded-full py-1.5 text-xs font-semibold transition active:scale-[0.98] min-h-[38px] inline-flex items-center justify-center gap-1"
                  >
                    <span>Manage Tenancy</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </Link>

                  {!isArchived && (
                    <>
                      <Link
                        to={`/tenants/${tenant.id}?assign=1`}
                        aria-label={`Assign Room to ${tenant.fullName}`}
                        className="px-3 border border-border rounded-full py-1.5 text-xs font-medium text-primary hover:bg-primary/10 hover:border-primary/30 transition min-h-[38px] inline-flex items-center justify-center cursor-pointer"
                        title="Assign Room"
                      >
                        <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                      </Link>

                      <button
                        onClick={() => setEditTenant(tenant)}
                        aria-label={`Edit ${tenant.fullName}`}
                        className="px-3 border border-border rounded-full py-1.5 text-xs font-medium text-ink hover:bg-canvas-soft transition min-h-[38px] inline-flex items-center justify-center cursor-pointer"
                        title="Edit Profile"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>

                      <button
                        onClick={() => {
                          setArchiveTarget(tenant);
                          setArchiveError('');
                        }}
                        aria-label={`Archive ${tenant.fullName}`}
                        className="px-3 border border-border rounded-full py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition min-h-[38px] inline-flex items-center justify-center cursor-pointer"
                        title="Archive Tenant"
                      >
                        <span className="material-symbols-outlined text-[16px]">archive</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modals ───────────────────────────────────────────────────── */}
      {createOpen && (
        <Modal title="Create New Tenant Profile" onClose={() => setCreateOpen(false)}>
          <TenantForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {editTenant && (
        <Modal title="Edit Tenant Profile" onClose={() => setEditTenant(null)}>
          <TenantForm
            initial={editTenant}
            onSubmit={handleEdit}
            onCancel={() => setEditTenant(null)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {archiveTarget && (
        <Modal title="Archive Tenant Profile" onClose={() => setArchiveTarget(null)}>
          <div className="space-y-4">
            {archiveError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
                <span>{archiveError}</span>
              </div>
            )}

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">warning</span>
              <div>
                <p className="font-bold text-ink">Archive &quot;{archiveTarget.fullName}&quot;?</p>
                <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                  Archiving preserves historical tenancy records and financial reports. A tenant cannot be archived while holding an active room lease.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveConfirm}
                disabled={actionLoading}
                className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Archiving...' : 'Archive Tenant'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
