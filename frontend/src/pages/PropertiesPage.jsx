import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { propertyApi } from '../services/api.js';
import Modal from '../components/Dialog.jsx';

// ─── Property Form ────────────────────────────────────────────────────────────
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
        <label htmlFor="prop-name" className="block text-xs font-medium text-ink-muted mb-1">
          Property Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="prop-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sunrise Apartments, Tower B"
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas min-h-[44px] placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          disabled={loading}
          maxLength={191}
          required
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="prop-address" className="block text-xs font-medium text-ink-muted mb-1">
          Address <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="prop-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 12, MG Road, Bangalore – 560001"
          rows={3}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-ink bg-canvas placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
          disabled={loading}
          maxLength={255}
          required
        />
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-60 cursor-pointer inline-flex items-center justify-center shadow-sm"
        >
          {loading ? 'Saving…' : initial.id ? 'Save Changes' : 'Create Property'}
        </button>
      </div>
    </form>
  );
}

// ─── Confirm Archive Dialog ───────────────────────────────────────────────────
function ArchiveConfirmModal({ property, onConfirm, onCancel, loading, error }) {
  return (
    <Modal title="Archive Property" onClose={onCancel}>
      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
          <span>{error}</span>
        </div>
      )}
      <div className="flex items-start gap-3 mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
        <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">warning</span>
        <div className="text-xs space-y-1">
          <p className="font-semibold text-ink">
            Archive property &quot;{property.name}&quot;?
          </p>
          <p className="text-amber-800 leading-relaxed">
            Archiving will also archive all active rooms in this building. Historical financial ledgers and past receipts remain permanently preserved.
          </p>
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
          className="w-full sm:flex-1 px-4 py-2.5 min-h-[40px] rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-60 cursor-pointer inline-flex items-center justify-center shadow-sm"
        >
          {loading ? 'Archiving…' : 'Archive Property'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'available', 'archived'

  const [showCreate, setShowCreate] = useState(false);
  const [editProperty, setEditProperty] = useState(null);
  const [archiveProperty, setArchiveProperty] = useState(null);
  const [archiveError, setArchiveError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propertyApi.list({ includeArchived: true });
      if (res.data?.success) {
        setProperties(res.data.data.properties || []);
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      await propertyApi.create(data);
      setShowCreate(false);
      await loadProperties();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (data) => {
    setSubmitting(true);
    try {
      await propertyApi.update(editProperty.id, data);
      setEditProperty(null);
      await loadProperties();
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    setSubmitting(true);
    setArchiveError('');
    try {
      await propertyApi.archive(archiveProperty.id);
      setArchiveProperty(null);
      await loadProperties();
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

  // Filter properties based on tab, archive flag, and search query
  const filteredProperties = properties.filter((p) => {
    const isArchived = !!p.archivedAt;
    if (activeTab === 'archived') {
      if (!isArchived) return false;
    } else if (activeTab === 'available') {
      if (isArchived || (p.stats?.availableRooms ?? 0) === 0) return false;
    } else {
      // 'all' tab: follow includeArchived toggle
      if (isArchived && !includeArchived) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
  });

  // Calculate portfolio totals
  const totalPropertiesCount = properties.filter((p) => !p.archivedAt).length;
  const totalRoomsCount = properties
    .filter((p) => !p.archivedAt)
    .reduce((acc, p) => acc + (p.stats?.totalRooms ?? 0), 0);
  const totalAvailableRooms = properties
    .filter((p) => !p.archivedAt)
    .reduce((acc, p) => acc + (p.stats?.availableRooms ?? 0), 0);
  const totalOccupiedRooms = properties
    .filter((p) => !p.archivedAt)
    .reduce((acc, p) => acc + (p.stats?.occupiedRooms ?? 0), 0);
  const portfolioOccupancyRate = totalRoomsCount > 0
    ? Math.round((totalOccupiedRooms / totalRoomsCount) * 100)
    : 0;

  return (
    <div className="space-y-5 pb-8">
      {/* ─── Top Stats Hero Overview Card (Stitch Calm Precision) ───────── */}
      <div className="w-full bg-canvas rounded-[18px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[20px]">apartment</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                Properties & Buildings
              </h1>
              <p className="text-xs text-ink-muted">
                Manage your real estate portfolio, room inventory, and building occupancy
              </p>
            </div>
          </div>
          <button
            id="btn-create-property"
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary-focus text-white text-xs sm:text-sm font-semibold transition active:scale-[0.98] shadow-sm min-h-[40px] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>New Property</span>
          </button>
        </div>

        {/* Portfolio Occupancy Progress Bar & Quick Stats */}
        <div className="space-y-2 pt-1 border-t border-border/50">
          <div className="flex justify-between items-end text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block ring-2 ring-emerald-200"></span>
              <span className="font-semibold text-ink">Portfolio Occupancy</span>
            </div>
            <div className="flex items-baseline gap-1 font-bold text-ink">
              <span className="text-base text-primary tabular-nums">{portfolioOccupancyRate}%</span>
              <span className="text-[11px] text-ink-muted font-normal">capacity</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-l-full"
              style={{ width: `${portfolioOccupancyRate}%` }}
            ></div>
            <div
              className="h-full bg-emerald-400 transition-all duration-300 rounded-r-full"
              style={{ width: `${100 - portfolioOccupancyRate}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl bg-canvas-soft border border-slate-100">
              <span className="material-symbols-outlined text-primary text-[16px]">domain</span>
              <span className="font-semibold text-ink">{totalPropertiesCount}</span>
              <span className="text-ink-muted hidden sm:inline">Properties</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl bg-blue-50/60 border border-blue-100/60">
              <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
              <span className="font-semibold text-primary">{totalOccupiedRooms}</span>
              <span className="text-blue-700 hidden sm:inline">Occupied</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
              <span className="material-symbols-outlined text-emerald-700 text-[16px]">meeting_room</span>
              <span className="font-semibold text-emerald-700">{totalAvailableRooms}</span>
              <span className="text-emerald-700 hidden sm:inline">Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Search & Segmented Filter Bar (Stitch Horizontal Scroll) ───── */}
      <div className="space-y-2">
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3.5 text-ink-muted text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by building name or address..."
            className="w-full h-11 pl-10 pr-24 rounded-full bg-canvas text-ink text-xs sm:text-sm border border-border shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            aria-label="Search properties"
          />
          <span className="absolute right-3 text-[11px] font-medium text-ink-muted bg-canvas-soft px-2.5 py-1 rounded-full border border-border">
            {filteredProperties.length} total
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
              }`}
            >
              <span>All Properties</span>
              <span className="text-[11px] opacity-75">({totalPropertiesCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
                activeTab === 'available'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
              }`}
            >
              <span>Has Vacancy</span>
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
                activeTab === 'archived'
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
            <span>Include archived in &apos;All&apos;</span>
          </label>
        </div>
      </div>

      {/* ─── Property List ────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-canvas rounded-[18px] border border-slate-100 p-5 animate-pulse shadow-sm space-y-3">
              <div className="h-5 bg-canvas-soft rounded w-1/3" />
              <div className="h-3 bg-canvas-soft rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-16 bg-canvas rounded-[18px] border border-slate-100 p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-canvas-soft flex items-center justify-center mx-auto mb-3 text-ink-muted">
            <span className="material-symbols-outlined text-[28px]">domain_disabled</span>
          </div>
          <p className="text-sm font-semibold text-ink mb-1">
            {searchQuery ? 'No matching properties found' : 'No properties in this category'}
          </p>
          <p className="text-xs text-ink-muted mb-5 max-w-xs mx-auto">
            {searchQuery
              ? 'Try adjusting your search query or clear the filter.'
              : 'Add your first property to start managing rooms, tenancies, and monthly rent.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center justify-center min-h-[38px] px-4 py-1.5 rounded-full border border-border bg-canvas hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center justify-center min-h-[38px] px-4 py-1.5 rounded-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              + Create First Property
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProperties.map((property) => {
            const isArchived = !!property.archivedAt;
            const totalR = property.stats?.totalRooms ?? 0;
            const availR = property.stats?.availableRooms ?? 0;
            const occR = property.stats?.occupiedRooms ?? 0;
            const occPct = totalR > 0 ? Math.round((occR / totalR) * 100) : 0;

            return (
              <div
                key={property.id}
                className={`bg-canvas rounded-[18px] border border-slate-100 p-4 sm:p-5 transition hover:shadow-md relative overflow-hidden shadow-sm ${
                  isArchived ? 'opacity-70 bg-canvas-soft/40' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        to={`/properties/${property.id}`}
                        className="text-base font-bold text-ink hover:text-primary transition truncate flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[20px] text-primary">apartment</span>
                        <span>{property.name}</span>
                      </Link>
                      {isArchived ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-badge-partial-bg text-badge-partial-text border border-badge-partial-border">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          <span>Archived</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-badge-paid-bg text-badge-paid-text border border-badge-paid-border">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-ink-muted truncate max-w-xl">{property.address}</p>

                    {/* Quick unit indicators */}
                    <div className="flex items-center gap-2 sm:gap-3 mt-3 text-xs flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-canvas-soft text-ink font-medium">
                        <span className="material-symbols-outlined text-[14px] text-ink-muted">door_front</span>
                        <span>{totalR} units</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-primary font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        <span>{occR} occupied ({occPct}%)</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span>{availR} ready/vacant</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 w-full sm:w-auto justify-end shrink-0">
                    <Link
                      to={`/properties/${property.id}`}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 min-h-[38px] px-3.5 py-1.5 rounded-full bg-canvas-soft hover:bg-surface-container text-ink text-xs font-semibold transition active:scale-[0.98]"
                    >
                      <span>Manage Rooms</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                    {!isArchived && (
                      <>
                        <button
                          onClick={() => setEditProperty(property)}
                          className="inline-flex items-center justify-center min-h-[38px] px-3 py-1.5 rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer active:scale-[0.98]"
                          aria-label={`Edit ${property.name}`}
                          title="Edit Property"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => setArchiveProperty(property)}
                          className="inline-flex items-center justify-center min-h-[38px] px-3 py-1.5 rounded-full border border-border hover:bg-rose-50 hover:border-rose-200 text-ink-muted hover:text-rose-700 text-xs font-medium transition cursor-pointer active:scale-[0.98]"
                          aria-label={`Archive ${property.name}`}
                          title="Archive Property"
                        >
                          <span className="material-symbols-outlined text-[16px]">archive</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {showCreate && (
        <Modal title="Create New Property" onClose={() => setShowCreate(false)}>
          <PropertyForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={submitting}
          />
        </Modal>
      )}

      {editProperty && (
        <Modal title="Edit Property Details" onClose={() => setEditProperty(null)}>
          <PropertyForm
            initial={editProperty}
            onSubmit={handleEdit}
            onCancel={() => setEditProperty(null)}
            loading={submitting}
          />
        </Modal>
      )}

      {archiveProperty && (
        <ArchiveConfirmModal
          property={archiveProperty}
          error={archiveError}
          onConfirm={handleArchive}
          onCancel={() => { setArchiveProperty(null); setArchiveError(''); }}
          loading={submitting}
        />
      )}
    </div>
  );
}
