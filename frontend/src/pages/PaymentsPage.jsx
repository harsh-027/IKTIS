import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { paymentApi, tenantApi } from '../services/api.js';
import Modal from '../components/Dialog.jsx';

// ─── Currency & Date Formatting Helpers ─────────────────────────────────────

function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
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
      timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
}

// ─── Printable Receipt Component (Stitch Theme) ─────────────────────────────

function PrintableReceipt({ receipt, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  const isVoided = receipt.status === 'VOIDED';

  return (
    <Modal title="Payment Receipt Voucher" onClose={onClose} maxWidth="max-w-2xl">
      <div id="printable-receipt" className="space-y-4 text-ink print:p-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 24px;
              margin: 0;
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
          }
        ` }} />

        {/* Status Alert if Voided */}
        {isVoided && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-rose-600 shrink-0 mt-0.5">warning</span>
            <div>
              <p className="font-bold">PAYMENT RECORD VOIDED</p>
              <p className="mt-0.5"><strong>Reason:</strong> {receipt.voidReason || 'Not specified'}</p>
              {receipt.voidedAt && (
                <p className="text-[11px] text-rose-600 mt-0.5">Voided on {formatDate(receipt.voidedAt)}</p>
              )}
            </div>
          </div>
        )}

        {/* Receipt Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">domain</span>
              <span>IKTIS • Rental Management</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-ink mt-1">Official Rent Receipt</h3>
            <p className="text-xs text-ink-muted mt-0.5 font-mono">Voucher No. {receipt.receiptNumber}</p>
          </div>
          <div className="sm:text-right">
            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
              isVoided
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isVoided ? 'bg-rose-600' : 'bg-emerald-600'}`}></span>
              <span>{receipt.status}</span>
            </span>
            <p className="text-xs text-ink-muted mt-1.5">
              Payment Date: <span className="font-semibold text-ink">{formatDate(receipt.paidAt)}</span>
            </p>
          </div>
        </div>

        {/* Landlord & Tenant Metadata Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-canvas-soft rounded-xl border border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block mb-1">
              Received By (Landlord)
            </span>
            <p className="text-sm font-semibold text-ink">{receipt.landlord?.name || 'Property Owner'}</p>
            {receipt.landlord?.email && (
              <p className="text-xs text-ink-muted">{receipt.landlord.email}</p>
            )}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block mb-1">
              Received From (Tenant)
            </span>
            <p className="text-sm font-semibold text-ink">{receipt.tenant?.fullName || 'Tenant'}</p>
            {receipt.tenant?.phone && (
              <p className="text-xs text-ink-muted">{receipt.tenant.phone}</p>
            )}
          </div>
        </div>

        {/* Payment Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 bg-canvas-soft/80 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase text-ink-muted block font-medium">Payment Method</span>
            <span className="font-semibold text-ink">{receipt.method || 'Cash'}</span>
          </div>
          <div className="p-2.5 bg-canvas-soft/80 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase text-ink-muted block font-medium">Reference / UTR</span>
            <span className="font-semibold text-ink font-mono">{receipt.reference || '—'}</span>
          </div>
          <div className="p-2.5 bg-canvas-soft/80 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase text-ink-muted block font-medium">Recorded Date</span>
            <span className="font-semibold text-ink">{formatDate(receipt.createdAt)}</span>
          </div>
        </div>

        {/* Allocations Breakdown */}
        <div>
          <span className="text-xs font-bold uppercase text-ink-muted tracking-wider block mb-2">
            Charges Cleared / Allocated
          </span>
          <div className="border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-soft text-ink-muted border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Period & Room</th>
                  <th className="py-2.5 px-3 text-right">Charge Due</th>
                  <th className="py-2.5 px-3 text-right">Allocated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(receipt.allocations || []).map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-canvas-soft/40">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-ink">{alloc.period}</div>
                      <div className="text-[11px] text-ink-muted">
                        {alloc.propertyName} • {alloc.roomLabel}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-ink-muted tabular-nums">
                      {formatINR(alloc.chargeAmountDue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-ink tabular-nums">
                      {formatINR(alloc.amountAllocated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary Card */}
        <div className="p-4 bg-canvas-soft rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="text-xs text-ink-muted uppercase tracking-wider block font-medium">
              Tenant Remaining Outstanding
            </span>
            <span className="text-base font-bold text-rose-700 tabular-nums">
              {formatINR(receipt.tenantCurrentOutstanding)}
            </span>
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-ink-muted uppercase tracking-wider block font-medium">
              Total Amount Paid
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight tabular-nums">
              {formatINR(receipt.amount)}
            </span>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="no-print pt-3 flex items-center justify-end gap-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink rounded-full min-h-[40px] cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-focus rounded-full min-h-[40px] inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Print Voucher</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Void Payment Modal ─────────────────────────────────────────────────────

function VoidPaymentModal({ payment, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Please provide a valid explanation (at least 3 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await paymentApi.void(payment.id, { reason: reason.trim() });
      if (res.data?.success) {
        onSuccess();
      } else {
        setError(res.data?.message || 'Failed to void payment.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to void payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Void Payment Transaction" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">policy</span>
          <div>
            <p className="font-bold text-ink">Important Audit Notice</p>
            <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
              Voiding payment <strong>{payment.receiptNumber}</strong> ({formatINR(payment.amount)}) will immediately invalidate its allocations and restore the tenant&apos;s outstanding balance. This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">
            Audit Reason for Voiding <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Cheque returned unpaid, entered wrong tenant, duplicate record..."
            className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-border bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition"
            required
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink rounded-full min-h-[40px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-full min-h-[40px] cursor-pointer transition active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {submitting ? 'Voiding...' : 'Confirm Void'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Record Payment Modal (Stitch Theme) ────────────────────────────────────

function RecordPaymentModal({ initialTenantId = '', onClose, onSuccess }) {
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(initialTenantId);
  const [outstandingData, setOutstandingData] = useState(null);
  const [loadingOutstanding, setLoadingOutstanding] = useState(false);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('UPI');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [allocationMode, setAllocationMode] = useState('fifo');
  const [manualAllocations, setManualAllocations] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTenants() {
      try {
        const res = await tenantApi.list();
        if (res.data?.success) {
          setTenants(res.data.data.tenants || []);
        }
      } catch (err) {
        console.error('Failed to load tenants:', err);
      }
    }
    loadTenants();
  }, []);

  const fetchOutstanding = useCallback(async (tenantId) => {
    if (!tenantId) {
      setOutstandingData(null);
      return;
    }
    setLoadingOutstanding(true);
    setError(null);
    try {
      const res = await paymentApi.getTenantOutstanding(tenantId);
      if (res.data?.success) {
        setOutstandingData(res.data.data);
        setAmount((prev) => (!prev && res.data.data.totalOutstanding > 0 ? String(res.data.data.totalOutstanding) : prev));
        setManualAllocations({});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tenant outstanding charges.');
    } finally {
      setLoadingOutstanding(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      fetchOutstanding(selectedTenantId);
    }
  }, [selectedTenantId, fetchOutstanding]);

  const handleManualAllocChange = (chargeId, val) => {
    const num = Number(val) || 0;
    setManualAllocations((prev) => ({
      ...prev,
      [chargeId]: num,
    }));
  };

  const manualTotal = Object.values(manualAllocations).reduce((sum, v) => sum + v, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than ₹0.');
      return;
    }

    if (!selectedTenantId) {
      setError('Please select a tenant.');
      return;
    }

    if (outstandingData && numAmount > outstandingData.totalOutstanding) {
      setError(`Payment amount (${formatINR(numAmount)}) exceeds tenant's total outstanding balance (${formatINR(outstandingData.totalOutstanding)}). Overpayments are not supported.`);
      return;
    }

    let payloadAllocations = null;
    if (allocationMode === 'manual') {
      const allocList = Object.entries(manualAllocations)
        .filter(([, v]) => v > 0)
        .map(([rentChargeId, amt]) => ({ rentChargeId, amount: amt }));

      if (allocList.length === 0) {
        setError('Please allocate amounts to at least one charge.');
        return;
      }

      if (Math.abs(manualTotal - numAmount) > 0.01) {
        setError(`Sum of manual allocations (${formatINR(manualTotal)}) must equal the payment amount (${formatINR(numAmount)}).`);
        return;
      }

      payloadAllocations = allocList;
    }

    setSubmitting(true);

    try {
      const res = await paymentApi.record({
        tenantId: selectedTenantId,
        amount: numAmount,
        paidAt,
        method: method || 'Cash',
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        allocationMode,
        ...(payloadAllocations ? { allocations: payloadAllocations } : {}),
      });

      if (res.data?.success) {
        onSuccess(res.data.data.payment);
      } else {
        setError(res.data?.message || 'Failed to record payment.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <Modal title="Record Rent Payment" onClose={onClose} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Tenant Selection Tile (Stitch Card) */}
        <div className="bg-canvas-soft rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Assigned Tenant <span className="text-rose-500">*</span>
            </span>
            {outstandingData && (
              <span className="text-xs font-semibold text-rose-700 tabular-nums">
                Due: {formatINR(outstandingData.totalOutstanding)}
              </span>
            )}
          </div>

          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="w-full h-11 px-3.5 text-base sm:text-sm rounded-xl border border-border bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            required
          >
            <option value="">— Select Tenant to Allocate Payment —</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName} {t.currentTenancy ? `• ${t.currentTenancy.propertyName} (${t.currentTenancy.roomLabel})` : ''}
              </option>
            ))}
          </select>

          {loadingOutstanding && (
            <div className="text-xs text-ink-muted animate-pulse flex items-center gap-1.5 pt-1">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <span>Loading outstanding ledger charges...</span>
            </div>
          )}

          {outstandingData && (
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-ink-muted">
                {outstandingData.charges.length} unpaid charge{outstandingData.charges.length !== 1 ? 's' : ''} on record
              </span>
              {outstandingData.totalOutstanding > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(outstandingData.totalOutstanding))}
                  className="text-primary font-semibold hover:underline"
                >
                  Pay Full Balance ({formatINR(outstandingData.totalOutstanding)})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Amount & Date Card */}
        <div className="bg-canvas rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Payment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-ink-muted pointer-events-none select-none">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 pl-9 pr-3.5 rounded-xl border border-border bg-canvas text-ink text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full h-11 px-3.5 text-base sm:text-sm rounded-xl border border-border bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                required
              />
            </div>
          </div>

          {/* Payment Method Segmented Chips (Stitch) */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Payment Method</label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-canvas-soft rounded-xl text-center">
              {['UPI', 'Cash'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition active:scale-[0.98] ${
                    method === m
                      ? 'bg-canvas text-primary shadow-sm font-bold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Allocation Strategy Section (Stitch Radio Cards) */}
        {outstandingData && outstandingData.charges.length > 0 && (
          <div className="bg-canvas rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink">Allocation Strategy</span>
              <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                Smart Allocation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                onClick={() => setAllocationMode('fifo')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  allocationMode === 'fifo'
                    ? 'border-primary bg-primary/5 text-ink'
                    : 'border-border bg-canvas text-ink-muted hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="alloc_mode"
                  checked={allocationMode === 'fifo'}
                  onChange={() => setAllocationMode('fifo')}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold block text-ink">Auto (FIFO)</span>
                  <span className="text-[11px] text-ink-muted block mt-0.5">Clears oldest rent obligations first</span>
                </div>
              </label>

              <label
                onClick={() => setAllocationMode('manual')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  allocationMode === 'manual'
                    ? 'border-primary bg-primary/5 text-ink'
                    : 'border-border bg-canvas text-ink-muted hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="alloc_mode"
                  checked={allocationMode === 'manual'}
                  onChange={() => setAllocationMode('manual')}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold block text-ink">Manual Selection</span>
                  <span className="text-[11px] text-ink-muted block mt-0.5">Specify amounts per rent charge</span>
                </div>
              </label>
            </div>

            {/* Manual Allocation Breakdown Checklist */}
            {allocationMode === 'manual' && (
              <div className="mt-3 p-3 bg-canvas-soft rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs pb-1 border-b border-border/50">
                  <span className="font-semibold text-ink">Select charge coverage:</span>
                  <span className={`font-bold tabular-nums ${Math.abs(manualTotal - Number(amount || 0)) < 0.01 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    Allocated: {formatINR(manualTotal)} / {formatINR(Number(amount || 0))}
                  </span>
                </div>
                {outstandingData.charges.map((c) => (
                  <div key={c.id} className="p-2.5 bg-canvas rounded-lg border border-border flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="font-semibold text-ink block">{c.period} ({c.roomLabel})</span>
                      <span className="text-[11px] text-ink-muted block">
                        Due: {formatINR(c.amountDue)} • Remaining: <strong className="text-rose-700">{formatINR(c.outstanding)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-ink-muted">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        max={c.outstanding}
                        min="0"
                        value={manualAllocations[c.id] || ''}
                        onChange={(e) => handleManualAllocChange(c.id, e.target.value)}
                        placeholder="0.00"
                        className="w-24 px-2 py-1 text-xs rounded border border-border text-right bg-canvas font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink rounded-full min-h-[40px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || (outstandingData && outstandingData.totalOutstanding <= 0)}
            className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-focus rounded-full min-h-[40px] cursor-pointer transition active:scale-[0.98] shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{submitting ? 'Recording...' : `Confirm & Record Payment (${formatINR(Number(amount || 0))})`}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Payments Page ─────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [paymentToVoid, setPaymentToVoid] = useState(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentApi.list({ status: statusFilter });
      if (res.data?.success) {
        setPayments(res.data.data.payments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleOpenReceipt = async (paymentId) => {
    try {
      const res = await paymentApi.getReceipt(paymentId);
      if (res.data?.success) {
        setViewingReceipt(res.data.data.receipt);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load receipt.');
    }
  };

  useEffect(() => {
    if (searchParams.get('action') === 'record') {
      setShowRecordModal(true);
    }
  }, [searchParams]);

  const validPayments = payments.filter((p) => !p.isVoided);
  const voidedPayments = payments.filter((p) => p.isVoided);
  const totalCollected = validPayments.reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const tenantName = p.tenant?.fullName?.toLowerCase() || '';
    const ref = p.reference?.toLowerCase() || '';
    const receiptNum = p.receiptNumber?.toLowerCase() || '';
    return tenantName.includes(q) || ref.includes(q) || receiptNum.includes(q);
  });

  return (
    <div className="space-y-5 pb-8">
      {/* ─── Page Title & Header Actions ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
            Payments &amp; Receipts
          </h1>
          <p className="text-xs text-ink-muted">
            Track verified ledger payments, issue printable vouchers, and manage audit records
          </p>
        </div>
        <button
          onClick={() => setShowRecordModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary-focus text-white text-xs sm:text-sm font-semibold transition active:scale-[0.98] shadow-sm min-h-[40px] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Record Payment</span>
        </button>
      </div>

      {/* ─── Bento Summary KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-canvas rounded-[18px] border border-slate-100 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Total Collected
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight tabular-nums">
            {loading ? '—' : formatINR(totalCollected)}
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-0.5 block">
            Across valid verified ledger records
          </span>
        </div>

        <div className="bg-canvas rounded-[18px] border border-slate-100 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Valid Payments
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight tabular-nums">
            {loading ? '—' : validPayments.length}
          </div>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            Active transactions
          </span>
        </div>

        <div className="bg-canvas rounded-[18px] border border-slate-100 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
            Voided Records
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-rose-700 tracking-tight tabular-nums">
            {loading ? '—' : voidedPayments.length}
          </div>
          <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">
            Preserved for strict audit trail
          </span>
        </div>
      </div>

      {/* ─── Search & Segmented Filter Bar ────────────────────────────── */}
      <div className="space-y-2">
        <div className="relative flex items-center w-full max-w-3xl">
          <span className="material-symbols-outlined absolute left-3.5 text-ink-muted text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenant name, receipt number, or reference..."
            className="w-full h-11 pl-10 pr-24 rounded-full bg-canvas text-ink text-xs sm:text-sm border border-border shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            aria-label="Search payment records"
          />
          <span className="absolute right-3 text-[11px] font-medium text-ink-muted bg-canvas-soft px-2.5 py-1 rounded-full border border-border">
            {filteredPayments.length} total
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {['all', 'valid', 'voided'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`h-9 px-4 rounded-full text-xs font-semibold tracking-wider shrink-0 transition active:scale-[0.98] cursor-pointer ${
                statusFilter === status
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-canvas text-ink hover:bg-canvas-soft border border-border'
              }`}
            >
              {status[0].toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Payments Content ─────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-canvas rounded-[18px] border border-slate-100 p-8 text-center text-ink-muted text-xs shadow-sm">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          <span>Loading payment transaction records...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-canvas rounded-[18px] border border-slate-100 p-8 sm:p-12 text-center shadow-sm space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-canvas-soft flex items-center justify-center mx-auto mb-3 text-ink-muted">
            <span className="material-symbols-outlined text-[36px]">payments</span>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-ink">No payments found</h2>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search query or filter.'
              : 'Record rent payments to start building your verified financial ledger and generating receipts.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={() => setShowRecordModal(true)}
              className="mt-3 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary-focus text-white text-xs sm:text-sm font-semibold transition active:scale-[0.98] shadow-sm min-h-[40px] cursor-pointer mx-auto"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Record First Payment</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((p) => {
            const initials = p.tenant?.fullName
              ? p.tenant.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
              : 'TN';

            return (
              <div
                key={p.id}
                className={`bg-canvas rounded-[18px] border border-slate-100 p-4 sm:p-5 shadow-sm transition hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  p.isVoided ? 'border-rose-200 bg-rose-50/15' : ''
                }`}
              >
                {/* Left: Avatar, Tenant, Voucher #, Date */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-canvas ${
                    p.isVoided ? 'bg-rose-100 text-rose-700' : 'bg-primary/10 text-primary'
                  }`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/tenants/${p.tenantId}`}
                        className="text-sm font-bold text-ink hover:text-primary transition truncate"
                      >
                        {p.tenant?.fullName || 'Tenant'}
                      </Link>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        p.isVoided
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {p.isVoided ? 'Voided' : 'Valid'}
                      </span>
                    </div>
                    <div className="text-xs text-ink-muted flex items-center gap-2 flex-wrap mt-0.5 font-mono">
                      <span>Voucher: {p.receiptNumber}</span>
                      <span>•</span>
                      <span>{formatDate(p.paidAt)}</span>
                      <span>•</span>
                      <span className="font-sans font-medium text-ink">{p.method} {p.reference ? `(${p.reference})` : ''}</span>
                    </div>
                    {p.isVoided && p.voidReason && (
                      <p className="text-[11px] text-rose-700 mt-1 font-sans">
                        <strong>Reason:</strong> {p.voidReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                  <div className="text-left sm:text-right">
                    <span className={`text-base sm:text-lg font-bold tabular-nums block ${
                      p.isVoided ? 'text-ink-muted line-through' : 'text-emerald-700'
                    }`}>
                      {formatINR(p.amount)}
                    </span>
                    <span className="text-[10px] text-ink-muted block">
                      {p.allocations?.length || 0} charge allocation{p.allocations?.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenReceipt(p.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-full border border-border inline-flex items-center gap-1 transition active:scale-[0.98] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">print</span>
                      <span>Receipt</span>
                    </button>
                    {!p.isVoided && (
                      <button
                        onClick={() => setPaymentToVoid(p)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-full border border-border hover:border-rose-200 transition active:scale-[0.98] cursor-pointer"
                      >
                        Void
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordModal && (
        <RecordPaymentModal
          onClose={() => setShowRecordModal(false)}
          onSuccess={(newPayment) => {
            setShowRecordModal(false);
            loadPayments();
            handleOpenReceipt(newPayment.id);
          }}
        />
      )}

      {/* Printable Receipt Modal */}
      {viewingReceipt && (
        <PrintableReceipt
          receipt={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      )}

      {/* Void Payment Modal */}
      {paymentToVoid && (
        <VoidPaymentModal
          payment={paymentToVoid}
          onClose={() => setPaymentToVoid(null)}
          onSuccess={() => {
            setPaymentToVoid(null);
            loadPayments();
          }}
        />
      )}
    </div>
  );
}
