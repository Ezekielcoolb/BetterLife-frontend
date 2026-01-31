import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  Sparkles,
  ShieldAlert,
  Wallet,
  Coins,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Zap,
  Lock,
} from "lucide-react";
import {
  fetchCsoWallet,
  fetchCsoOvershootMetrics,
  syncCsoOvershootMetrics,
} from "../../redux/slices/loanSlice";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const OUTLINE_CLASSES = {
  indigo: "border-indigo-500/40 bg-indigo-50 text-indigo-600",
  emerald: "border-emerald-500/40 bg-emerald-50 text-emerald-600",
  rose: "border-rose-500/40 bg-rose-50 text-rose-600",
  amber: "border-amber-500/40 bg-amber-50 text-amber-600",
  violet: "border-violet-500/40 bg-violet-50 text-violet-600",
  white: "border-white/30 bg-white/20 text-white",
};

const OutlinePill = ({ tone = "indigo", children }) => {
  const classes = OUTLINE_CLASSES[tone] || "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {children}
    </span>
  );
};

const getNextBonusDate = (reference = new Date()) => {
  const currentYear = reference.getFullYear();
  const payout = new Date(currentYear, 11, 31, 23, 59, 59);

  if (reference.getTime() > payout.getTime()) {
    return new Date(currentYear + 1, 11, 31, 23, 59, 59);
  }

  return payout;
};

const calculateBonusCountdown = () => {
  const now = new Date();
  const target = getNextBonusDate(now);
  const diffMs = target.getTime() - now.getTime();
  const clamped = Math.max(diffMs, 0);
  const totalSeconds = Math.floor(clamped / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    targetYear: target.getFullYear(),
    completed: diffMs <= 0,
    parts: { days, hours, minutes, seconds },
  };
};

const MetricCard = ({ icon: Icon, label, value, hint, accent = "bg-indigo-500" }) => (
  <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className={`absolute inset-x-6 top-0 h-20 rounded-full ${accent} opacity-10 blur-3xl`} />
    <div className="relative space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  </div>
);

const WalletActivityItem = ({ loan }) => (
  <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
      <span>{loan.loanId || "Loan"}</span>
      <OutlinePill tone="rose">{formatCurrency(loan.balance)}</OutlinePill>
    </div>
    <p className="text-sm text-slate-500">{loan.customerName || "Customer"}</p>
    <div className="flex items-center justify-between text-xs text-slate-400">
      <span>Disbursed: {loan.disbursedAt ? new Date(loan.disbursedAt).toLocaleDateString() : "—"}</span>
      <span className="font-semibold text-rose-500">{loan.daysPast} days past recovery</span>
    </div>
  </div>
);

const Tabs = ({ options, active, onChange }) => (
  <div className="flex gap-2 rounded-2xl bg-slate-100 p-1">
    {options.map((option) => (
      <button
        key={option.id}
        onClick={() => onChange(option.id)}
        className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold transition-all md:text-sm ${
          active === option.id ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default function CsoWallet() {
  const dispatch = useDispatch();
  const {
    walletSummary,
    walletLoading,
    walletError,
    walletBonusBreakdown,
    overshootMetrics,
    overshootLoading,
    overshootSyncing,
  } = useSelector((state) => state.loan);
  const [activeTab, setActiveTab] = useState("performance");
  const [countdown, setCountdown] = useState(() => calculateBonusCountdown());
  const currentMonthContext = useMemo(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }, []);

  useEffect(() => {
    dispatch(fetchCsoWallet());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    const runSync = async () => {
      try {
        await dispatch(syncCsoOvershootMetrics(currentMonthContext)).unwrap();
      } catch (error) {
        // Silently ignore sync failures; fetch will still attempt to retrieve cached data.
      }

      if (!cancelled) {
        dispatch(fetchCsoOvershootMetrics(currentMonthContext));
      }
    };

    runSync();

    const intervalId = window.setInterval(runSync, 1000 * 60 * 5);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [dispatch, currentMonthContext]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCountdown(calculateBonusCountdown());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const performance = walletSummary?.performance || {};
  const deductionLoans = performance.deductionLoans || [];
  const asOfDate = performance.asOf ? new Date(performance.asOf).toLocaleDateString() : null;

  const historyLabels = performance.history?.labels || [];
  const historyEarned = performance.history?.earned || [];
  const historyDeductions = performance.history?.deductions || [];

  const hasHistory =
    historyLabels.length > 0 &&
    historyEarned.length === historyLabels.length &&
    historyDeductions.length === historyLabels.length;

  const chartData = useMemo(() => {
    if (!hasHistory) {
      return null;
    }

    return {
      labels: historyLabels,
      datasets: [
        {
          label: "Earned Bonus",
          data: historyEarned.map((value) => value ?? 0),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "#2563eb",
        },
        {
          label: "Recovery",
          data: historyLabels.map((_, index) => -Math.abs(historyDeductions[index] ?? 0)),
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.15)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "#f97316",
        },
      ],
    };
  }, [hasHistory, historyLabels, historyEarned, historyDeductions]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: {
              family: "'Poppins', 'Inter', sans-serif",
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Math.abs(context.parsed.y || 0);
              const label = context.dataset.label || "";
              return `${label}: ${formatCurrency(value)}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => formatCurrency(Math.abs(value || 0)),
          },
          grid: {
            color: "rgba(148, 163, 184, 0.15)",
          },
        },
        x: {
          ticks: {
            font: {
              family: "'Poppins', 'Inter', sans-serif",
            },
          },
          grid: {
            display: false,
          },
        },
      },
    }),
    [],
  );

  const tabs = [
    { id: "performance", label: "Performance Wallet" },
    { id: "operational", label: "Operational Wallet" },
  ];

  if (walletLoading && !walletSummary) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (walletError && !walletSummary) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-600">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8" />
        <p className="font-semibold">{walletError}</p>
        <p className="mt-1 text-sm text-rose-500">Please refresh the page or contact support if the issue persists.</p>
      </div>
    );
  }

  const overlay = walletLoading ? (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-4xl bg-white/70 backdrop-blur-sm">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  ) : null;

  const totalBonus = Number(performance.totalBonus) || 0;
  const basePerformanceBonus = Number(
    performance.basePerformanceBonus ?? walletBonusBreakdown?.basePerformanceBonus ?? 0,
  );
  const overshootBonusAggregate = Number(
    performance.overshootBonus ?? walletBonusBreakdown?.overshootBonus ?? 0,
  );
  const deductionTotal = Number(performance.deductionTotal) || 0;
  
  // Robust Recalculation
  const remainingBonus = Math.max(totalBonus - deductionTotal, 0);
  const withdrawable = Number((remainingBonus * 0.7).toFixed(2));
  const lockedPortion = Math.max(remainingBonus - withdrawable, 0);

  const overshootTotalLoans = Number(overshootMetrics?.totalLoans ?? 0);
  const overshootCount = Number(overshootMetrics?.overshootCount ?? 0);
  const monthlyOvershootValue = Number(overshootMetrics?.overshootValue ?? 0);
  const monthlyOvershootPercent = Number(
    overshootMetrics?.overshootPercentValue ?? monthlyOvershootValue * 0.01,
  );
  const overshootThreshold = Number(overshootMetrics?.threshold ?? 100);

  const performanceCards = [
    {
      label: "Total Bonus Pool",
      value: formatCurrency(totalBonus),
      icon: Sparkles,
      accent: "bg-indigo-500",
      hint: "Combined performance & overshoot bonuses currently accrued.",
    },
    {
      label: "Performance Bonus",
      value: formatCurrency(basePerformanceBonus),
      icon: TrendingUp,
      accent: "bg-emerald-600",
      hint: "Performance Bonus is guaranteed by your repayment efficiency.",
    },
    {
      label: "Overshoot Bonus (1%)",
      value: formatCurrency(overshootBonusAggregate),
      icon: Zap,
      accent: "bg-rose-600",
      hint:
        overshootBonusAggregate > 0
          ? "Accumulated 1% bonus from overshoot loans minus payouts."
          : "Earn overshoot bonus by disbursing beyond 100 loans in a month.",
    },
    {
      label: "Recovery Deductions",
      value: formatCurrency(deductionTotal),
      icon: ShieldAlert,
      accent: "bg-amber-600",
      hint: "Total balance of loans 45+ days past disbursement. Temporarily removed from pool.",
    },
    {
      label: "Remaining Bonus",
      value: formatCurrency(remainingBonus),
      icon: Coins,
      accent: "bg-sky-500",
      hint: "Bonus pool available after recovery deductions.",
    },
    {
      label: "Available to Withdraw",
      value: formatCurrency(withdrawable),
      icon: Wallet,
      accent: "bg-emerald-500",
      hint: "Exactly 70% of the remaining bonus, releasable on approval.",
    },
    {
      label: "Held for Future",
      value: formatCurrency(lockedPortion),
      icon: Lock,
      accent: "bg-slate-500",
      hint: "Portion (30%) retained until recoveries clear or next payout window.",
    },
  ];

  const topPerformanceCards = performanceCards.slice(0, 4);
  const bottomPerformanceCards = performanceCards.slice(4);
  const countdownSegments = countdown
    ? [
        { label: "Days", value: countdown.parts.days.toString().padStart(2, "0") },
        { label: "Hours", value: countdown.parts.hours.toString().padStart(2, "0") },
        { label: "Minutes", value: countdown.parts.minutes.toString().padStart(2, "0") },
        { label: "Seconds", value: countdown.parts.seconds.toString().padStart(2, "0") },
      ]
    : [];

  return (
    <div className="space-y-10 pb-20 px-0 sm:px-0">
      <Tabs options={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === "performance" && (
        <section className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-4xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-700 p-5 text-white shadow-xl sm:p-8">
          <div className="absolute inset-0 opacity-25">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%)]" />
          </div>
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4 text-center lg:text-left">
              <OutlinePill tone="white">Performance wallet overview</OutlinePill>
              <h1 className="text-3xl font-semibold md:text-4xl">Track your performance bonus flow.</h1>
              <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-indigo-100">
                    Countdown to 31 December {countdown?.targetYear}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-white md:justify-start">
                    {countdownSegments.map((segment) => (
                      <div
                        key={segment.label}
                        className="flex min-w-[3.25rem] flex-col items-center rounded-2xl border border-white/20 bg-white/10 px-3 py-2"
                      >
                        <span className="text-[15px] font-semibold">{segment.value}</span>
                        <span className="text-[6px] uppercase tracking-wide text-indigo-100/80">{segment.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-indigo-100/80">
                    {countdown?.completed
                      ? "Year-end bonus window is live—coordinate with your branch for payout approval."
                      : "Counting down to the December 31 bonus approval window."}
                  </p>
                </div>
              {/* <p className="max-w-2xl text-sm text-indigo-100/90">
                Bonuses grow as you drive timely repayments. Deduction events (like loans 45+ days past disbursement) temporarily lock a
                matching portion so you can focus on coaching those customers back on track.
              </p> */}
              {/* <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-indigo-100/70 lg:justify-start">
                <OutlinePill tone="indigo">Auto-tracked</OutlinePill>
                <OutlinePill tone="emerald">70% unlock rule</OutlinePill>
                <OutlinePill tone="cyan">Branch visibility</OutlinePill>
              </div> */}
            </div>

            <div className="relative min-w-0 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 p-6 shadow-lg">
              <div className="absolute inset-0 opacity-30">
                <div className="h-full w-full bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.45),transparent_55%)]" />
              </div>
              <div className="relative">
                <p className="text-xs uppercase tracking-wide text-indigo-100">Available Bonus</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(withdrawable)}</p>
                <p className="mt-3 text-xs text-indigo-100/80">
                  The remaining 30% stays reserved until recovery issues are cleared or the next payout window opens.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-indigo-100">
                  <TrendingUp className="h-5 w-5 text-emerald-200" />
                  <span>{formatCurrency(totalBonus)} earned year-to-date</span>
                </div>
                
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <section className="relative rounded-4xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">
          {overlay}
          {activeTab === "performance" ? (
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {topPerformanceCards.map((card) => (
                    <MetricCard key={card.label} {...card} />
                  ))}
                </div>
                {bottomPerformanceCards.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {bottomPerformanceCards.map((card) => (
                      <MetricCard key={card.label} {...card} />
                    ))}
                  </div>
                )}

                <div className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-slate-900">Bonus composition</h3>
                    <p className="text-xs text-slate-500">
Your total bonus is made up of earned bonus from prompt repayment collection, 1%  bonus from over target loans and deductions from recoveries.                    </p>
                    <div className="grid gap-3 text-sm text-slate-700">
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <span>Performance bonus</span>
                        <OutlinePill tone="emerald">{formatCurrency(basePerformanceBonus)}</OutlinePill>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <span>Overshoot (1% pool)</span>
                        <OutlinePill tone="rose">{formatCurrency(overshootBonusAggregate)}</OutlinePill>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <span>Total bonus pool</span>
                        <OutlinePill tone="indigo">{formatCurrency(totalBonus)}</OutlinePill>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-slate-900">Current overshoot month</h3>
                    <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">
                        {overshootLoading || overshootSyncing
                          ? "Refreshing overshoot snapshots..."
                          : `Overshoot loans: ${overshootCount}/${overshootTotalLoans}`}
                      </p>
                      <p className="mt-1">
                        {overshootCount > 0
                          ? `Extra disbursements beyond ${overshootThreshold} add ₦${monthlyOvershootValue.toLocaleString()} and a 1% bonus of ${formatCurrency(monthlyOvershootPercent)} this month.`
                          : "Stay above 100 monthly loans to unlock the 1% overshoot reward."}
                      </p>
                      <p className="mt-2 text-amber-600">
                        Withdrawals shave overshoot bonus first after performance funds, so plan big campaigns before payout.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <div className="min-w-0 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Bonus timeline</h2>
                      <p className="text-xs text-slate-500">Monitor how incentives are earned, locked, and released every month.</p>
                    </div>
                    <OutlinePill tone="indigo">Performance history</OutlinePill>
                  </div>
                  <div className="relative h-56 w-full sm:h-64">
                    {chartData ? (
                      <Line data={chartData} options={chartOptions} className="!h-full !w-full" />
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                        No performance history yet. Once bonuses post, your trend will appear here.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-6">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Recovery deductions</h2>
                    <p className="text-xs text-slate-500">
                      Loans 45+ days past disbursement.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {deductionLoans.length ? (
                      deductionLoans.slice(0, 5).map((loan) => <WalletActivityItem key={loan.id || loan.loanId} loan={loan} />)
                    ) : (
                      <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-600">
                        Fantastic! No loans are locking your bonus today.
                      </div>
                    )}
                  </div>
                  {deductionLoans.length > 5 && (
                    <p className="text-xs text-slate-400">Showing the first five loans. Resolve recoveries to release the rest.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                  <h3 className="text-base font-semibold text-slate-900">How incentives move</h3>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    <li className="flex gap-3">
                      <span className="mt-1 block h-2 w-2 rounded-full bg-indigo-500" />
                      <p>Every disbursement credits its insurance bonus straight into your performance wallet.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1 block h-2 w-2 rounded-full bg-rose-500" />
                      <p>Once a loan crosses 45 days, the outstanding balance locks an equal amount of your bonus.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1 block h-2 w-2 rounded-full bg-emerald-500" />
                      <p>Clearing recoveries instantly frees your bonus—no need to wait for year end.</p>
                    </li>
                  </ul>
                </div> */}

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                  <h3 className="text-base font-semibold text-slate-900">Bonus Conditions</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Bonus is subject to recovery, resignation and termination                  </p>
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    <p className="mb-2">
                       If resigned before 31dec of any year, bonus is forfeited.
                    </p>
                    <p className="mb-2">
                     If sacked by the company for any reason, bonus will be forfeited.</p>
                      <p className="mb-2">
                     If recovery is done on the bonus, balance will be paid out at the said date.</p>
                      <p className="mb-2">
                      If recovery is more than the bonus, CSO will be Critically audited</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                  <h3 className="text-base font-semibold text-slate-900">How to get more bonus</h3>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    <li>
                      <OutlinePill tone="emerald">Coach weekly</OutlinePill>
                      <p className="mt-1 text-xs text-slate-500">Quick customer nudges keep repayment discipline tight.</p>
                    </li>
                    <li>
                      <OutlinePill tone="amber">Escalate early</OutlinePill>
                      <p className="mt-1 text-xs text-slate-500">Flag red-flag accounts by day 35 so branch support can intervene.</p>
                    </li>
                    <li>
                      <OutlinePill tone="violet">Document wins</OutlinePill>
                      <p className="mt-1 text-xs text-slate-500">Recovered loans free cash instantly—capture what worked.</p>
                    </li>
                    <li>
                      <OutlinePill tone="violet">Collection</OutlinePill>
                      <p className="mt-1 text-xs text-slate-500">Ensure timely collection of loan repayments.</p>
                    </li>
                    <li>
                      <OutlinePill tone="violet">Recoveries</OutlinePill>
                      <p className="mt-1 text-xs text-slate-500">Avoid recoveries and ensure loans are repaid before 45 days.</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-[200px]" />
          )}
        </section>
      </div>
    </div>
  );
}


