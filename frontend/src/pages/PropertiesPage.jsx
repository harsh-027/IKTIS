import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { propertyApi } from '../services/api.js';
import Modal from '../components/Dialog.jsx';
import Icons8Icon from '../components/Icons8Icon.jsx';

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
<Icons8Icon icon="error" className="text-[16px] text-rose-600" />
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
<Icons8Icon icon="error" className="text-[16px] text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex items-start gap-3 mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
<Icons8Icon icon="warning" className="text-amber-600 text-[20px] shrink-0 mt-0.5" />
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

  return (
    <div className="iktis-internal space-y-4 pb-8">
      {/* ─── Top Stats Hero Overview Card (Stitch Calm Precision) ───────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="min-w-0 font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">Properties</h1>
          <button
            id="btn-create-property"
            onClick={() => setShowCreate(true)}
            className="flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-tertiary-fixed-dim px-4 py-2 text-xs font-medium text-primary shadow-sm transition-colors hover:bg-tertiary-fixed sm:text-sm"
          >
<Icons8Icon icon="add" className="text-[18px]" />
            <span>Add Property</span>
          </button>
        </div>

      </div>

      {/* ─── Search & Segmented Filter Bar (Stitch Horizontal Scroll) ───── */}
      <div className="space-y-2">
        <div className="relative flex items-center w-full">
          <Icons8Icon icon="search" className="absolute left-3.5 text-ink-muted text-[18px] pointer-events-none" />
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

        <div className="flex w-full min-w-0 max-w-full items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
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
<Icons8Icon icon="unavailable" className="text-[28px]" />
          </div>
          <p className="text-sm font-semibold text-ink mb-1">
            {searchQuery ? 'No matching properties found' : 'No properties in this category'}
          </p>
          <p className="text-xs text-ink-muted mb-5 max-w-xs mx-auto">
            {searchQuery
              ? 'Try adjusting your search query or clear the filter.'
              : 'Add a property to manage rooms and tenancies.'}
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
                className={`rounded-2xl border border-border/40 bg-white p-3 transition-shadow sm:p-4 ${
                  isArchived ? 'opacity-70 bg-canvas-soft/40' : ''
                }`}
              >
                <div className="rounded-xl bg-surface-container p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-high text-secondary">
<Icons8Icon icon="apartment" className="text-[24px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                      <Link
                        to={`/properties/${property.id}`}
                        className="min-w-0 truncate font-display text-lg font-medium leading-tight text-primary hover:text-secondary sm:text-xl"
                      >
                        {property.name}
                      </Link>
                      {isArchived ? (
                        <span className="inline-flex shrink-0 items-center rounded bg-tertiary-fixed px-1.5 py-0.5 font-label text-[10px] font-semibold uppercase text-on-tertiary-fixed-variant">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          <span className="ml-1">Archived</span>
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center rounded bg-secondary-container/70 px-1.5 py-0.5 font-label text-[10px] font-semibold uppercase text-on-secondary-fixed">
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-on-surface-variant">{property.address}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-low px-3 py-2 text-xs text-on-surface-variant">
                    <span><strong className="font-semibold text-primary">{totalR}</strong> Rooms</span>
                    <span className="text-border" aria-hidden="true">•</span>
                    <span><strong className="font-medium text-secondary">{occR}</strong> Occupied{totalR > 0 ? ` (${occPct}%)` : ''}</span>
                    <span className="text-border" aria-hidden="true">•</span>
                    <span className={availR > 0 ? 'font-medium text-on-tertiary-fixed-variant' : ''}>{availR} Vacant</span>
                  </div>
                </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 px-1 pt-3">
                    <Link
                      to={`/properties/${property.id}`}
                      className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-medium text-secondary transition-colors hover:bg-surface-low"
                    >
                      <span>View rooms</span>
<Icons8Icon icon="arrow_forward" className="text-[16px]" />
                    </Link>
                    {!isArchived && (
                      <>
                        <button
                          onClick={() => setEditProperty(property)}
                          className="inline-flex items-center justify-center min-h-[38px] px-3 py-1.5 rounded-full border border-border hover:bg-canvas-soft text-ink text-xs font-medium transition cursor-pointer active:scale-[0.98]"
                          aria-label={`Edit ${property.name}`}
                          title="Edit Property"
                        >
<Icons8Icon icon="edit" className="text-[16px]" />
                        </button>
                        <button
                          onClick={() => setArchiveProperty(property)}
                          className="inline-flex items-center justify-center min-h-[38px] px-3 py-1.5 rounded-full border border-border hover:bg-rose-50 hover:border-rose-200 text-ink-muted hover:text-rose-700 text-xs font-medium transition cursor-pointer active:scale-[0.98]"
                          aria-label={`Archive ${property.name}`}
                          title="Archive Property"
                        >
<Icons8Icon icon="archive" className="text-[16px]" />
                        </button>
                      </>
                    )}
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
