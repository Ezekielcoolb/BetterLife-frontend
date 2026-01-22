import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return "₦0.00";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "₦0.00";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return "0";
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return "0";
  }

  return numeric.toLocaleString();
};

const buildMonthKey = (year, month) => `${year}-${String(month).padStart(2, "0")}`;

const SummaryCard = ({ icon: Icon, title, value, meta, accent }) => {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-center gap-4">
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${accent.replace("bg-", "bg-gradient-to-tr from-")} text-white`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          {meta ? <p className="text-xs font-medium text-slate-500">{meta}</p> : null}
        </div>
      </div>
    </article>
  );
};

export default function BranchCso({ branchId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);
  const [selectedCso, setSelectedCso] = useState("");
  const [csoOptions, setCsoOptions] = useState([]);

  const fetchMetrics = async ({ monthKey, searchTerm } = {}) => {
    if (!branchId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {};

      if (monthKey) {
        const [year, month] = monthKey.split("-").map((value) => Number.parseInt(value, 10));
        if (Number.isFinite(year) && Number.isFinite(month)) {
          params.year = year;
          params.month = month;
        }
      }

      if (searchTerm?.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axios.get(`${API_BASE_URL}/api/branches/${branchId}/cso-metrics`, {
        params,
      });

      setMetrics(response.data);
      const nextKey = buildMonthKey(response.data.month.year, response.data.month.month);
      setSelectedMonthKey(nextKey);

      const responseOptions = (response.data.data || [])
        .filter((entry) => entry.csoId && entry.csoName)
        .map((entry) => ({ id: entry.csoId, name: entry.csoName }));

      if (responseOptions.length > 0) {
        setCsoOptions((prev) => {
          const map = new Map(prev.map((option) => [option.id, option]));
          for (const option of responseOptions) {
            if (!map.has(option.id)) {
              map.set(option.id, option);
            }
          }
          return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load CSO metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedMonthKey(null);
    setSelectedCso("");
    setCsoOptions([]);
    fetchMetrics({ monthKey: null, searchTerm: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const availableMonths = useMemo(() => {
    if (!metrics?.availableMonths) {
      return [];
    }

    return metrics.availableMonths.map((entry) => ({
      key: buildMonthKey(entry.year, entry.month),
      label: entry.label,
    }));
  }, [metrics]);

  const activeIndex = useMemo(() => {
    if (!selectedMonthKey) {
      return -1;
    }

    return availableMonths.findIndex((entry) => entry.key === selectedMonthKey);
  }, [availableMonths, selectedMonthKey]);

  const goToIndex = (index) => {
    if (index < 0 || index >= availableMonths.length) {
      return;
    }

    const nextKey = availableMonths[index].key;
    setSelectedMonthKey(nextKey);
    fetchMetrics({ monthKey: nextKey, searchTerm: selectedCso });
  };

  const summaryCards = useMemo(() => {
    const summary = metrics?.summary;

    if (!summary) {
      return [];
    }

    return [
      {
        icon: TrendingUp,
        title: "Loans Disbursed",
        value: formatNumber(summary.totalLoans),
        meta: `${formatNumber(summary.totalCsos)} CSOs`,
        accent: "bg-indigo-500",
      },
      {
        icon: Wallet,
        title: "Amount Disbursed",
        value: formatCurrency(summary.totalDisbursed),
        accent: "bg-emerald-500",
      },
      {
        icon: Wallet,
        title: "Amount Paid",
        value: formatCurrency(summary.totalAmountPaid),
        accent: "bg-sky-500",
      },
      {
        icon: Wallet,
        title: "Admin Fees",
        value: formatCurrency(summary.totalAdminFee),
        accent: "bg-amber-500",
      },
      {
        icon: Wallet,
        title: "Expenses",
        value: formatCurrency(summary.totalExpenses),
        accent: "bg-rose-500",
      },
      {
        icon: Target,
        title: "Profit",
        value: formatCurrency(summary.totalProfit),
        meta: `${formatNumber(summary.targetsMet)} targets met`,
        accent: "bg-fuchsia-500",
      },
    ];
  }, [metrics]);

  const handleSelectChange = (event) => {
    const nextKey = event.target.value;
    setSelectedMonthKey(nextKey);
    fetchMetrics({ monthKey: nextKey, searchTerm: selectedCso });
  };

  const handleCsoFilterChange = (event) => {
    const value = event.target.value;
    setSelectedCso(value);
    fetchMetrics({ monthKey: selectedMonthKey, searchTerm: value });
  };

  if (!branchId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Provide a valid branch identifier to view CSO metrics.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          Loading CSO metrics…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const monthLabel = new Date(metrics.month.year, metrics.month.month - 1, 1).toLocaleString(
    undefined,
    {
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
            Field Operations
          </p>
          <h2 className="text-2xl font-bold text-slate-900">CSO Performance</h2>
          <p className="text-sm text-slate-500">
            Overview of branch CSO activities for {monthLabel}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedCso}
              onChange={handleCsoFilterChange}
              className="w-56 appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All CSOs</option>
              {csoOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <CalendarDays className="h-4 w-4" />
            {monthLabel}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => goToIndex(activeIndex + 1)}
              disabled={activeIndex === -1 || activeIndex >= availableMonths.length - 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="relative">
              <select
                value={selectedMonthKey || ""}
                onChange={handleSelectChange}
                className="w-44 appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {availableMonths.map((entry) => (
                  <option key={entry.key} value={entry.key}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => goToIndex(activeIndex - 1)}
              disabled={activeIndex <= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">CSO Name</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Loans</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Total Disbursed</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount To Be Paid</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount Paid</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Admin Fee</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Expenses</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Loan Balance</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Profit</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Loan Target</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Disbursement Target</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Target Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {metrics.data.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-slate-500">
                    No CSO activity recorded for this month.
                  </td>
                </tr>
              ) : (
                metrics.data.map((entry) => (
                  <tr key={entry.csoId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{entry.csoName || "—"}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatNumber(entry.loansThisMonth)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(entry.totalDisbursed)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(entry.amountToBePaid)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{formatCurrency(entry.amountPaid)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(entry.adminFee)}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600">{formatCurrency(entry.expenses)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(entry.loanBalance)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900">{formatCurrency(entry.profit)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatNumber(entry.loanTarget)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(entry.disbursementTarget)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          entry.targetMet
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {entry.targetMet ? "Target Met" : "In Progress"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
