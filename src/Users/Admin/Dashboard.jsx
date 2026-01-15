

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminDashboardAnalytics,
  setDashboardAnalyticsYear,
} from "../../redux/slices/adminLoanSlice";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Loader2,
  TrendingUp,
  Wallet,
  Landmark,
  PieChart as PieChartIcon,
  CalendarRange,
  Target,
} from "lucide-react";
import { formatCurrency } from "../../utils/loanMetrics";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const TIMEFRAME_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "thisWeek", label: "This Week" },
  { key: "thisMonth", label: "This Month" },
  { key: "thisYear", label: "This Year" },
  { key: "overall", label: "Overall" },
];

const EMPTY_SUMMARY = Object.freeze({
  loans: 0,
  disbursed: 0,
  payments: 0,
  amountToBePaid: 0,
  amountPaidSoFar: 0,
});

const formatInteger = (value) =>
  new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(Number(value || 0));

const clampNonNegative = (value) => Math.max(0, Number(value || 0));

const MetricCard = ({ title, value, icon: Icon, accentClass = "bg-indigo-100 text-indigo-600", subtitle }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
    <div className="flex items-start justify-between">
      <div className="space-y-3">
        <div className={`inline-flex items-center justify-center rounded-xl p-3 ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
    </div>
    <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-slate-100 opacity-0 transition group-hover:opacity-100" />
  </div>
);

const TimeframeSummaryCard = ({ label, summary }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <CalendarRange className="h-4 w-4 text-indigo-500" />
    </div>
    <div className="mt-4 space-y-3 text-sm">
      <div className="flex items-center justify-between text-slate-600">
        <span>Loans</span>
        <span className="font-semibold text-slate-900">{formatInteger(summary.loans)}</span>
      </div>
      <div className="flex items-center justify-between text-slate-600">
        <span>Amount disbursed</span>
        <span className="font-semibold text-slate-900">{formatCurrency(summary.disbursed)}</span>
      </div>
      <div className="flex items-center justify-between text-slate-600">
        <span>Payments</span>
        <span className="font-semibold text-slate-900">{formatCurrency(summary.payments)}</span>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const dispatch = useDispatch();
  const {
    dashboardAnalytics,
    dashboardAnalyticsLoading,
    dashboardAnalyticsError,
    dashboardAnalyticsYear,
  } = useSelector((state) => state.adminLoans);

  const [activeTimeframe, setActiveTimeframe] = useState("today");

  useEffect(() => {
    dispatch(fetchAdminDashboardAnalytics({ year: dashboardAnalyticsYear }));
  }, [dispatch, dashboardAnalyticsYear]);

  const timeframeSummaries = dashboardAnalytics?.timeframe || {};
  const activeSummary = timeframeSummaries[activeTimeframe] || EMPTY_SUMMARY;

  const principalWithInterest = clampNonNegative(dashboardAnalytics?.amountToBePaid);
  const actualPayment = clampNonNegative(dashboardAnalytics?.amountPaidSoFar);
  const loanBalance = clampNonNegative(dashboardAnalytics?.loanBalance);

  const doughnutData = useMemo(() => {
    if (!dashboardAnalytics?.loanTarget) {
      return null;
    }

    const target = clampNonNegative(dashboardAnalytics.loanTarget.annual);
    const achieved = clampNonNegative(dashboardAnalytics.loanTarget.achieved);
    const remaining = clampNonNegative(target - achieved);

    if (target <= 0 && achieved <= 0) {
      return null;
    }

    return {
      labels: ["Achieved", "Remaining"],
      datasets: [
        {
          data: [achieved, remaining],
          backgroundColor: ["#4f46e5", "#e2e8f0"],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  }, [dashboardAnalytics]);

  const doughnutOptions = useMemo(
    () => ({
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${formatCurrency(context.parsed)}`;
            },
          },
        },
      },
    }),
    []
  );

  const { barData, suggestedMax } = useMemo(() => {
    const monthly = dashboardAnalytics?.monthlyDisbursement || [];
    if (monthly.length === 0) {
      return { barData: null, suggestedMax: 20_000_000 };
    }

    const amounts = monthly.map((entry) => Number(entry.amount || 0));
    const peak = Math.max(...amounts, 20_000_000);
    const roundedMax = Math.ceil(peak / 1_000_000) * 1_000_000;

    return {
      barData: {
        labels: monthly.map((entry) => entry.month || ""),
        datasets: [
          {
            label: "Amount disbursed",
            data: amounts,
            backgroundColor: "#22c55e",
            borderRadius: 10,
          },
        ],
      },
      suggestedMax: roundedMax,
    };
  }, [dashboardAnalytics]);

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `${formatCurrency(context.raw || 0)}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax,
          ticks: {
            stepSize: 1_000_000,
            callback(value) {
              if (value >= 1_000_000) {
                return `${value / 1_000_000}m`;
              }
              if (value >= 1_000) {
                return `${value / 1_000}k`;
              }
              return value;
            },
          },
          grid: { color: "#e2e8f0" },
        },
        x: {
          grid: { display: false },
        },
      },
    }),
    [suggestedMax]
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => currentYear - index);
  }, [currentYear]);

  const quickViewCards = useMemo(
    () =>
      TIMEFRAME_OPTIONS.map((option) => (
        <TimeframeSummaryCard
          key={option.key}
          label={option.label}
          summary={timeframeSummaries[option.key] || EMPTY_SUMMARY}
        />
      )),
    [timeframeSummaries]
  );

  const renderLoader = dashboardAnalyticsLoading && !dashboardAnalytics;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Performance Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor loan activity, repayments, and targets across every timeframe.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="dashboard-year" className="text-sm font-medium text-slate-600">
            Reporting year
          </label>
          <select
            id="dashboard-year"
            value={dashboardAnalyticsYear}
            onChange={(event) => dispatch(setDashboardAnalyticsYear(Number(event.target.value)))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100 p-1">
        {TIMEFRAME_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setActiveTimeframe(option.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTimeframe === option.key
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-slate-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {dashboardAnalyticsError && !dashboardAnalyticsLoading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {dashboardAnalyticsError}
        </div>
      )}

      {renderLoader ? (
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="Loan count"
              value={formatInteger(activeSummary.loans)}
              icon={TrendingUp}
              accentClass="bg-emerald-100 text-emerald-600"
              subtitle={`Loans recorded ${TIMEFRAME_OPTIONS.find((item) => item.key === activeTimeframe)?.label.toLowerCase()}`}
            />
            <MetricCard
              title="Amount disbursed"
              value={formatCurrency(activeSummary.disbursed)}
              icon={Landmark}
              accentClass="bg-indigo-100 text-indigo-600"
              subtitle="Approved and released value"
            />
            <MetricCard
              title="Payments collected"
              value={formatCurrency(activeSummary.payments)}
              icon={Wallet}
              accentClass="bg-amber-100 text-amber-600"
              subtitle="Repayments posted in this window"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Principal vs payments
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Principal + interest
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatCurrency(principalWithInterest)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Actual payment
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatCurrency(actualPayment)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Loan balance
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatCurrency(loanBalance)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Loan balance automatically clamps to ₦0 when collections exceed the outstanding principal.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Loan target progress
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Annual target across all branches
                  </p>
                </div>
                <Target className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="relative mx-auto mt-6 flex h-56 w-56 items-center justify-center">
                {doughnutData ? (
                  <>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs uppercase text-slate-400">Achieved</span>
                      <span className="text-lg font-bold text-slate-900">
                        {formatInteger(dashboardAnalytics?.loanTarget?.achieved)}
                      </span>
                      <span className="mt-1 text-[10px] uppercase text-slate-400">
                        Target {formatInteger(dashboardAnalytics?.loanTarget?.annual || 0)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-50 text-xs text-slate-500">
                    No target defined
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <div className="grid gap-4 xl:col-span-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Timeframe quick view
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {quickViewCards}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Disbursement trend
                  </h2>
                  <p className="text-sm text-slate-500">
                    Monthly total disbursed for {dashboardAnalyticsYear}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-600">
                    <PieChartIcon className="h-3 w-3" /> Amount disbursed
                  </span>
                </div>
              </div>
              <div className="h-72 w-full">
                {barData ? (
                  <Bar data={barData} options={barOptions} />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
                    No disbursement records for this year yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
