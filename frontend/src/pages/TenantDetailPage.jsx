import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { tenantApi, tenancyApi, propertyApi, roomApi, paymentApi } from '../services/api.js';
import Modal from '../components/Dialog.jsx';

function formatINR(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Edit Tenant Form ────────────────────────────────────────────────────────
function EditTenantForm({ initial, onSubmit, onCancel, loading }) {
  const [fullName, setFullName] = useState(initial.fullName || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [email, setEmail] = useState(initial.email || '');
  const [notes, setNotes] = useState(initial.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    setError('');
    try {
      await onSubmit({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to update tenant.'
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

      <div>
        <label htmlFor="edit-fullName" className="block text-xs font-semibold text-ink-muted mb-1">
          Full Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="edit-fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          disabled={loading}
          required
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="edit-phone" className="block text-xs font-semibold text-ink-muted mb-1">
          Phone Number
        </label>
        <input
          id="edit-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="edit-email" className="block text-xs font-semibold text-ink-muted mb-1">
          Email Address
        </label>
        <input
          id="edit-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="edit-notes" className="block text-xs font-semibold text-ink-muted mb-1">
          Notes / Identification
        </label>
        <textarea
          id="edit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// ─── End Tenancy Form ────────────────────────────────────────────────────────
function EndTenancyForm({ tenancy, onSubmit, onCancel, loading }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [endDate, setEndDate] = useState(todayStr);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!endDate) {
      setError('End date is required.');
      return;
    }
    setError('');
    try {
      await onSubmit({ endDate });
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to end tenancy.'
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
        <p className="font-semibold">{tenancy.roomLabel} • {tenancy.propertyName}</p>
        <p className="text-ink-muted">Started on: {formatDate(tenancy.startDate)}</p>
        <p className="text-ink-muted">Agreed rent: {formatINR(tenancy.monthlyRent)} / month</p>
      </div>

      <div>
        <label htmlFor="end-date" className="block text-xs font-semibold text-ink-muted mb-1">
          Effective End Date <span className="text-rose-500">*</span>
        </label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          disabled={loading}
          required
        />
        <p className="text-[11px] text-ink-muted mt-1">
          The tenancy agreement will conclude on this date and the room will immediately become available for new tenants.
        </p>
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
          className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer"
        >
          {loading ? 'Concluding...' : 'Confirm End Tenancy'}
        </button>
      </div>
    </form>
  );
}

// ─── Assign Room Modal / Form ────────────────────────────────────────────────
function AssignRoomForm({ tenantId, onSubmit, onCancel, loading }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [rentDueDay, setRentDueDay] = useState('5');
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await propertyApi.list();
        const list = res.data?.data?.properties || [];
        setProperties(list);
        if (list.length > 0) {
          setSelectedPropertyId(list[0].id);
        }
      } catch (err) {
        setError('Failed to load properties');
      }
    }
    loadProperties();
  }, []);

  useEffect(() => {
    if (!selectedPropertyId) {
      setRooms([]);
      setSelectedRoomId('');
      return;
    }
    async function loadRooms() {
      setLoadingRooms(true);
      setError('');
      try {
        const res = await roomApi.listByProperty(selectedPropertyId);
        const allRooms = res.data?.data?.rooms || [];
        const availableRooms = allRooms.filter((r) => !r.isOccupied && r.isAvailable);
        setRooms(availableRooms);
        if (availableRooms.length > 0) {
          setSelectedRoomId(availableRooms[0].id);
        } else {
          setSelectedRoomId('');
        }
      } catch (err) {
        setError('Failed to load rooms for this property');
      } finally {
        setLoadingRooms(false);
      }
    }
    loadRooms();
  }, [selectedPropertyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPropertyId) {
      setError('Please select a property.');
      return;
    }
    if (!selectedRoomId) {
      setError('Please select an available room.');
      return;
    }
    if (!startDate) {
      setError('Start date is required.');
      return;
    }
    const rentNum = parseFloat(monthlyRent);
    if (isNaN(rentNum) || rentNum <= 0) {
      setError('Monthly rent must be greater than ₹0.');
      return;
    }
    const dueDayNum = parseInt(rentDueDay, 10);
    if (isNaN(dueDayNum) || dueDayNum < 1 || dueDayNum > 31) {
      setError('Rent due day must be between 1 and 31.');
      return;
    }

    try {
      await onSubmit({
        tenantId,
        roomId: selectedRoomId,
        startDate,
        endDate: endDate ? endDate : undefined,
        monthlyRent: rentNum,
        rentDueDay: dueDayNum,
      });
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to assign room tenancy.'
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

      <div>
        <label htmlFor="assign-prop" className="block text-xs font-semibold text-ink-muted mb-1">
          Property Building <span className="text-rose-500">*</span>
        </label>
        <select
          id="assign-prop"
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
          disabled={loading || properties.length === 0}
        >
          {properties.length === 0 ? (
            <option value="">No properties available</option>
          ) : (
            properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div>
        <label htmlFor="assign-room" className="block text-xs font-semibold text-ink-muted mb-1">
          Available Room / Unit <span className="text-rose-500">*</span>
        </label>
        {loadingRooms ? (
          <div className="text-xs text-ink-muted py-2">Loading available rooms...</div>
        ) : (
          <select
            id="assign-room"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
            disabled={loading || rooms.length === 0}
          >
            {rooms.length === 0 ? (
              <option value="">No vacant rooms in this property</option>
            ) : (
              rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} {r.description ? `(${r.description})` : ''}
                </option>
              ))
            )}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="start-date" className="block text-xs font-semibold text-ink-muted mb-1">
            Start Date <span className="text-rose-500">*</span>
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label htmlFor="end-date-opt" className="block text-xs font-semibold text-ink-muted mb-1">
            End Date <span className="text-[11px] font-normal text-ink-muted">(Optional)</span>
          </label>
          <input
            id="end-date-opt"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            disabled={loading}
            placeholder="Ongoing if empty"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="monthly-rent" className="block text-xs font-semibold text-ink-muted mb-1">
            Monthly Agreed Rent (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-semibold pointer-events-none select-none">₹</span>
            <input
              id="monthly-rent"
              type="number"
              min="1"
              step="100"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition tabular-nums"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="rent-due-day" className="block text-xs font-semibold text-ink-muted mb-1">
            Rent Due Day (1–31) <span className="text-rose-500">*</span>
          </label>
          <input
            id="rent-due-day"
            type="number"
            min="1"
            max="31"
            value={rentDueDay}
            onChange={(e) => setRentDueDay(e.target.value)}
            className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition tabular-nums"
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
          disabled={loading || !selectedRoomId}
          className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer"
        >
          {loading ? 'Assigning...' : 'Confirm Assignment'}
        </button>
      </div>
    </form>
  );
}

// ─── Main TenantDetailPage ──────────────────────────────────────────────────
export default function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals — auto-open assign modal if ?assign=1 is in URL
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(
    () => new URLSearchParams(location.search).get('assign') === '1'
  );
  const [endTarget, setEndTarget] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [archiveError, setArchiveError] = useState('');

  // Financials & Payment History
  const [payments, setPayments] = useState([]);
  const [outstandingInfo, setOutstandingInfo] = useState(null);

  const fetchTenant = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resTenant, resPayments, resOut] = await Promise.allSettled([
        tenantApi.get(id),
        paymentApi.list({ tenantId: id }),
        paymentApi.getTenantOutstanding(id),
      ]);

      if (resTenant.status === 'fulfilled' && resTenant.value.data?.success) {
        setTenant(resTenant.value.data.data.tenant || null);
      } else {
        throw new Error('Tenant not found or unauthorized.');
      }

      if (resPayments.status === 'fulfilled' && resPayments.value.data?.success) {
        setPayments(resPayments.value.data.data.payments || []);
      }

      if (resOut.status === 'fulfilled' && resOut.value.data?.success) {
        setOutstandingInfo(resOut.value.data.data || null);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Tenant not found or unauthorized.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  const handleEdit = async (data) => {
    setActionLoading(true);
    try {
      await tenantApi.update(id, data);
      setEditOpen(false);
      await fetchTenant();
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (data) => {
    setActionLoading(true);
    try {
      await tenancyApi.create(data);
      setAssignOpen(false);
      await fetchTenant();
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndTenancy = async (data) => {
    if (!endTarget) return;
    setActionLoading(true);
    try {
      await tenancyApi.end(endTarget.id, data);
      setEndTarget(null);
      await fetchTenant();
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    setArchiveError('');
    try {
      await tenantApi.archive(id);
      setArchiveOpen(false);
      navigate('/tenants');
    } catch (err) {
      setArchiveError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to archive tenant.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-canvas rounded-[18px] border border-slate-100 p-8 text-center text-ink-muted text-xs shadow-sm max-w-4xl mx-auto">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
        <p>Loading tenant details...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          to="/tenants"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink min-h-[40px] transition"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Tenants</span>
        </Link>
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-xs">
          {error || 'Tenant not found.'}
        </div>
      </div>
    );
  }

  const isArchived = !!tenant.archivedAt;
  const activeTenancy = tenant.activeTenancy;
  const previousTenancies = tenant.previousTenancies || [];
  const initials = tenant.fullName
    ? tenant.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'TN';

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* ─── Breadcrumb Navigation ────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-ink-muted">
        <Link to="/tenants" className="hover:text-primary transition flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-[16px]">group</span>
          <span>Tenants</span>
        </Link>
        <span className="text-ink-muted/50">/</span>
        <span className="text-ink font-semibold truncate max-w-xs">{tenant.fullName}</span>
      </nav>

      {/* ─── Tenant Profile Hero Card (Stitch Theme) ───────────────────── */}
      <div className="bg-canvas rounded-[18px] border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-canvas shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink truncate">
                  {tenant.fullName}
                </h1>
                {isArchived ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-badge-partial-bg text-badge-partial-text border border-badge-partial-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    <span>Archived Profile</span>
                  </span>
                ) : activeTenancy ? (
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
              <p className="text-xs text-ink-muted">
                Profile created on {formatDate(tenant.createdAt)} • ID: {tenant.id.slice(0, 8)}
              </p>
            </div>
          </div>

          {!isArchived && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1 min-h-[38px] px-3.5 py-1.5 rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  setArchiveOpen(true);
                  setArchiveError('');
                }}
                className="inline-flex items-center gap-1 min-h-[38px] px-3.5 py-1.5 rounded-full border border-border hover:bg-rose-50 hover:border-rose-200 text-ink-muted hover:text-rose-700 text-xs font-medium transition cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">archive</span>
                <span>Archive</span>
              </button>
            </div>
          )}
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/50 text-xs">
          <div className="bg-canvas-soft p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">call</span>
            <div className="min-w-0">
              <p className="text-[10px] text-ink-muted uppercase font-bold">Phone Number</p>
              {tenant.phone ? (
                <a href={`tel:${tenant.phone}`} className="font-semibold text-ink hover:text-primary transition font-mono">
                  {tenant.phone}
                </a>
              ) : (
                <span className="text-ink-muted italic">Not specified</span>
              )}
            </div>
          </div>

          <div className="bg-canvas-soft p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">mail</span>
            <div className="min-w-0">
              <p className="text-[10px] text-ink-muted uppercase font-bold">Email Address</p>
              {tenant.email ? (
                <a href={`mailto:${tenant.email}`} className="font-semibold text-ink hover:text-primary transition truncate block">
                  {tenant.email}
                </a>
              ) : (
                <span className="text-ink-muted italic">Not specified</span>
              )}
            </div>
          </div>

          {tenant.notes && (
            <div className="sm:col-span-2 bg-canvas-soft p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">description</span>
              <div>
                <p className="text-[10px] text-ink-muted uppercase font-bold">Notes &amp; Identification</p>
                <p className="text-xs text-ink whitespace-pre-wrap mt-0.5">{tenant.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Current Tenancy Agreement Section ─────────────────────────── */}
      <div className="bg-canvas rounded-[18px] border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-ink flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]">key</span>
            <span>Current Tenancy Agreement</span>
          </h2>

          {!isArchived && !activeTenancy && (
            <button
              onClick={() => setAssignOpen(true)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-primary hover:bg-primary-focus text-white text-xs font-semibold rounded-full shadow-sm cursor-pointer transition active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Assign Room</span>
            </button>
          )}
        </div>

        {activeTenancy ? (
          <div className="bg-blue-50/40 border border-blue-100/60 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">
                  Assigned Unit
                </span>
                <p className="text-lg font-bold text-ink mt-0.5">
                  {activeTenancy.roomLabel}
                </p>
                <p className="text-xs text-ink-muted">
                  {activeTenancy.propertyName}
                  {activeTenancy.propertyAddress ? ` • ${activeTenancy.propertyAddress}` : ''}
                </p>
              </div>

              {!isArchived && (
                <button
                  onClick={() => setEndTarget(activeTenancy)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-semibold transition active:scale-[0.98] shadow-sm cursor-pointer self-start sm:self-auto"
                >
                  End Tenancy
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-blue-200/60 text-xs">
              <div>
                <span className="text-[11px] text-ink-muted block font-medium">Monthly Rent</span>
                <span className="text-base font-bold text-ink tabular-nums">
                  {formatINR(activeTenancy.monthlyRent)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block font-medium">Rent Due Day</span>
                <span className="text-base font-bold text-ink tabular-nums">
                  Day {activeTenancy.rentDueDay}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block font-medium">Start Date</span>
                <span className="text-xs font-semibold text-ink">
                  {formatDate(activeTenancy.startDate)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block font-medium">End Date</span>
                <span className="text-xs font-semibold text-ink">
                  {activeTenancy.endDate ? formatDate(activeTenancy.endDate) : 'Ongoing'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-ink-muted text-xs bg-canvas-soft rounded-2xl border border-dashed border-border p-4 space-y-1">
            <span className="material-symbols-outlined text-[28px] text-ink-muted mx-auto block">meeting_room</span>
            <p className="font-semibold text-ink">This tenant does not currently hold an active tenancy agreement.</p>
            {!isArchived && (
              <p>Assign them to any vacant room across your properties to start tracking rent.</p>
            )}
          </div>
        )}
      </div>

      {/* ─── Tenancy History Section ───────────────────────────────────── */}
      <div className="bg-canvas rounded-[18px] border border-slate-100 p-5 shadow-sm space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-ink flex items-center gap-1.5">
          <span className="material-symbols-outlined text-ink-muted text-[20px]">history</span>
          <span>Tenancy History ({previousTenancies.length})</span>
        </h2>

        {previousTenancies.length === 0 ? (
          <p className="text-xs text-ink-muted italic py-1">
            No previous concluded tenancies on record for this tenant.
          </p>
        ) : (
          <div className="space-y-2.5">
            {previousTenancies.map((t) => (
              <div
                key={t.id}
                className="bg-canvas-soft rounded-xl border border-slate-100 p-3 sm:p-4 text-xs space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-sm text-ink">{t.roomLabel}</span>
                    <span className="text-ink-muted ml-2">• {t.propertyName}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 w-fit">
                    Concluded
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 text-xs">
                  <div>
                    <span className="text-[10px] text-ink-muted block uppercase font-medium">Duration</span>
                    <span className="font-semibold text-ink">
                      {formatDate(t.startDate)} – {formatDate(t.endDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted block uppercase font-medium">Agreed Rent</span>
                    <span className="font-bold text-ink tabular-nums">
                      {formatINR(t.monthlyRent)} / mo
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted block uppercase font-medium">Rent Due Day</span>
                    <span className="font-semibold text-ink tabular-nums">Day {t.rentDueDay}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted block uppercase font-medium">Tenancy ID</span>
                    <span className="font-mono text-[10px] text-ink-muted truncate block">
                      {t.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Payment History & Financial Balance Section ───────────────── */}
      <div className="bg-canvas rounded-[18px] border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-ink flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">payments</span>
              <span>Payment History &amp; Receipts ({payments.length})</span>
            </h2>
            <p className="text-xs text-ink-muted">
              Manually recorded rent payments and allocations for this tenant
            </p>
          </div>
          <Link
            to={`/payments?action=record&tenantId=${tenant.id}`}
            className="px-4 py-2 bg-primary hover:bg-primary-focus text-white text-xs font-semibold rounded-full shadow-sm transition active:scale-[0.98] inline-flex items-center gap-1 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Record Payment</span>
          </Link>
        </div>

        {/* Financial Summary Badge */}
        {outstandingInfo && (
          <div className="p-3.5 bg-canvas-soft rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <span className={`text-xl font-bold tabular-nums ${outstandingInfo.totalOutstanding > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {formatINR(outstandingInfo.totalOutstanding)}
              </span>
            </div>
            <div className="text-xs text-ink-muted">
              {outstandingInfo.charges?.length || 0} unpaid or partially paid charge{outstandingInfo.charges?.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {payments.length === 0 ? (
          <p className="text-xs text-ink-muted italic py-1">
            No payments recorded yet for this tenant.
          </p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                  p.isVoided
                    ? 'border-rose-200 bg-rose-50/20 text-ink-muted'
                    : 'border-slate-100 bg-canvas-soft/80 text-ink'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{p.receiptNumber}</span>
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                        p.isVoided ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.isVoided ? 'Voided' : 'Valid'}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    {formatDate(p.paidAt)} • {p.method} {p.reference ? `(${p.reference})` : ''}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  <div className="text-right">
                    <span className={`font-bold text-sm tabular-nums ${p.isVoided ? 'line-through text-ink-muted' : 'text-emerald-700'}`}>
                      {formatINR(p.amount)}
                    </span>
                    <span className="text-[10px] text-ink-muted block">
                      {p.allocations?.length || 0} charge allocation{p.allocations?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Link
                    to="/payments"
                    className="px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded-full border border-border inline-flex items-center gap-1 transition"
                  >
                    <span>View</span>
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modals ───────────────────────────────────────────────────── */}
      {editOpen && (
        <Modal title="Edit Tenant Profile" onClose={() => setEditOpen(false)}>
          <EditTenantForm
            initial={tenant}
            onSubmit={handleEdit}
            onCancel={() => setEditOpen(false)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {assignOpen && (
        <Modal title="Assign Room to Tenant" onClose={() => setAssignOpen(false)}>
          <AssignRoomForm
            tenantId={tenant.id}
            onSubmit={handleAssign}
            onCancel={() => setAssignOpen(false)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {endTarget && (
        <Modal title="End Tenancy Agreement" onClose={() => setEndTarget(null)}>
          <EndTenancyForm
            tenancy={endTarget}
            onSubmit={handleEndTenancy}
            onCancel={() => setEndTarget(null)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {archiveOpen && (
        <Modal title="Archive Tenant Profile" onClose={() => setArchiveOpen(false)}>
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
                <p className="font-bold text-ink">Archive &quot;{tenant.fullName}&quot;?</p>
                <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                  Historical tenancy agreements and ledger payment records remain strictly preserved. Active tenancies must be concluded before archiving.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setArchiveOpen(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchive}
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
