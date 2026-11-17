import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardApi, paymentApi } from '../services/api.js';
import Dialog from '../components/Dialog.jsx';
import Icons8Icon from '../components/Icons8Icon.jsx';

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
  const navigate = useNavigate();
  const { user } = useAuth();

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
    <div className="iktis-internal space-y-6 pb-8">
      {/* ─── Greeting & Period Context Bar ────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-label text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary">{formattedMonthHeader}</p>
            <h1 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              Good morning, {user?.name?.split(' ')[0] || 'Landlord'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/rent-charges?month=${selectedMonth}`}
              className="flex min-h-10 items-center gap-1.5 rounded-lg bg-tertiary-fixed-dim px-4 py-2 text-xs font-medium text-primary shadow-sm transition-colors hover:bg-tertiary-fixed sm:text-sm"
            >
<Icons8Icon icon="add" className="text-[18px]" />
              <span>Bulk Rent</span>
            </Link>
          </div>
        </div>

        {/* Period Filter Pills & Month Navigator */}
        <div className="flex w-full flex-wrap items-center gap-2 py-1">
          <div className="flex min-w-[180px] flex-1 items-center justify-between rounded-lg border border-border bg-canvas p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-canvas-soft min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:scale-95 transition"
            >
<Icons8Icon icon="chevron_left" className="text-[18px]" />
            </button>
            <span aria-live="polite" className="px-2 text-xs font-semibold text-ink tracking-tight whitespace-nowrap sm:px-4">
              {formattedMonthHeader}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-canvas-soft min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:scale-95 transition"
            >
<Icons8Icon icon="chevron_right" className="text-[18px]" />
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

        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-[18px] text-rose-800 text-xs sm:text-sm flex items-center gap-2">
<Icons8Icon icon="error" className="text-rose-600 text-[20px]" />
          <span>{error}</span>
        </div>
      )}

      <section className="relative overflow-hidden rounded-2xl bg-primary-container p-5 text-white sm:p-6" aria-label="Monthly financial summary">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-label text-[10px] font-semibold uppercase tracking-[0.08em] text-primary-fixed">Expected monthly revenue</p>
            <p className="mt-2 font-display text-3xl font-normal tracking-tight text-white">
              {loading ? '—' : formatINR(monthly.rentCharged)}
            </p>
          </div>
          <span className="shrink-0 rounded bg-white/10 px-2.5 py-1 font-label text-[10px] font-semibold text-tertiary-fixed">
            {formattedMonthHeader}
          </span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-tertiary-fixed-dim transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, monthly.collectionRate))}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-3">
          <div>
            <p className="font-label text-[10px] font-semibold text-primary-fixed">Collected</p>
            <p className="mt-1 font-display text-lg font-medium text-white">{loading ? '—' : formatINR(monthly.paymentsCollected)}</p>
            <p className="mt-1 text-[10px] font-medium text-tertiary-fixed-dim">{monthly.collectionRate}% in ledger</p>
          </div>
          <div className="px-1">
            <p className="font-label text-[10px] font-semibold text-primary-fixed">Outstanding</p>
            <p className="mt-1 font-display text-lg font-medium text-white">{loading ? '—' : formatINR(monthly.outstandingRent)}</p>
            <p className="mt-1 text-[10px] font-medium text-primary-fixed">{monthly.chargesCount} charges</p>
          </div>
          <div className="text-right">
            <p className="font-label text-[10px] font-semibold text-primary-fixed">Overdue</p>
            <p className="mt-1 font-display text-lg font-medium text-tertiary-fixed">{loading ? '—' : formatINR(monthly.overdueRent)}</p>
            <p className="mt-1 text-[10px] font-medium text-primary-fixed">Needs attention</p>
          </div>
        </div>
      </section>

      <section aria-label="Quick actions" className="grid grid-cols-2 gap-2 sm:gap-3">
        <Link
          to="/payments?action=record"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-tertiary-fixed-dim px-3 py-3 text-center text-sm font-semibold text-on-tertiary-fixed transition-colors hover:bg-tertiary-fixed"
        >
<Icons8Icon icon="add" className="text-[20px]" />
          <span>Record Payment</span>
        </Link>
        <Link
          to="/tenants"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border/60 bg-white px-3 py-3 text-center text-sm font-semibold text-secondary transition-colors hover:bg-surface-low"
        >
<Icons8Icon icon="add" className="text-[20px]" />
          <span>Add Tenant</span>
        </Link>
      </section>

      <section aria-labelledby="portfolio-pulse-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="portfolio-pulse-heading" className="font-display text-lg font-medium text-ink">Portfolio pulse</h2>
          <span className="font-label text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary">{portfolio.totalProperties} active properties</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface-low p-4">
            <p className="font-label text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary">Capacity</p>
            <p className="mt-2 font-display text-2xl font-normal text-ink">{portfolio.totalRooms}</p>
            <p className="text-xs text-secondary">Total units</p>
          </div>
          <div className="rounded-2xl bg-surface-low p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-label text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary">Occupancy</p>
              <span className="rounded bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-secondary">{portfolio.occupancyRate}%</span>
            </div>
            <p className="mt-2 font-display text-2xl font-normal text-ink">{portfolio.occupiedRooms}<span className="px-2 text-border">·</span><span className="text-tertiary">{portfolio.vacantRooms}</span></p>
            <p className="text-xs text-secondary">Occupied <span className="px-1">·</span> Vacant</p>
            <p className="mt-3 text-[11px] font-medium text-secondary">{portfolio.activeTenants} active tenants</p>
          </div>
        </div>
      </section>

      {/* ─── Key Financial Metrics 2x2 / 4-Col Bento Grid ───────────────── */}
      <div className="hidden grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Card 1: Expected / Charged */}
        <div className="p-4 rounded-[18px] bg-canvas flex flex-col justify-between shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-muted font-medium">Total Expected</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-ink-muted">
<Icons8Icon icon="receipt" className="text-[18px]" />
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
<Icons8Icon icon="approval" className="text-[18px]" />
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
<Icons8Icon icon="clock" className="text-[18px]" />
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
<Icons8Icon icon="bed" className="text-[18px]" />
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
      {/* ─── Cumulative Lifetime Totals (Phase 7 Financial Ledger Banner) ──── */}
      <div className="space-y-3 rounded-xl border border-border/60 bg-white p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-1.5">
<Icons8Icon icon="bank_account" className="text-primary text-[18px]" />
              <span className="text-xs font-bold text-ink">
                Cumulative lifetime totals
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">Excludes voided payments</p>
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
<Icons8Icon icon="clock" className="text-amber-600 text-[20px]" />
                  <span>Upcoming Rent Obligations</span>
                </h2>
              </div>
              <Link
                to="/payments?action=record"
                className="text-xs font-medium text-primary hover:underline min-h-[36px] inline-flex items-center gap-1"
              >
<Icons8Icon icon="transaction" className="text-primary text-[16px]" />
                <span>Record Payment</span>
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-ink-muted animate-pulse">
                Checking upcoming obligations...
              </div>
            ) : upcomingDue.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted space-y-1">
<Icons8Icon icon="checkmark" className="text-emerald-600 text-[28px] block mx-auto" />
                <p className="font-medium text-ink-muted/80">No upcoming charges.</p>
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
              className="text-xs text-ink-muted/80 font-medium hover:text-ink hover:underline inline-flex items-center gap-1"
            >
              <span>Manage all charges for {formattedMonthHeader}</span>
<Icons8Icon icon="arrow_forward" className="text-[16px]" />
            </Link>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="p-4 sm:p-5 rounded-[18px] bg-canvas border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-ink flex items-center gap-1.5">
<Icons8Icon icon="transaction" className="text-emerald-600 text-[20px]" />
                  <span>Recent Payments</span>
                </h2>
              </div>
              <Link
                to="/payments"
                className="text-xs font-semibold text-primary hover:underline min-h-[36px] inline-flex items-center gap-1"
              >
                <span>View All</span>
<Icons8Icon icon="arrow_forward" className="text-[16px]" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-ink-muted animate-pulse">
                Loading recent payments...
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted space-y-1">
<Icons8Icon icon="receipt" className="text-slate-400 text-[28px] block mx-auto" />
                <p className="font-medium text-ink-muted/80">No payments recorded yet.</p>
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
<Icons8Icon icon="receipt" className="text-[16px]" />
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
              className="text-xs text-ink-muted/80 font-medium hover:text-ink hover:underline inline-flex items-center gap-1"
            >
              <span>View transaction ledger & history</span>
<Icons8Icon icon="arrow_forward" className="text-[16px]" />
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
<Icons8Icon icon="print" className="text-[16px]" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
