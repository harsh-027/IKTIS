import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../services/api.js';

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

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('trends'); // 'trends' | 'tenants' | 'properties' | 'ledger'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Report 1: Monthly Trends State ───────────────────────────────────────
  const [trendMonths, setTrendMonths] = useState(6);
  const [trendsData, setTrendsData] = useState([]);

  // ─── Report 2: Tenant Balances State ──────────────────────────────────────
  const [tenantBalances, setTenantBalances] = useState([]);
  const [tenantSearch, setTenantSearch] = useState('');

  // ─── Report 3: Property Performance State ─────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  });
  const [propertyData, setPropertyData] = useState(null);

  // ─── Report 4: Payments Ledger State ──────────────────────────────────────
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');
  const [ledgerMethod, setLedgerMethod] = useState('');
  const [ledgerStatus, setLedgerStatus] = useState('all');
  const [ledgerData, setLedgerData] = useState(null);

  // Fetch data depending on active tab
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'trends') {
        const res = await reportApi.getMonthlyTrends({ months: trendMonths });
        if (res.data?.success) setTrendsData(res.data.data.trends || []);
      } else if (activeTab === 'tenants') {
        const res = await reportApi.getTenantBalances();
        if (res.data?.success) setTenantBalances(res.data.data.balances || []);
      } else if (activeTab === 'properties') {
        const res = await reportApi.getPropertyPerformance(selectedMonth);
        if (res.data?.success) setPropertyData(res.data.data);
      } else if (activeTab === 'ledger') {
        const res = await reportApi.getPaymentsLedger({
          startDate: ledgerStartDate || undefined,
          endDate: ledgerEndDate || undefined,
          method: ledgerMethod || undefined,
          status: ledgerStatus,
        });
        if (res.data?.success) setLedgerData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, trendMonths, selectedMonth, ledgerStartDate, ledgerEndDate, ledgerMethod, ledgerStatus]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Aggregate sums for Trends
  const trendsSummary = trendsData.reduce(
    (acc, t) => {
      acc.charged += Number(t.rentCharged || 0);
      acc.collected += Number(t.paymentsCollected || 0);
      acc.outstanding += Number(t.outstandingRent || 0);
      acc.overdue += Number(t.overdueRent || 0);
      return acc;
    },
    { charged: 0, collected: 0, outstanding: 0, overdue: 0 }
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">analytics</span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-heading">
              Financial & Portfolio Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Audit-ready reports calculated directly from stored rent charges, payments, and unit capacity
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 text-xs font-semibold text-ink bg-surface-canvas hover:bg-surface-soft border border-border rounded-full shadow-xs min-h-[44px] inline-flex items-center gap-2 transition cursor-pointer self-start sm:self-auto print:hidden"
        >
          <span className="material-symbols-outlined text-[18px] text-ink-muted">print</span>
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/80 scrollbar-none print:hidden">
        {[
          { id: 'trends', label: 'Monthly Trends', icon: 'trending_up' },
          { id: 'tenants', label: 'Tenant Balances', icon: 'group' },
          { id: 'properties', label: 'Property Performance', icon: 'apartment' },
          { id: 'ledger', label: 'Payments Ledger', icon: 'receipt_long' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap min-h-[40px] inline-flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-[14px] text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ─── TAB 1: MONTHLY FINANCIAL TRENDS ───────────────────────────────── */}
      {activeTab === 'trends' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-canvas p-4 rounded-[18px] border border-border shadow-xs">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-ink">
                Monthly Rent Charged, Collected & Outstanding
              </h2>
              <p className="text-xs text-ink-muted">Historical month-by-month financial performance</p>
            </div>
            <div className="flex items-center gap-1.5 print:hidden">
              <span className="text-xs font-medium text-ink-muted mr-1">Timeframe:</span>
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setTrendMonths(m)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full min-h-[36px] transition cursor-pointer ${
                    trendMonths === m
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container-low text-ink-muted hover:text-ink hover:bg-surface-container'
                  }`}
                >
                  {m} Months
                </button>
              ))}
            </div>
          </div>

          {/* Quick Summary Bento */}
          {!loading && trendsData.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-surface-canvas p-4 rounded-[18px] border border-border shadow-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block">Total Charged</span>
                <span className="text-lg sm:text-2xl font-bold text-ink mt-1 block">
                  {formatINR(trendsSummary.charged)}
                </span>
                <span className="text-[11px] text-ink-muted mt-0.5 block">Across {trendMonths} months</span>
              </div>
              <div className="bg-surface-canvas p-4 rounded-[18px] border border-border shadow-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">Total Collected</span>
                <span className="text-lg sm:text-2xl font-bold text-emerald-700 mt-1 block">
                  {formatINR(trendsSummary.collected)}
                </span>
                <span className="text-[11px] text-ink-muted mt-0.5 block">
                  {trendsSummary.charged > 0
                    ? `${Math.round((trendsSummary.collected / trendsSummary.charged) * 100)}% overall recovery`
                    : '—'}
                </span>
              </div>
              <div className="bg-surface-canvas p-4 rounded-[18px] border border-border shadow-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block">Total Outstanding</span>
                <span className="text-lg sm:text-2xl font-bold text-amber-700 mt-1 block">
                  {formatINR(trendsSummary.outstanding)}
                </span>
                <span className="text-[11px] text-ink-muted mt-0.5 block">Pending payment</span>
              </div>
              <div className="bg-surface-canvas p-4 rounded-[18px] border border-border shadow-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 block">Total Overdue</span>
                <span className="text-lg sm:text-2xl font-bold text-rose-700 mt-1 block">
                  {formatINR(trendsSummary.overdue)}
                </span>
                <span className="text-[11px] text-rose-600 mt-0.5 block">Past due date</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-xs text-ink-muted animate-pulse bg-surface-canvas rounded-[18px] border border-border">
              Calculating monthly financial trends...
            </div>
          ) : trendsData.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-muted bg-surface-canvas rounded-[18px] border border-border">
              No financial charge records found for this period.
            </div>
          ) : (
            <div className="bg-surface-canvas rounded-[18px] border border-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-ink-muted border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Period Month</th>
                      <th className="py-3.5 px-4 text-center">Charges</th>
                      <th className="py-3.5 px-4 text-right">Rent Charged</th>
                      <th className="py-3.5 px-4 text-right">Collected</th>
                      <th className="py-3.5 px-4 text-right">Outstanding</th>
                      <th className="py-3.5 px-4 text-right">Overdue</th>
                      <th className="py-3.5 px-4 text-center">Collection %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {trendsData.map((t) => (
                      <tr key={t.month} className="hover:bg-surface-container-low/50 transition">
                        <td className="py-3 px-4 font-bold text-ink">
                          {t.month}
                        </td>
                        <td className="py-3 px-4 text-center text-ink-muted font-medium">
                          {t.chargesCount}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-ink">
                          {formatINR(t.rentCharged)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {formatINR(t.paymentsCollected)}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${t.outstandingRent > 0 ? 'text-amber-700 font-semibold' : 'text-ink-muted'}`}>
                          {formatINR(t.outstandingRent)}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${t.overdueRent > 0 ? 'text-rose-700 font-bold' : 'text-ink-muted'}`}>
                          {formatINR(t.overdueRent)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            t.collectionRate >= 90
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : t.collectionRate >= 50
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {t.collectionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: TENANT OUTSTANDING BALANCES ─────────────────────────────── */}
      {activeTab === 'tenants' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-canvas p-4 rounded-[18px] border border-border shadow-xs">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-ink">
                Tenant Balances & Collection Status
              </h2>
              <p className="text-xs text-ink-muted">Grouped ledger balances and overdue tracking per tenant</p>
            </div>
            <div className="relative w-full sm:w-64 print:hidden">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-ink-muted pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                placeholder="Filter tenant name..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-full border border-border bg-surface-canvas text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[40px]"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-ink-muted animate-pulse bg-surface-canvas rounded-[18px] border border-border">
              Loading tenant balances...
            </div>
          ) : tenantBalances.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-muted bg-surface-canvas rounded-[18px] border border-border">
              No tenants recorded.
            </div>
          ) : (
            <div className="bg-surface-canvas rounded-[18px] border border-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-ink-muted border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Tenant</th>
                      <th className="py-3.5 px-4">Assigned Room</th>
                      <th className="py-3.5 px-4 text-right">Total Charged</th>
                      <th className="py-3.5 px-4 text-right">Total Paid</th>
                      <th className="py-3.5 px-4 text-right">Outstanding</th>
                      <th className="py-3.5 px-4 text-right">Overdue</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {tenantBalances
                      .filter((tb) => !tenantSearch || tb.fullName.toLowerCase().includes(tenantSearch.toLowerCase()))
                      .map((tb) => (
                        <tr key={tb.tenantId} className="hover:bg-surface-container-low/50 transition">
                          <td className="py-3 px-4">
                            <Link to={`/tenants/${tb.tenantId}`} className="font-bold text-primary hover:underline">
                              {tb.fullName}
                            </Link>
                            {tb.phone && <div className="text-[11px] text-ink-muted">{tb.phone}</div>}
                          </td>
                          <td className="py-3 px-4 text-ink-muted">
                            {tb.currentRoom ? `${tb.currentProperty} · ${tb.currentRoom}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-ink">
                            {formatINR(tb.totalCharged)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">
                            {formatINR(tb.totalPaid)}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${tb.totalOutstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {formatINR(tb.totalOutstanding)}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${tb.overdueBalance > 0 ? 'text-rose-700' : 'text-ink-muted'}`}>
                            {formatINR(tb.overdueBalance)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                              tb.status === 'Current'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : tb.status === 'Pending'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {tb.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right print:hidden">
                            <Link
                              to={`/payments?action=record&tenantId=${tb.tenantId}`}
                              className="text-xs font-semibold text-primary hover:underline min-h-[36px] inline-flex items-center gap-1"
                            >
                              <span>Record Payment</span>
                              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: PROPERTY PERFORMANCE ──────────────────────────────────── */}
      {activeTab === 'properties' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-canvas p-4 rounded-[18px] border border-border shadow-xs">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-ink">
                Property Occupancy & Rent Performance
              </h2>
              <p className="text-xs text-ink-muted">Unit capacity, occupancy rates, and collection per property</p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <span className="text-xs font-medium text-ink-muted">Select Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 text-xs rounded-full border border-border bg-surface-canvas text-ink font-semibold min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-ink-muted animate-pulse bg-surface-canvas rounded-[18px] border border-border">
              Loading property performance...
            </div>
          ) : !propertyData || propertyData.properties?.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-muted bg-surface-canvas rounded-[18px] border border-border">
              No properties created yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {propertyData.properties.map((p) => (
                <div key={p.propertyId} className="bg-surface-canvas rounded-[18px] border border-border p-5 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/properties/${p.propertyId}`} className="text-base font-bold text-ink hover:text-primary transition flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[20px]">apartment</span>
                        <span>{p.name}</span>
                      </Link>
                      <p className="text-xs text-ink-muted mt-0.5">{p.address}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-surface-container-low text-ink border border-border/80">
                      {p.occupancyRate}% Occupied
                    </span>
                  </div>

                  {/* Room status meter */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                    <div className="p-3 bg-surface-container-low rounded-[14px] text-center">
                      <span className="text-[10px] text-ink-muted block uppercase font-semibold">Total Rooms</span>
                      <span className="font-bold text-base text-ink mt-0.5 block">{p.totalRooms}</span>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-[14px] text-center">
                      <span className="text-[10px] text-ink-muted block uppercase font-semibold">Occupied</span>
                      <span className="font-bold text-base text-emerald-700 mt-0.5 block">{p.occupiedRooms}</span>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-[14px] text-center">
                      <span className="text-[10px] text-ink-muted block uppercase font-semibold">Vacant</span>
                      <span className="font-bold text-base text-amber-700 mt-0.5 block">{p.vacantRooms}</span>
                    </div>
                  </div>

                  {/* Financial breakdown */}
                  <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-ink-muted font-medium">Monthly Rent Roll:</span>
                      <span className="font-bold text-ink">{formatINR(p.monthlyRentRoll)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-muted font-medium">Charged in {propertyData.month}:</span>
                      <span className="font-semibold text-ink">{formatINR(p.monthlyCharged)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-muted font-medium">Collected:</span>
                      <span className="font-bold text-emerald-700">{formatINR(p.monthlyCollected)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-muted font-medium">Outstanding:</span>
                      <span className="font-bold text-amber-700">{formatINR(p.monthlyOutstanding)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: PAYMENTS LEDGER ────────────────────────────────────────── */}
      {activeTab === 'ledger' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-canvas p-4 rounded-[18px] border border-border shadow-xs">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-ink">
                Payments Audit Ledger
              </h2>
              <p className="text-xs text-ink-muted">Comprehensive transaction audit history with date and method filters</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 bg-surface-canvas rounded-[18px] border border-border shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs print:hidden">
            <div>
              <label className="block text-[11px] uppercase font-bold text-ink-muted mb-1.5">Start Date</label>
              <input
                type="date"
                value={ledgerStartDate}
                onChange={(e) => setLedgerStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-full border border-border bg-surface-canvas text-ink text-xs min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-bold text-ink-muted mb-1.5">End Date</label>
              <input
                type="date"
                value={ledgerEndDate}
                onChange={(e) => setLedgerEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-full border border-border bg-surface-canvas text-ink text-xs min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-bold text-ink-muted mb-1.5">Method</label>
              <select
                value={ledgerMethod}
                onChange={(e) => setLedgerMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-full border border-border bg-surface-canvas text-ink text-xs min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase font-bold text-ink-muted mb-1.5">Status</label>
              <select
                value={ledgerStatus}
                onChange={(e) => setLedgerStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-full border border-border bg-surface-canvas text-ink text-xs min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All (Valid & Voided)</option>
                <option value="valid">Valid Only</option>
                <option value="voided">Voided Only</option>
              </select>
            </div>
          </div>

          {/* Summary Bento Strip */}
          {ledgerData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 bg-surface-canvas rounded-[18px] border border-border shadow-xs">
                <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider block">Total Collected</span>
                <span className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 block">
                  {formatINR(ledgerData.summary?.totalCollected || 0)}
                </span>
                <span className="text-[11px] text-ink-muted mt-0.5 block">Active receipts</span>
              </div>
              <div className="p-4 bg-surface-canvas rounded-[18px] border border-border shadow-xs">
                <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider block">Total Voided</span>
                <span className="text-xl sm:text-2xl font-bold text-rose-700 mt-1 block">
                  {formatINR(ledgerData.summary?.totalVoided || 0)}
                </span>
                <span className="text-[11px] text-ink-muted mt-0.5 block">Excluded from totals</span>
              </div>
              <div className="p-4 bg-surface-canvas rounded-[18px] border border-border shadow-xs">
                <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider block">Transactions</span>
                <span className="text-xl sm:text-2xl font-bold text-ink mt-1 block">
                  {ledgerData.summary?.count || 0}
                </span>
                <span className="text-[11px] text-ink-muted mt-0.5 block">Matching current criteria</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-xs text-ink-muted animate-pulse bg-surface-canvas rounded-[18px] border border-border">
              Loading ledger records...
            </div>
          ) : !ledgerData || ledgerData.payments?.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-muted bg-surface-canvas rounded-[18px] border border-border">
              No payment transactions match the selected criteria.
            </div>
          ) : (
            <div className="bg-surface-canvas rounded-[18px] border border-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-ink-muted border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Receipt #</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Tenant</th>
                      <th className="py-3.5 px-4">Method & Ref</th>
                      <th className="py-3.5 px-4 text-right">Amount</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ledgerData.payments.map((p) => (
                      <tr key={p.id} className={`hover:bg-surface-container-low/50 transition ${p.isVoided ? 'bg-rose-50/20' : ''}`}>
                        <td className="py-3 px-4 font-mono font-bold text-ink">
                          {p.receiptNumber}
                        </td>
                        <td className="py-3 px-4 text-ink-muted whitespace-nowrap">
                          {formatDate(p.paidAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-ink">{p.tenant?.fullName || 'Tenant'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-ink">{p.method}</span>
                          {p.reference && <span className="text-[11px] text-ink-muted block font-mono">{p.reference}</span>}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className={`font-bold ${p.isVoided ? 'text-ink-muted line-through' : 'text-emerald-700'}`}>
                            {formatINR(p.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            p.isVoided
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {p.isVoided ? 'Voided' : 'Valid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
