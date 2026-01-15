import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Coins,
  GaugeCircle,
  Loader2,
  PiggyBank,
  Target,
  TrendingUp,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

const pct = (value, target) => {
  if (!target || target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((value / target) * 100));
};

const buildMonthKey = (year, month) => `${year}-${String(month).padStart(2, "0")}`;

const ProgressBar = ({
  label,
  current,
  target,
  formatValue,
  accent,
}) => {
  const percentage = pct(current, target);

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {formatValue(current)}
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>Target</p>
          <p className="font-semibold text-slate-700">{formatValue(target)}</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${accent}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs font-semibold text-slate-500">
        <span>{percentage}% achieved</span>
        <span>{formatValue(Math.max(target - current, 0))} remaining</span>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, title, value, subtitle, accent }) => {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-center gap-4">
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${accent.replace("bg-", "bg-gradient-to-br from-")} text-white shadow-sm`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          {subtitle ? (
            <p className="text-xs font-medium text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
};

const MonthSelector = ({
  months,
  currentMonth,
  onChange,
}) => {
  if (!months.length) {
    return null;
  }

  const activeIndex = months.findIndex((month) => month.key === currentMonth);
  const handleSelect = (event) => {
    const nextKey = event.target.value;
    if (nextKey && nextKey !== currentMonth) {
      onChange(nextKey);
    }
  };

  const goToIndex = (nextIndex) => {
    if (nextIndex >= 0 && nextIndex < months.length) {
      onChange(months[nextIndex].key);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => goToIndex(activeIndex + 1)}
        disabled={activeIndex === months.length - 1}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="relative">
        <select
          value={currentMonth}
          onChange={handleSelect}
          className="w-48 appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {months.map((month) => (
            <option key={month.key} value={month.key}>
              {month.label}
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
        <ArrowLeft className="h-4 w-4 rotate-180" />
      </button>
    </div>
  );
};

export default function AnnualTransaction({ branchId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);

  const fetchMetrics = async (monthKey) => {
    if (!branchId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {};

      if (monthKey) {
        const [year, month] = monthKey.split("-").map((val) => Number.parseInt(val, 10));
        if (Number.isFinite(year) && Number.isFinite(month)) {
          params.year = year;
          params.month = month;
        }
      }

      const response = await axios.get(`${API_BASE_URL}/api/branches/${branchId}/metrics`, {
        params,
      });

      setMetrics(response.data);

      const nextKey = buildMonthKey(response.data.month.year, response.data.month.month);
      setSelectedMonthKey(nextKey);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load branch metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(selectedMonthKey);
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

  const lifetimeCards = useMemo(() => {
    if (!metrics?.lifetime) {
      return [];
    }

    const { lifetime } = metrics;

    return [
      {
        icon: TrendingUp,
        title: "Total Amount Disbursed",
        value: formatCurrency(lifetime.totalDisbursed),
        accent: "bg-indigo-500",
      },
      {
        icon: Coins,
        title: "Principal + Interest",
        value: formatCurrency(lifetime.totalAmountToBePaid),
        subtitle: `Interest Earned: ${formatCurrency(lifetime.totalInterest)}`,
        accent: "bg-emerald-500",
      },
      {
        icon: PiggyBank,
        title: "Amount Paid",
        value: formatCurrency(lifetime.totalAmountPaid),
        subtitle: `Outstanding Balance: ${formatCurrency(lifetime.outstandingBalance)}`,
        accent: "bg-sky-500",
      },
      {
        icon: GaugeCircle,
        title: "Admin Fee",
        value: formatCurrency(lifetime.totalAdminFees),
        accent: "bg-amber-500",
      },
      {
        icon: Target,
        title: "Total Profit",
        value: formatCurrency(lifetime.totalProfit),
        accent: "bg-fuchsia-500",
      },
      {
        icon: Coins,
        title: "Loans Managed",
        value: formatNumber(lifetime.loanCount),
        accent: "bg-slate-600",
      },
    ];
  }, [metrics]);

  const monthCards = useMemo(() => {
    if (!metrics?.month) {
      return [];
    }

    const { month } = metrics;

    return [
      {
        icon: TrendingUp,
        title: "Monthly Disbursement",
        value: formatCurrency(month.totalDisbursed),
        accent: "bg-indigo-500",
      },
      {
        icon: Coins,
        title: "Principal + Interest",
        value: formatCurrency(month.totalAmountToBePaid),
        subtitle: `Interest: ${formatCurrency(month.totalInterest)}`,
        accent: "bg-emerald-500",
      },
      {
        icon: PiggyBank,
        title: "Amount Collected",
        value: formatCurrency(month.totalAmountPaid),
        subtitle: `Balance: ${formatCurrency(Math.max(month.balanceGap, 0))}`,
        accent: "bg-sky-500",
      },
      {
        icon: GaugeCircle,
        title: "Admin Fee",
        value: formatCurrency(month.totalAdminFees),
        accent: "bg-amber-500",
      },
      {
        icon: Target,
        title: "Monthly Profit",
        value: formatCurrency(month.totalProfit),
        accent: "bg-fuchsia-500",
      },
      {
        icon: Coins,
        title: "Loans Disbursed",
        value: formatNumber(month.loanCount),
        accent: "bg-slate-600",
      },
    ];
  }, [metrics]);

  const handleMonthChange = (nextKey) => {
    setSelectedMonthKey(nextKey);
    fetchMetrics(nextKey);
  };

  if (!branchId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Provide a valid branch identifier to view transactions.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          Loading branch metrics…
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

  const loanTarget = metrics.branch?.loanTarget ?? 0;
  const disbursementTarget = metrics.branch?.disbursementTarget ?? 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
            Branch Performance
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {metrics.branch?.name || "Unnamed Branch"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lifetime overview alongside monthly disbursement and collection progress.
          </p>
        </div>
        <MonthSelector
          months={availableMonths}
          currentMonth={selectedMonthKey}
          onChange={handleMonthChange}
        />
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Lifetime Summary</h2>
          <span className="text-sm text-slate-500">
            Data from inception to {new Date(metrics.generatedAt).toLocaleString()}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{lifetimeCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}</div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Monthly Performance</h2>
            <p className="text-sm text-slate-500">Focused snapshot for {monthLabel}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600">
            <CalendarDays className="h-4 w-4" />
            {formatNumber(metrics.month.loanCount)} loans disbursed this month
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{monthCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}</div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ProgressBar
          label="Loan Target"
          current={metrics.month.loanCount}
          target={loanTarget}
          formatValue={formatNumber}
          accent="bg-gradient-to-r from-indigo-500 to-indigo-600"
        />
        <ProgressBar
          label="Disbursement Target"
          current={metrics.month.totalDisbursed}
          target={disbursementTarget}
          formatValue={formatCurrency}
          accent="bg-gradient-to-r from-emerald-500 to-emerald-600"
        />
      </section>

      {metrics.availableMonths?.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Historical Highlights</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Month</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">
                      Loans
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">
                      Disbursed
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">
                      Amount Paid
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">
                      Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {metrics.availableMonths.map((entry) => {
                    const key = buildMonthKey(entry.year, entry.month);
                    const isActive = key === selectedMonthKey;

                    return (
                      <tr
                        key={key}
                        className={isActive ? "bg-indigo-50/60" : "hover:bg-slate-50"}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                          {entry.label}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {formatNumber(entry.loanCount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {formatCurrency(entry.totalDisbursed)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {formatCurrency(entry.totalAmountPaid)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {formatCurrency(
                            entry.totalAmountToBePaid - entry.totalDisbursed + entry.totalAdminFees,
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
