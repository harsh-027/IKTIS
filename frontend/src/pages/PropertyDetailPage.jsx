import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { propertyApi, roomApi } from '../services/api.js';
import Modal from '../components/Dialog.jsx';

function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Property Edit Form ───────────────────────────────────────────────────────
function PropertyForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [name, setName] = useState(initial.name || '');
  const [address, setAddress] = useState(initial.address || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Property name is required.'); return; }
    if (!address.trim()) { setError('Address is required.'); return; }
    try {
      await onSubmit({ name: name.trim(), address: address.trim() });
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Something went wrong.'
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
        <label htmlFor="edit-prop-name" className="block text-xs font-medium text-ink-muted mb-1">
          Property Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="edit-prop-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          disabled={loading}
          maxLength={191}
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="edit-prop-address" className="block text-xs font-medium text-ink-muted mb-1">
          Address <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="edit-prop-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
          disabled={loading}
          maxLength={255}
        />
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer inline-flex items-center justify-center"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-60 cursor-pointer inline-flex items-center justify-center shadow-sm"
        >
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// ─── Room Form ────────────────────────────────────────────────────────────────
function RoomForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [label, setLabel] = useState(initial.label || '');
  const [description, setDescription] = useState(initial.description || '');
  const [isAvailable, setIsAvailable] = useState(
    initial.id ? initial.isAvailable : true
  );
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!label.trim()) { setError('Room label is required.'); return; }
    try {
      await onSubmit({ label: label.trim(), description: description.trim() || null, isAvailable });
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Something went wrong.';
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
        <label htmlFor="room-label" className="block text-xs font-medium text-ink-muted mb-1">
          Room / Unit Label <span className="text-rose-500">*</span>
        </label>
        <input
          id="room-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Unit 101, Studio A, Ground Floor"
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          disabled={loading}
          maxLength={100}
          required
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="room-description" className="block text-xs font-medium text-ink-muted mb-1">
          Description <span className="text-ink-muted/60 font-normal">(Floor, square footage, amenities)</span>
        </label>
        <textarea
          id="room-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Floor 1 • 2BHK • 980 sq.ft • Attached bath"
          rows={3}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
          disabled={loading}
          maxLength={255}
        />
      </div>
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-canvas-soft border border-slate-100 min-h-[44px]">
        <input
          id="room-available"
          type="checkbox"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          disabled={loading}
          className="rounded border-border text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer"
        />
        <label htmlFor="room-available" className="text-xs font-medium text-ink cursor-pointer select-none">
          Operationally ready & habitable <span className="text-ink-muted font-normal block sm:inline">(uncheck to mark maintenance)</span>
        </label>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer inline-flex items-center justify-center"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-60 cursor-pointer inline-flex items-center justify-center shadow-sm"
        >
          {loading ? 'Saving…' : initial.id ? 'Save Changes' : 'Add Unit'}
        </button>
      </div>
    </form>
  );
}

// ─── Confirm Action Modal ─────────────────────────────────────────────────────
function ConfirmModal({ title, message, submessage, confirmLabel, confirmClass, onConfirm, onCancel, loading, error }) {
  return (
    <Modal title={title} onClose={onCancel}>
      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
          <span>{error}</span>
        </div>
      )}
      <div className="flex items-start gap-3 mb-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
        <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">warning</span>
        <div className="text-xs space-y-1">
          <p className="font-semibold text-ink">{message}</p>
          {submessage && <p className="text-amber-800 leading-relaxed">{submessage}</p>}
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer inline-flex items-center justify-center"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-60 cursor-pointer inline-flex items-center justify-center shadow-sm ${confirmClass}`}
        >
          {loading ? 'Processing…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & search states for units
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('all'); // 'all', 'occupied', 'available', 'maintenance'

  // Modals
  const [showEditProperty, setShowEditProperty] = useState(false);
  const [showArchiveProperty, setShowArchiveProperty] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [archiveRoom, setArchiveRoom] = useState(null);
  const [archiveError, setArchiveError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadProperty = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await propertyApi.get(id);
      if (res.data?.success) {
        setProperty(res.data.data.property);
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setError('Property not found.');
      } else {
        setError('Failed to load property. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProperty(); }, [loadProperty]);

  // ── Property actions ──
  const handleEditProperty = async (data) => {
    setSubmitting(true);
    try {
      await propertyApi.update(id, data);
      setShowEditProperty(false);
      await loadProperty();
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveProperty = async () => {
    setSubmitting(true);
    setArchiveError('');
    try {
      await propertyApi.archive(id);
      navigate('/properties');
    } catch (err) {
      setArchiveError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to archive property.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Room actions ──
  const handleAddRoom = async (data) => {
    setSubmitting(true);
    try {
      await roomApi.create(id, data);
      setShowAddRoom(false);
      await loadProperty();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRoom = async (data) => {
    setSubmitting(true);
    try {
      await roomApi.update(editRoom.id, data);
      setEditRoom(null);
      await loadProperty();
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveRoom = async () => {
    setSubmitting(true);
    setArchiveError('');
    try {
      await roomApi.archive(archiveRoom.id);
      setArchiveRoom(null);
      await loadProperty();
    } catch (err) {
      setArchiveError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to archive room.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-canvas-soft rounded w-1/4" />
        <div className="h-32 bg-canvas rounded-[18px] border border-slate-100" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-canvas rounded-[18px] border border-slate-100 h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-canvas rounded-[18px] border border-slate-100 p-6">
        <p className="text-sm font-semibold text-rose-700 mb-2">{error}</p>
        <Link to="/properties" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          <span>Back to Properties</span>
        </Link>
      </div>
    );
  }

  if (!property) return null;

  const rooms = property.rooms || [];
  const isArchived = !!property.archivedAt;

  // Counts for filters and stats
  const totalUnits = rooms.length;
  const occupiedUnits = rooms.filter((r) => r.isOccupied).length;
  const maintenanceUnits = rooms.filter((r) => !r.isAvailable).length;
  const vacantUnits = rooms.filter((r) => !r.isOccupied && r.isAvailable).length;
  const occupancyPercentage = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    if (roomFilter === 'occupied' && !room.isOccupied) return false;
    if (roomFilter === 'available' && (room.isOccupied || !room.isAvailable)) return false;
    if (roomFilter === 'maintenance' && room.isAvailable) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesLabel = room.label.toLowerCase().includes(q);
    const matchesDesc = (room.description || '').toLowerCase().includes(q);
    const matchesTenant = room.currentTenancy?.tenantName?.toLowerCase().includes(q);
    return matchesLabel || matchesDesc || matchesTenant;
  });

  return (
    <div className="space-y-5 pb-8">
      {/* ─── Breadcrumb Navigation ────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-ink-muted">
        <Link to="/properties" className="hover:text-primary transition flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-[16px]">apartment</span>
          <span>Properties</span>
        </Link>
        <span className="text-ink-muted/50">/</span>
        <span className="text-ink font-semibold truncate max-w-xs">{property.name}</span>
      </nav>

      {/* ─── Top Stats Hero Overview Card (Stitch Calm Precision) ───────── */}
      <div className="w-full bg-canvas rounded-[18px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <span className="material-symbols-outlined text-[22px]">apartment</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink truncate">
                  {property.name}
                </h1>
                {isArchived ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-badge-partial-bg text-badge-partial-text border border-badge-partial-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    <span>Archived Building</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-badge-paid-bg text-badge-paid-text border border-badge-paid-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    <span>Active Portfolio</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted mt-0.5">{property.address}</p>
            </div>
          </div>

          {!isArchived && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                id="btn-edit-property"
                onClick={() => setShowEditProperty(true)}
                className="inline-flex items-center gap-1 min-h-[38px] px-3.5 py-1.5 rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit</span>
              </button>
              <button
                id="btn-archive-property"
                onClick={() => setShowArchiveProperty(true)}
                className="inline-flex items-center gap-1 min-h-[38px] px-3.5 py-1.5 rounded-full border border-border hover:bg-rose-50 hover:border-rose-200 text-ink-muted hover:text-rose-700 text-xs font-medium transition cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">archive</span>
                <span>Archive</span>
              </button>
            </div>
          )}
        </div>

        {/* Occupancy Stats Section */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex justify-between items-end text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-badge-paid-text inline-block ring-2 ring-badge-paid-border/40"></span>
              <span className="font-semibold text-ink">Occupancy Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold text-primary tabular-nums">
                {occupancyPercentage}%
              </span>
              <span className="text-[11px] text-ink-muted font-normal">capacity</span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-surface-container flex overflow-hidden p-0.5">
            <div
              className="h-full bg-primary-container rounded-l-full transition-all duration-300"
              style={{ width: `${occupancyPercentage}%` }}
            ></div>
            <div
              className="h-full bg-slate-300 rounded-r-full transition-all duration-300"
              style={{ width: `${100 - occupancyPercentage}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl bg-surface-container-low">
              <span className="material-symbols-outlined text-badge-paid-text text-[15px]">verified</span>
              <span className="font-semibold text-ink">{occupiedUnits}</span>
              <span className="text-ink-muted">Active</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl bg-badge-partial-bg/60">
              <span className="material-symbols-outlined text-badge-partial-text text-[15px]">build</span>
              <span className="font-semibold text-badge-partial-text">{maintenanceUnits}</span>
              <span className="text-badge-partial-text">Maint.</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl bg-surface-container-low">
              <span className="material-symbols-outlined text-ink-muted text-[15px]">meeting_room</span>
              <span className="font-semibold text-ink">{vacantUnits}</span>
              <span className="text-ink-muted">Vacant</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Operational & Derived Logic Explainer Micro-banner ─────────── */}
      <div className="flex items-center gap-2.5 p-3 bg-surface-container-low/70 rounded-xl border border-slate-100">
        <span className="material-symbols-outlined text-primary text-[20px] shrink-0">info</span>
        <p className="text-xs text-ink-muted flex-1 leading-snug">
          Dual Status Engine: <strong className="text-ink font-semibold">Operational</strong> indicates physical habitability; <strong className="text-ink font-semibold">Derived</strong> synchronizes live tenant lease agreements in real time.
        </p>
      </div>

      {/* ─── Search & Unit Filter Row ──────────────────────────────────── */}
      <div className="space-y-2">
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3.5 text-ink-muted text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search unit label, description, or tenant..."
            className="w-full h-11 pl-10 pr-24 rounded-full bg-canvas text-ink text-xs sm:text-sm border border-border shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            aria-label="Search units"
          />
          <span className="absolute right-3 text-[11px] font-medium text-ink-muted bg-canvas-soft px-2.5 py-1 rounded-full border border-border">
            {filteredRooms.length} of {totalUnits}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setRoomFilter('all')}
              className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
                roomFilter === 'all'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
              }`}
            >
              <span>All Units</span>
              <span className="text-[11px] opacity-75">({totalUnits})</span>
            </button>
            <button
              onClick={() => setRoomFilter('occupied')}
              className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
                roomFilter === 'occupied'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
              }`}
            >
              <span>Occupied</span>
              <span className="text-[11px] opacity-75">({occupiedUnits})</span>
            </button>
            <button
              onClick={() => setRoomFilter('available')}
              className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
                roomFilter === 'available'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
              }`}
            >
              <span>Available</span>
              <span className="text-[11px] opacity-75">({vacantUnits})</span>
            </button>
            {maintenanceUnits > 0 && (
              <button
                onClick={() => setRoomFilter('maintenance')}
                className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
                  roomFilter === 'maintenance'
                    ? 'bg-ink text-white shadow-sm'
                    : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
                }`}
              >
                <span>Maintenance</span>
                <span className="text-[11px] opacity-75">({maintenanceUnits})</span>
              </button>
            )}
          </div>

          {!isArchived && (
            <button
              id="btn-add-room"
              onClick={() => setShowAddRoom(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold transition active:scale-[0.98] shadow-sm cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Room / Unit Cards ─────────────────────────────────────────── */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-16 bg-canvas rounded-[18px] border border-slate-100 p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-canvas-soft flex items-center justify-center mx-auto mb-3 text-ink-muted">
            <span className="material-symbols-outlined text-[28px]">meeting_room</span>
          </div>
          <p className="text-sm font-semibold text-ink mb-1">
            {searchQuery ? 'No matching units found' : 'No units in this building yet'}
          </p>
          <p className="text-xs text-ink-muted mb-4 max-w-xs mx-auto">
            {searchQuery
              ? 'Try modifying your search or filter criteria.'
              : 'Add rooms and rental units to begin assigning tenancies.'}
          </p>
          {!isArchived && (
            <button
              onClick={() => setShowAddRoom(true)}
              className="inline-flex items-center justify-center min-h-[38px] px-4 py-1.5 rounded-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              + Add First Unit
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          {filteredRooms.map((room) => {
            const hasTenancy = room.isOccupied && room.currentTenancy;
            const initials = hasTenancy && room.currentTenancy.tenantName
              ? room.currentTenancy.tenantName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
              : 'TN';

            return (
              <div
                key={room.id}
                className="w-full bg-canvas rounded-[18px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col space-y-3 relative overflow-hidden transition hover:shadow-md"
              >
                {/* Header row: Unit label, Floor info, Edit/Archive buttons */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-ink">{room.label}</span>
                      {room.description && (
                        <span className="text-xs text-ink-muted bg-canvas-soft px-2.5 py-0.5 rounded-full font-medium">
                          {room.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isArchived && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditRoom(room)}
                        aria-label={`Edit ${room.label}`}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-canvas-soft active:scale-[0.98] transition cursor-pointer"
                        title="Edit Unit"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      {!room.isOccupied && (
                        <button
                          onClick={() => setArchiveRoom(room)}
                          aria-label={`Archive ${room.label}`}
                          className="w-9 h-9 flex items-center justify-center rounded-full text-ink-muted hover:text-rose-700 hover:bg-rose-50 active:scale-[0.98] transition cursor-pointer"
                          title="Archive Unit"
                        >
                          <span className="material-symbols-outlined text-[18px]">archive</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Dual status pill indicators */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                  {/* Operational readiness status */}
                  {room.isAvailable ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-badge-paid-bg text-badge-paid-text font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-badge-paid-text"></span>
                      <span>Oper: Ready / Habitable</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-badge-partial-bg text-badge-partial-text font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                      <span>Oper: Maintenance</span>
                    </div>
                  )}

                  {/* Derived tenancy agreement status */}
                  {room.isOccupied ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-primary font-medium">
                      <span className="material-symbols-outlined text-[14px]">key</span>
                      <span>Occupied</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                      <span className="material-symbols-outlined text-[14px]">meeting_room</span>
                      <span>Vacant</span>
                    </div>
                  )}
                </div>

                {/* Occupancy or Assignment Information Card */}
                {hasTenancy ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-canvas-soft rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-canvas">
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          to={`/tenants/${room.currentTenancy.tenantId}`}
                          className="text-xs sm:text-sm font-semibold text-ink hover:text-primary transition truncate"
                        >
                          {room.currentTenancy.tenantName}
                        </Link>
                        <span className="text-[11px] text-ink-muted truncate">
                          Active Tenancy • {room.currentTenancy.startDate ? `Since ${new Date(room.currentTenancy.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Agreement on record'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <div className="text-left sm:text-right">
                        <span className="text-xs sm:text-sm font-bold text-ink tabular-nums block">
                          {formatINR(room.currentTenancy.agreedRent)}
                        </span>
                        <span className="text-[10px] text-ink-muted block">monthly agreed</span>
                      </div>
                      <Link
                        to={`/tenants/${room.currentTenancy.tenantId}`}
                        className="px-3 py-1.5 bg-canvas hover:bg-surface-container text-primary font-semibold text-xs rounded-full border border-border flex items-center gap-1 active:scale-[0.98] transition"
                      >
                        <span>Tenancy</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                ) : !isArchived && room.isAvailable ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/60">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[20px]">door_front</span>
                      <div>
                        <p className="text-xs font-semibold text-emerald-950">Unit is ready for tenant</p>
                        <p className="text-[11px] text-emerald-700">No active lease agreement bound to this room</p>
                      </div>
                    </div>
                    <Link
                      to="/tenants"
                      className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-sm active:scale-[0.98] transition"
                    >
                      <span>Assign</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {showEditProperty && (
        <Modal title="Edit Property Details" onClose={() => setShowEditProperty(false)}>
          <PropertyForm
            initial={property}
            onSubmit={handleEditProperty}
            onCancel={() => setShowEditProperty(false)}
            loading={submitting}
          />
        </Modal>
      )}

      {showArchiveProperty && (
        <ConfirmModal
          title="Archive Property"
          message={`Are you sure you want to archive "${property.name}"?`}
          submessage="All active rooms will also be archived. Historical financial records and past payments remain preserved."
          confirmLabel="Archive Property"
          confirmClass="bg-rose-600 hover:bg-rose-700"
          error={archiveError}
          onConfirm={handleArchiveProperty}
          onCancel={() => { setShowArchiveProperty(false); setArchiveError(''); }}
          loading={submitting}
        />
      )}

      {showAddRoom && (
        <Modal title="Add Unit to Property" onClose={() => setShowAddRoom(false)}>
          <RoomForm
            onSubmit={handleAddRoom}
            onCancel={() => setShowAddRoom(false)}
            loading={submitting}
          />
        </Modal>
      )}

      {editRoom && (
        <Modal title="Edit Unit Details" onClose={() => setEditRoom(null)}>
          <RoomForm
            initial={editRoom}
            onSubmit={handleEditRoom}
            onCancel={() => setEditRoom(null)}
            loading={submitting}
          />
        </Modal>
      )}

      {archiveRoom && (
        <ConfirmModal
          title="Archive Unit"
          message={`Are you sure you want to archive unit "${archiveRoom.label}"?`}
          submessage="Archived units will no longer appear in active lists. Because this room has no active tenancy, it is safe to archive."
          confirmLabel="Archive Unit"
          confirmClass="bg-rose-600 hover:bg-rose-700"
          error={archiveError}
          onConfirm={handleArchiveRoom}
          onCancel={() => { setArchiveRoom(null); setArchiveError(''); }}
          loading={submitting}
        />
      )}
    </div>
  );
}
