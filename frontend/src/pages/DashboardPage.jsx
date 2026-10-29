import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardApi, paymentApi } from '../services/api.js';
import Dialog from '../components/Dialog.jsx';

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

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Selected Month (YYYY-MM), defaults to current UTC month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

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

  const handleSetCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(`${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getSummary(selectedMonth);
      if (res.data?.success) {
        setDashboardData(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load dashboard summary.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const openReceipt = async (paymentId) => {
    setLoadingReceipt(true);
    try {
      const res = await paymentApi.getReceipt(paymentId);
      if (res.data?.success) {
        setReceiptData(res.data.data.receipt);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load receipt.');
    } finally {
      setLoadingReceipt(false);
    }
  };

  const portfolio = dashboardData?.portfolio || {
    totalProperties: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    activeTenants: 0,
    occupancyRate: 0,
  };

  const monthly = dashboardData?.monthlyFinancials || {
    month: selectedMonth,
    rentCharged: 0,
    paymentsCollected: 0,
    outstandingRent: 0,
    overdueRent: 0,
    collectionRate: 0,
    chargesCount: 0,
  };

  const lifetime = dashboardData?.lifetimeFinancials || {
    lifetimeCharged: 0,
    lifetimeCollected: 0,
    lifetimeOutstanding: 0,
    totalOverdue: 0,
    totalPaymentsCount: 0,
  };

  const recentPayments = dashboardData?.recentPayments || [];
  const upcomingDue = dashboardData?.upcomingDue || [];

  const [y, m] = selectedMonth.split('-').map(Number);
  const formattedMonthHeader = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const nowUTC = new Date();
  const currentMonthStr = `${nowUTC.getUTCFullYear()}-${String(nowUTC.getUTCMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonth === currentMonthStr;

  return (
    <div className="space-y-5 pb-8">
      {/* ─── Greeting & Period Context Bar ────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted font-medium mb-0.5">
              <span className="material-symbols-outlined text-[15px] text-primary">domain</span>
              <span>Portfolio Overview • {portfolio.totalProperties} Properties</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Welcome back, {user?.name?.split(' ')[0] || 'Landlord'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/rent-charges?month=${selectedMonth}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white font-medium text-xs sm:text-sm active:scale-[0.98] transition-transform duration-100 shadow-sm min-h-[40px] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Bulk Rent</span>
            </Link>
          </div>
        </div>

        {/* Period Filter Pills & Month Navigator */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center bg-canvas rounded-full border border-border p-1 shadow-sm shrink-0">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-canvas-soft min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:scale-95 transition"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span aria-live="polite" className="px-4 text-xs font-semibold text-ink tracking-tight whitespace-nowrap">
              {formattedMonthHeader}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-canvas-soft min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:scale-95 transition"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <button
            onClick={handleSetCurrentMonth}
            aria-pressed={isCurrentMonth}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap active:scale-[0.98] transition-transform shrink-0 border ${
              isCurrentMonth
                ? 'bg-canvas-soft border-border text-ink font-semibold'
                : 'bg-canvas border-border text-ink hover:bg-canvas-soft'
            }`}
          >
            This Month
          </button>

          <Link
            to="/payments?action=record"
            className="px-3.5 py-1.5 rounded-full bg-canvas-soft text-ink hover:bg-surface-container text-xs font-medium whitespace-nowrap active:scale-[0.98] transition-transform shrink-0 inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">payments</span>
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-[18px] text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-600 text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ─── Key Financial Metrics 2x2 / 4-Col Bento Grid ───────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Expected / Charged */}
        <div className="p-4 rounded-[18px] bg-canvas flex flex-col justify-between shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-muted font-medium">Total Expected</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-ink-muted">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold text-ink tabular-nums tracking-tight">
              {loading ? '—' : formatINR(monthly.rentCharged)}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-canvas-soft text-ink">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span>{monthly.chargesCount} leases</span>
              </span>
              <span className="text-badge-paid-text font-medium">Safe Roll</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 2: Collected */}
        <div className="p-4 rounded-[18px] bg-canvas flex flex-col justify-between shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-muted font-medium">Collected</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold text-ink tabular-nums tracking-tight">
              {loading ? '—' : formatINR(monthly.paymentsCollected)}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-badge-paid-bg text-badge-paid-text font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{monthly.collectionRate}% done</span>
              </span>
              <span className="text-ink-muted truncate max-w-[75px]">
                {loading ? '' : `${formatINR(monthly.outstandingRent)} left`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, monthly.collectionRate))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Outstanding / Overdue */}
        <div className="p-4 rounded-[18px] bg-canvas flex flex-col justify-between shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-muted font-medium">Outstanding</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${monthly.overdueRent > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
              <span className="material-symbols-outlined text-[18px]">schedule</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold text-ink tabular-nums tracking-tight">
              {loading ? '—' : formatINR(monthly.outstandingRent)}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                monthly.overdueRent > 0
                  ? 'bg-badge-overdue-bg text-badge-overdue-text'
                  : 'bg-canvas-soft text-ink'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${monthly.overdueRent > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <span>{monthly.overdueRent > 0 ? `${formatINR(monthly.overdueRent)} overdue` : 'On schedule'}</span>
              </span>
              <span className="text-[11px] font-medium text-ink-muted">
                {monthly.overdueRent > 0 ? 'Action req.' : 'Healthy'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all duration-300 ${monthly.overdueRent > 0 ? 'bg-rose-500' : 'bg-slate-300'}`}
                style={{
                  width: monthly.rentCharged > 0
                    ? `${Math.min(100, (monthly.outstandingRent / monthly.rentCharged) * 100)}%`
                    : '0%'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 4: Occupancy */}
        <div className="p-4 rounded-[18px] bg-canvas flex flex-col justify-between shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-muted font-medium">Occupancy</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">bed</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold text-ink tabular-nums tracking-tight">
              {loading ? '—' : `${portfolio.occupancyRate}%`}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-primary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span>{portfolio.occupiedRooms}/{portfolio.totalRooms} rooms</span>
              </span>
              <span className="text-ink-muted">{portfolio.vacantRooms} vacant</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, portfolio.occupancyRate))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Idempotency & Bulk Generation Banner ──────────────────────── */}
      <div className="p-4 rounded-[18px] bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-canvas border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-ink">{formattedMonthHeader} Rent Roll</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Safe Check Active
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5 leading-snug">
              {monthly.chargesCount} charges calculated. Idempotent bulk generation and strict landlord isolation enforced.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-1 sm:pt-0">
          {monthly.chargesCount > 0 ? (
            <Link
              to={`/rent-charges?month=${selectedMonth}`}
              className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-transform"
            >
              <span>Review Charges</span>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="px-3.5 py-2 rounded-xl border border-border bg-canvas-soft text-ink-muted text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
            >
              <span>No charges to review</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Cumulative Lifetime Totals (Phase 7 Financial Ledger Banner) ──── */}
      <div className="p-4 sm:p-5 rounded-[18px] bg-canvas border border-border shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">account_balance</span>
              <span className="text-xs font-bold text-ink">
                Cumulative lifetime totals
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Historical ledger across all recorded periods (excludes voided payments)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-surface-container-low/60 border border-slate-100">
            <span className="text-[11px] text-ink-muted block font-medium">Lifetime Charged</span>
            <span className="text-base sm:text-lg font-bold text-ink">
              {loading ? '—' : formatINR(lifetime.lifetimeCharged)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
            <span className="text-[11px] text-emerald-800 block font-medium">Lifetime Collected</span>
            <span className="text-base sm:text-lg font-bold text-emerald-700">
              {loading ? '—' : formatINR(lifetime.lifetimeCollected)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/50">
            <span className="text-xs text-amber-800 block font-medium">Lifetime Outstanding</span>
            <span className="text-base sm:text-lg font-bold text-amber-700">
              {loading ? '—' : formatINR(lifetime.lifetimeOutstanding)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100/50">
            <span className="text-[11px] text-rose-800 block font-medium">Total Overdue</span>
            <span className={`text-base sm:text-lg font-bold ${lifetime.totalOverdue > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {loading ? '—' : formatINR(lifetime.totalOverdue)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Dual Column: Upcoming Due & Recent Payments ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Rent Due Dates */}
        <div className="p-4 sm:p-5 rounded-[18px] bg-canvas border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-ink flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-600 text-[20px]">pending_actions</span>
                  <span>Upcoming Rent Obligations</span>
                </h2>
                <p className="text-[11px] text-ink-muted">Rent charges requiring collection</p>
              </div>
              <Link
                to="/payments?action=record"
                className="text-xs font-medium text-primary hover:underline min-h-[36px] inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">payments</span>
                <span>Record Payment</span>
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-ink-muted animate-pulse">
                Checking upcoming obligations...
              </div>
            ) : upcomingDue.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted space-y-1">
                <span className="material-symbols-outlined text-emerald-600 text-[28px] block mx-auto">task_alt</span>
                <p className="font-medium text-ink">No upcoming pending charges scheduled.</p>
                <p className="text-[11px] text-ink-muted">All active tenants are currently settled.</p>
              </div>
            ) : (
              <div className="space-y-2 mt-3">
                {upcomingDue.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-3 bg-canvas-soft/70 hover:bg-canvas-soft rounded-xl border border-slate-100 text-xs flex items-center justify-between gap-2 transition"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-ink block truncate">{ch.tenantName}</span>
                      <span className="text-[11px] text-ink-muted block truncate">
                        {ch.propertyName} • {ch.roomLabel}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-ink block tabular-nums">{formatINR(ch.outstanding)}</span>
                      <span className="text-[10px] text-rose-600 font-medium block">Due {formatDate(ch.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/50 text-right">
            <Link
              to={`/rent-charges?month=${selectedMonth}`}
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              <span>Manage all charges for {formattedMonthHeader}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="p-4 sm:p-5 rounded-[18px] bg-canvas border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-ink flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">payments</span>
                  <span>Recent Payments</span>
                </h2>
                <p className="text-[11px] text-ink-muted">Latest verified ledger transactions</p>
              </div>
              <Link
                to="/payments"
                className="text-xs font-semibold text-primary hover:underline min-h-[36px] inline-flex items-center gap-1"
              >
                <span>View All</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-ink-muted animate-pulse">
                Loading recent payments...
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted space-y-1">
                <span className="material-symbols-outlined text-slate-400 text-[28px] block mx-auto">receipt_long</span>
                <p className="font-medium text-ink">No payments recorded yet.</p>
                <p className="text-[11px] text-ink-muted">Payments recorded through FIFO or manual selection will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2 mt-3">
                {recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${
                      p.isVoided
                        ? 'border-rose-200 bg-rose-50/20 text-ink-muted'
                        : 'border-slate-100 bg-canvas-soft/70 hover:bg-canvas-soft text-ink'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-ink truncate">{p.tenant?.fullName || 'Tenant'}</span>
                        {p.isVoided && (
                          <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-rose-100 text-rose-700 uppercase">
                            Voided
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-ink-muted block font-mono">
                        {p.receiptNumber} • {formatDate(p.paidAt)} • {p.method}
                      </span>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <span className={`font-bold block tabular-nums ${p.isVoided ? 'line-through text-ink-muted' : 'text-emerald-700'}`}>
                          {formatINR(p.amount)}
                        </span>
                      </div>
                      <button
                        onClick={() => openReceipt(p.id)}
                        title="Open Printable Receipt"
                        className="px-2.5 py-1 text-xs text-primary hover:bg-primary/10 rounded-lg min-h-[32px] cursor-pointer inline-flex items-center gap-1 transition"
                      >
                        <span className="material-symbols-outlined text-[16px]">receipt</span>
                        <span className="hidden sm:inline">Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/50 text-right">
            <Link
              to="/payments"
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              <span>View transaction ledger & history</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Printable Receipt Viewer Modal ────────────────────────────── */}
      {receiptData && (
        <Dialog
          title={`Payment Receipt • ${receiptData.receiptNumber}`}
          onClose={() => setReceiptData(null)}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 bg-canvas-soft rounded-xl">
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block">Tenant</span>
                  <span className="font-semibold text-sm text-ink">{receiptData.tenant?.fullName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-ink-muted uppercase block">Amount Paid</span>
                  <span className="font-bold text-base text-emerald-700 tabular-nums">
                    {formatINR(receiptData.amount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-surface-container-low/50 rounded-xl">
                <div>Date: <strong>{formatDate(receiptData.paidAt)}</strong></div>
                <div>Method: <strong>{receiptData.method}</strong></div>
                <div>Reference: <strong>{receiptData.reference || '—'}</strong></div>
                <div>
                  Status:{' '}
                  <strong className={receiptData.status === 'VOIDED' ? 'text-rose-600' : 'text-emerald-700'}>
                    {receiptData.status}
                  </strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <button
                onClick={() => setReceiptData(null)}
                className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink rounded-full min-h-[40px] cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary rounded-full min-h-[40px] cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
