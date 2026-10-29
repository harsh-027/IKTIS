import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { rentChargeApi } from '../services/api.js';
import Modal from '../components/Dialog.jsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
}

function currentYearMonth() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// ─── Custom Charge Form ───────────────────────────────────────────────────────

function CustomChargeForm({ onSubmit, onCancel, loading }) {
  const [tenancyId, setTenancyId] = useState('');
  const [period, setPeriod] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!tenancyId.trim()) { setError('Tenancy ID is required.'); return; }
    if (!period) { setError('Period month is required.'); return; }
    const amt = parseFloat(amountDue);
    if (isNaN(amt) || amt <= 0) { setError('Amount due must be greater than ₹0.'); return; }
    if (!dueDate) { setError('Due date is required.'); return; }

    const periodDate = period.length === 7 ? `${period}-01` : period;

    try {
      await onSubmit({ tenancyId: tenancyId.trim(), period: periodDate, amountDue: amt, dueDate });
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to create charge.'
      );
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

      <div className="bg-canvas-soft rounded-xl p-3 text-xs text-ink-muted leading-relaxed">
        Use this form to create a single custom charge (e.g. partial first/last month).
        Standard monthly charges are typically created via Bulk Generate.
      </div>

      <div>
        <label htmlFor="custom-tenancy-id" className="block text-xs font-medium text-ink-muted mb-1">
          Tenancy ID <span className="text-rose-500">*</span>
        </label>
        <input
          id="custom-tenancy-id"
          type="text"
          value={tenancyId}
          onChange={(e) => setTenancyId(e.target.value)}
          placeholder="Paste tenancy UUID here"
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          disabled={loading}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="custom-period" className="block text-xs font-medium text-ink-muted mb-1">
            Month (YYYY-MM) <span className="text-rose-500">*</span>
          </label>
          <input
            id="custom-period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label htmlFor="custom-due-date" className="block text-xs font-medium text-ink-muted mb-1">
            Due Date <span className="text-rose-500">*</span>
          </label>
          <input
            id="custom-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            disabled={loading}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="custom-amount" className="block text-xs font-medium text-ink-muted mb-1">
          Custom Amount (₹) <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted font-semibold pointer-events-none select-none">₹</span>
          <input
            id="custom-amount"
            type="number"
            min="1"
            step="100"
            value={amountDue}
            onChange={(e) => setAmountDue(e.target.value)}
            placeholder="e.g. 8000"
            className="w-full border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            disabled={loading}
            required
          />
        </div>
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
          className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-sm"
        >
          {loading ? 'Creating...' : 'Create Charge'}
        </button>
      </div>
    </form>
  );
}

// ─── Edit Charge Amount Form ──────────────────────────────────────────────────

function EditAmountForm({ charge, onSubmit, onCancel, loading }) {
  const [amountDue, setAmountDue] = useState(String(charge.amountDue));
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amountDue);
    if (isNaN(amt) || amt <= 0) { setError('Amount must be greater than ₹0.'); return; }
    setError('');
    try {
      await onSubmit({ amountDue: amt });
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to update amount.'
      );
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

      <div className="bg-canvas-soft rounded-xl p-3 text-xs text-ink space-y-1">
        <p><span className="text-ink-muted">Tenant:</span> <strong>{charge.tenancy?.tenant?.fullName}</strong></p>
        <p><span className="text-ink-muted">Room:</span> <strong>{charge.tenancy?.room?.label}</strong></p>
        <p><span className="text-ink-muted">Period:</span> {formatDate(charge.period)}</p>
      </div>

      <div>
        <label htmlFor="edit-amount" className="block text-xs font-medium text-ink-muted mb-1">
          New Amount Due (₹)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted font-semibold pointer-events-none select-none">₹</span>
          <input
            id="edit-amount"
            type="number"
            min="1"
            step="100"
            value={amountDue}
            onChange={(e) => setAmountDue(e.target.value)}
            className="w-full border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            disabled={loading}
            autoFocus
          />
        </div>
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
          className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-sm"
        >
          {loading ? 'Updating...' : 'Update Amount'}
        </button>
      </div>
    </form>
  );
}

// ─── Charge Card (Stitch Calm Precision) ──────────────────────────────────────

function ChargeCard({ charge, onEdit, onDelete }) {
  const isOverdue = charge.status === 'overdue';
  const isPaid = charge.status === 'paid';
  const isPartial = charge.status === 'partial';

  const tenantName = charge.tenancy?.tenant?.fullName || 'Tenant';
  const initials = tenantName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div
      className={`bg-canvas rounded-[18px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between gap-3 transition hover:shadow-md relative overflow-hidden ${
        isOverdue ? 'border-rose-200' : ''
      }`}
    >
      <div>
        {/* Top row: Tenant Avatar, Name, Unit, Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-canvas ${
              isPaid
                ? 'bg-emerald-100 text-emerald-800'
                : isOverdue
                ? 'bg-rose-100 text-rose-800'
                : 'bg-primary/10 text-primary'
            }`}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-ink truncate">{charge.tenancy?.room?.label || 'Unit'}</span>
                <span className="text-ink-muted text-xs">•</span>
                <span className="text-xs text-ink-muted truncate">{charge.tenancy?.room?.property?.name}</span>
              </div>
              <span className="text-xs text-ink-muted truncate block">{tenantName}</span>
            </div>
          </div>

          <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
            isPaid
              ? 'bg-badge-paid-bg text-badge-paid-text border-badge-paid-border'
              : isPartial
              ? 'bg-badge-partial-bg text-badge-partial-text border-badge-partial-border'
              : isOverdue
              ? 'bg-badge-overdue-bg text-badge-overdue-text border-badge-overdue-border'
              : 'bg-badge-unpaid-bg text-badge-unpaid-text border-badge-unpaid-border'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isPaid ? 'bg-emerald-600' : isPartial ? 'bg-amber-600' : isOverdue ? 'bg-rose-600 animate-pulse' : 'bg-slate-500'
            }`}></span>
            <span>{charge.status.toUpperCase()}</span>
          </span>
        </div>

        {/* Amounts 3-Col Grid */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-canvas-soft rounded-xl my-2 text-xs">
          <div>
            <span className="text-[10px] text-ink-muted block uppercase">Charged</span>
            <span className="font-bold tabular-nums text-ink">{formatINR(charge.amountDue)}</span>
          </div>
          <div>
            <span className="text-[10px] text-ink-muted block uppercase">Paid</span>
            <span className="font-bold tabular-nums text-emerald-700">{formatINR(charge.amountPaid)}</span>
          </div>
          <div>
            <span className="text-[10px] text-ink-muted block uppercase">Remaining</span>
            <span className={`font-bold tabular-nums ${charge.outstanding > 0 ? 'text-rose-700' : 'text-ink-muted'}`}>
              {formatINR(charge.outstanding)}
            </span>
          </div>
        </div>

        {/* Due date and Tenant Link */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-semibold' : 'text-ink-muted'}`}>
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            <span>Due {formatDate(charge.dueDate)}</span>
          </span>
          {charge.tenancy?.tenant?.id && (
            <Link
              to={`/tenants/${charge.tenancy.tenant.id}`}
              className="text-primary hover:underline text-xs font-medium inline-flex items-center gap-0.5"
            >
              <span>Tenant</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>

      {/* Action buttons (only when unpaid / no allocations) */}
      {charge.outstanding === charge.amountDue && charge.status !== 'paid' && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <button
            onClick={() => onEdit(charge)}
            className="flex-1 min-h-[36px] py-1 px-3 border border-border rounded-full text-xs font-medium text-ink hover:bg-canvas-soft transition active:scale-[0.98] cursor-pointer"
          >
            Edit Amount
          </button>
          <button
            onClick={() => onDelete(charge)}
            className="flex-1 min-h-[36px] py-1 px-3 border border-border hover:border-rose-200 hover:bg-rose-50 text-xs font-medium text-rose-700 rounded-full transition active:scale-[0.98] cursor-pointer"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Generate Confirmation Modal ──────────────────────────────────────────────

function GenerateModal({ month, onConfirm, onCancel, loading }) {
  const [year, mon] = month.split('-');
  const monthName = new Date(Date.UTC(Number(year), Number(mon) - 1, 1)).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });

  return (
    <div className="space-y-4">
      <p className="text-xs sm:text-sm text-ink">
        Generate monthly rent charges for all active tenancies in{' '}
        <strong className="text-ink font-semibold">{monthName}</strong>?
      </p>

      <div className="bg-canvas-soft rounded-xl p-3.5 text-xs text-ink-muted space-y-1.5 leading-relaxed">
        <p className="flex items-center gap-1.5 text-ink font-medium">
          <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
          <span>Idempotent Safe Check Active</span>
        </p>
        <p>• Charges calculate strictly from each tenancy&apos;s agreed rent.</p>
        <p>• Tenancies starting after or ended before this month are automatically excluded.</p>
        <p>• Already-generated charges for this cycle are skipped without duplicates.</p>
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
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer"
        >
          {loading ? 'Generating...' : `Generate for ${monthName}`}
        </button>
      </div>
    </div>
  );
}

// ─── RentChargesPage ──────────────────────────────────────────────────────────

export default function RentChargesPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [charges, setCharges] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [generateOpen, setGenerateOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [editCharge, setEditCharge] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const fetchCharges = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rentChargeApi.list({
        month: selectedMonth,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setCharges(res.data?.data?.charges || []);
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to load rent charges.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, statusFilter]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await rentChargeApi.summary(selectedMonth);
      setSummary(res.data?.data || null);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchCharges();
    fetchSummary();
  }, [fetchCharges, fetchSummary]);

  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      const res = await rentChargeApi.generate(selectedMonth);
      const result = res.data?.data;
      setGenerateResult(result);
      setGenerateOpen(false);
      await fetchCharges();
      await fetchSummary();
    } catch (err) {
      setGenerateResult({
        error: err?.response?.data?.error?.message || 'Generation failed.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCustomCreate = async (data) => {
    setActionLoading(true);
    try {
      await rentChargeApi.create(data);
      setCustomOpen(false);
      await fetchCharges();
      await fetchSummary();
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (data) => {
    if (!editCharge) return;
    setActionLoading(true);
    try {
      await rentChargeApi.update(editCharge.id, data);
      setEditCharge(null);
      await fetchCharges();
      await fetchSummary();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    setDeleteError('');
    try {
      await rentChargeApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await fetchCharges();
      await fetchSummary();
    } catch (err) {
      setDeleteError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to delete charge.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const [year, mon] = selectedMonth.split('-');
  const monthLabel = new Date(Date.UTC(Number(year), Number(mon) - 1, 1))
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prev = new Date(Date.UTC(y, m - 2, 1));
    setSelectedMonth(`${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const next = new Date(Date.UTC(y, m, 1));
    setSelectedMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  // Search filter
  const filteredCharges = charges.filter((ch) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const tenant = (ch.tenancy?.tenant?.fullName || '').toLowerCase();
    const room = (ch.tenancy?.room?.label || '').toLowerCase();
    const prop = (ch.tenancy?.room?.property?.name || '').toLowerCase();
    return tenant.includes(q) || room.includes(q) || prop.includes(q);
  });

  return (
    <div className="space-y-5 pb-8">
      {/* ─── Top Header & Period Selector ─────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Rent &amp; Collections
            </h1>
            <p className="text-xs text-ink-muted">
              Monthly rent roll, bulk charge generation, and arrears tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-canvas rounded-full p-0.5 border border-border shadow-sm">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-canvas-soft active:scale-[0.98] transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="text-xs font-semibold text-ink px-3 whitespace-nowrap">
                {monthLabel}
              </span>
              <button
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-canvas-soft active:scale-[0.98] transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>

            <button
              onClick={() => setCustomOpen(true)}
              className="px-3.5 py-1.5 rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer min-h-[36px]"
            >
              + Custom
            </button>
          </div>
        </div>

        {/* Period Indicator Banner */}
        <div className="flex items-center justify-between bg-canvas-soft px-4 py-2 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">event_repeat</span>
            <span className="font-semibold text-ink">Cycle: {selectedMonth}</span>
          </div>
          <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Billing Cycle Active</span>
          </span>
        </div>

        {/* Primary Quick Actions (Stitch Grid) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="bulk-gen-trigger"
            onClick={() => { setGenerateOpen(true); setGenerateResult(null); }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-focus text-white text-xs sm:text-sm font-semibold py-3 px-4 rounded-xl shadow-sm active:scale-[0.98] transition cursor-pointer min-h-[44px]"
          >
            <span className="material-symbols-outlined text-[20px]">bolt</span>
            <span>Bulk Generate</span>
          </button>
          <Link
            to="/payments?action=record"
            className="flex items-center justify-center gap-2 bg-canvas hover:bg-canvas-soft text-ink text-xs sm:text-sm font-semibold py-3 px-4 rounded-xl shadow-sm border border-border active:scale-[0.98] transition min-h-[44px]"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">add_circle</span>
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* Generation Result Banner */}
      {generateResult && (
        <div className={`rounded-xl border p-3.5 text-xs sm:text-sm ${
          generateResult.error
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {generateResult.error ? (
            <p className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-rose-600 text-[18px]">error</span>
              <span>{generateResult.error}</span>
            </p>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                <span>Generated <strong>{generateResult.generated}</strong> new charges</span>
                {generateResult.skipped > 0 && (
                  <span className="text-ink-muted">({generateResult.skipped} already on record)</span>
                )}
              </div>
              <button onClick={() => setGenerateResult(null)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
          )}
        </div>
      )}

      {/* Idempotent Generation Guard Info Card */}
      <div className="bg-canvas rounded-[18px] p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-ink">Idempotent Generation Guard</p>
            <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
              Charges apply strictly to active tenancies without existing charges for {monthLabel}. Safe to re-run.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Bento Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-canvas rounded-[18px] border border-slate-100 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Total Due
          </span>
          <p className="text-xl sm:text-2xl font-bold tabular-nums text-ink">
            {summaryLoading ? '—' : formatINR(summary?.totalDue || 0)}
          </p>
          <span className="text-[10px] text-ink-muted block mt-0.5">
            {summary?.totalCharges || 0} active charges
          </span>
        </div>

        <div className="bg-canvas rounded-[18px] border border-slate-100 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Collected
          </span>
          <p className="text-xl sm:text-2xl font-bold tabular-nums text-emerald-700">
            {summaryLoading ? '—' : formatINR(summary?.totalPaid || 0)}
          </p>
          <span className="text-[10px] text-emerald-600 block mt-0.5">
            {summary?.totalDue > 0 ? Math.round(((summary.totalPaid || 0) / summary.totalDue) * 100) : 0}% collected
          </span>
        </div>

        <div className="bg-canvas rounded-[18px] border border-slate-100 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Outstanding
          </span>
          <p className={`text-xl sm:text-2xl font-bold tabular-nums ${summary?.totalOutstanding > 0 ? 'text-rose-700' : 'text-ink'}`}>
            {summaryLoading ? '—' : formatINR(summary?.totalOutstanding || 0)}
          </p>
          <span className="text-[10px] text-ink-muted block mt-0.5">
            Unpaid this cycle
          </span>
        </div>

        <div className="bg-canvas rounded-[18px] border border-slate-100 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Charges Count
          </span>
          <p className="text-xl sm:text-2xl font-bold tabular-nums text-ink">
            {summaryLoading ? '—' : summary?.totalCharges || 0}
          </p>
          <span className="text-[10px] text-ink-muted block mt-0.5">
            Tenancies billed
          </span>
        </div>
      </div>

      {/* ─── Search & Status Filter Segmented Row ──────────────────────── */}
      <div className="space-y-2">
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3.5 text-ink-muted text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenant name, unit label, or property..."
            className="w-full h-11 pl-10 pr-24 rounded-full bg-canvas text-ink text-xs sm:text-sm border border-border shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            aria-label="Search rent charges"
          />
          <span className="absolute right-3 text-[11px] font-medium text-ink-muted bg-canvas-soft px-2.5 py-1 rounded-full border border-border">
            {filteredCharges.length} total
          </span>
        </div>

        {/* Filter Segmented Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" id="status-filters">
          <button
            onClick={() => setStatusFilter('')}
            className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
              statusFilter === ''
                ? 'bg-ink text-white shadow-sm'
                : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
            }`}
          >
            <span>All</span>
            <span className="text-[11px] opacity-75">({summary?.totalCharges || charges.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-ink text-white shadow-sm'
                : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
            }`}
          >
            <span>Paid</span>
            {summary?.counts?.paid > 0 && <span className="text-[11px] opacity-75">({summary.counts.paid})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
              statusFilter === 'partial'
                ? 'bg-ink text-white shadow-sm'
                : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
            }`}
          >
            <span>Partial</span>
            {summary?.counts?.partial > 0 && <span className="text-[11px] opacity-75">({summary.counts.partial})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
              statusFilter === 'overdue'
                ? 'bg-ink text-white shadow-sm'
                : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
            }`}
          >
            <span>Overdue</span>
            {summary?.counts?.overdue > 0 && <span className="text-[11px] opacity-75">({summary.counts.overdue})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
              statusFilter === 'unpaid'
                ? 'bg-ink text-white shadow-sm'
                : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
            }`}
          >
            <span>Unpaid</span>
            {summary?.counts?.unpaid > 0 && <span className="text-[11px] opacity-75">({summary.counts.unpaid})</span>}
          </button>
        </div>
      </div>

      {/* ─── Charge Cards Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-canvas rounded-[18px] border border-slate-100 p-8 text-center text-ink-muted shadow-sm">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading charges for {monthLabel}...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      ) : filteredCharges.length === 0 ? (
        <div className="bg-canvas rounded-[18px] border border-slate-100 p-8 text-center text-ink-muted shadow-sm space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-canvas-soft flex items-center justify-center mx-auto mb-2 text-ink-muted">
            <span className="material-symbols-outlined text-[28px]">receipt_long</span>
          </div>
          <p className="text-sm font-semibold text-ink">No charges for {monthLabel}</p>
          <p className="text-xs max-w-sm mx-auto">
            {statusFilter
              ? `No charges with status "${statusFilter}" for this cycle.`
              : 'Click "Bulk Generate" to calculate rent charges for all active tenancies.'}
          </p>
          {!statusFilter && (
            <button
              onClick={() => { setGenerateOpen(true); setGenerateResult(null); }}
              className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-full shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>Generate Charges</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCharges.map((charge) => (
            <ChargeCard
              key={charge.id}
              charge={charge}
              onEdit={setEditCharge}
              onDelete={(c) => { setDeleteTarget(c); setDeleteError(''); }}
            />
          ))}
        </div>
      )}

      {/* ─── Modals ───────────────────────────────────────────────────── */}
      {generateOpen && (
        <Modal title={`Generate Charges — ${monthLabel}`} onClose={() => setGenerateOpen(false)}>
          <GenerateModal
            month={selectedMonth}
            onConfirm={handleGenerate}
            onCancel={() => setGenerateOpen(false)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {customOpen && (
        <Modal title="Create Custom Charge" onClose={() => setCustomOpen(false)}>
          <CustomChargeForm
            onSubmit={handleCustomCreate}
            onCancel={() => setCustomOpen(false)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {editCharge && (
        <Modal title="Edit Charge Amount" onClose={() => setEditCharge(null)}>
          <EditAmountForm
            charge={editCharge}
            onSubmit={handleEdit}
            onCancel={() => setEditCharge(null)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Rent Charge" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            {deleteError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs sm:text-sm text-ink">
              Delete the <strong>{formatINR(deleteTarget.amountDue)}</strong> charge for{' '}
              <strong>{deleteTarget.tenancy?.tenant?.fullName}</strong> ({formatDate(deleteTarget.period)})?
            </p>

            <div className="bg-canvas-soft rounded-xl p-3 text-xs text-ink-muted space-y-1">
              <p>• Only charges without payment allocations can be deleted.</p>
              <p>• Historical payments and audit logs remain preserved.</p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Charge'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
