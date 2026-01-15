import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  Clock, 
  Target, 
  ShieldAlert,
  ArrowUpRight,
  ChevronRight,
  Loader2,
  Calendar
} from "lucide-react";
import {
  fetchDashboardStats,
  fetchCsoOutstandingLoans,
} from "../../redux/slices/loanSlice";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const ProgressBar = ({ label, current, target, color = "indigo" }) => {
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  
  const colors = {
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-600",
    rose: "bg-rose-600",
    amber: "bg-amber-600"
  };

  const bgColors = {
    indigo: "bg-indigo-100",
    emerald: "bg-emerald-100",
    rose: "bg-rose-100",
    amber: "bg-amber-100"
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">{percentage}%</span>
      </div>
      <div className={`h-4 w-full rounded-full ${bgColors[color]}`}>
        <div 
          className={`h-4 rounded-full transition-all duration-1000 ease-out ${colors[color]}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider">
        <span>Actual: {current.toLocaleString()}</span>
        <span>Target: {target.toLocaleString()}</span>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color = "indigo", subtitle }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md md:rounded-3xl md:p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3 md:space-y-4">
          <div className={`inline-flex rounded-xl p-2 md:rounded-2xl md:p-3 ${colors[color]}`}>
            <Icon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 md:text-sm">{title}</p>
            <h3 className="text-lg font-bold text-slate-900 md:text-2xl">{value}</h3>
            {subtitle && <p className="mt-0.5 text-[10px] text-slate-400 md:mt-1 md:text-xs">{subtitle}</p>}
          </div>
        </div>
        <div className="opacity-0 transition-opacity group-hover:opacity-100 hidden md:block">
            <ArrowUpRight className="h-5 w-5 text-slate-300" />
        </div>
      </div>
    </div>
  );
};

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(val || 0);

export default function CsoDashboard({
  mode = "cso",
  timeframe: externalTimeframe = "today",
  onTimeframeChange,
  dashboardData,
  dashboardLoading = false,
  outstandingTotal = 0,
  outstandingLoading = false,
}) {
  const dispatch = useDispatch();
  const isAdminView = mode === "admin";

  const [internalTimeframe, setInternalTimeframe] = useState("today");

  const {
    dashboardStats,
    dashboardStatsLoading,
    totalOutstanding: stateOutstanding,
    outstandingLoading: stateOutstandingLoading,
  } = useSelector((state) => state.loan);

  const activeTimeframe = isAdminView ? externalTimeframe : internalTimeframe;

  useEffect(() => {
    if (isAdminView) {
      return;
    }

    dispatch(fetchDashboardStats(activeTimeframe));
  }, [dispatch, isAdminView, activeTimeframe]);

  useEffect(() => {
    if (isAdminView) {
      return;
    }

    dispatch(fetchCsoOutstandingLoans());
  }, [dispatch, isAdminView]);

  const handleTimeframeChange = (value) => {
    if (isAdminView) {
      onTimeframeChange?.(value);
    } else {
      setInternalTimeframe(value);
    }
  };

  const timeframes = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
  ];

  const dashboardStatsSource = isAdminView ? dashboardData : dashboardStats;
  const dashboardLoadingSource = isAdminView
    ? dashboardLoading
    : dashboardStatsLoading;
  const outstandingTotalSource = isAdminView
    ? outstandingTotal
    : stateOutstanding;
  const outstandingLoadingSource = isAdminView
    ? outstandingLoading
    : stateOutstandingLoading;

  const metricsFromDashboard = dashboardStatsSource?.metrics || {};
  const normalizedOutstanding = Number(
    Number.isFinite(outstandingTotalSource)
      ? outstandingTotalSource
      : NaN
  );
  const metricsPending = Number(metricsFromDashboard.pendingAmount || 0);
  let outstandingValue = metricsPending;

  if (outstandingValue <= 0 && Number.isFinite(normalizedOutstanding) && normalizedOutstanding > 0) {
    outstandingValue = normalizedOutstanding;
  }

  const doughnutData = useMemo(() => {
    if (!dashboardStatsSource) return null;
    const { targets } = dashboardStatsSource;
    const limit = targets.defaultingTarget || 1;
    const defaulting = outstandingValue || 0;
    const remaining = Math.max(0, limit - defaulting);

    const percentage = limit > 0 ? (defaulting / limit) * 100 : 0;

    let color = '#22c55e'; // Green (< 70%)
    if (percentage >= 90) {
      color = '#e11d48'; // Red (>= 90%)
    } else if (percentage >= 70) {
      color = '#f97316'; // Orange (70% - 90%)
    }

    return {
      labels: ["Outstanding Debt", "Remaining Limit"],
      datasets: [
        {
          data: [defaulting, remaining],
          backgroundColor: [color, "#f1f5f9"],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  }, [dashboardStatsSource, outstandingTotalSource]);

  const barData = useMemo(() => {
    if (!dashboardStatsSource) return null;
    const stats = dashboardStatsSource.monthlyLoanStats;
    const target = dashboardStatsSource.targets.disbursementTarget;

    return {
      labels: stats.map(s => s.month),
      datasets: [
        {
          label: 'Amount Disbursed',
          data: stats.map(s => s.amount || 0),
          backgroundColor: '#4f46e5',
          borderRadius: 8,
        },
        {
          label: 'Monthly Target',
          data: Array(12).fill(target),
          type: 'line',
          borderColor: '#fbbf24',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }
      ],
    };
  }, [dashboardStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Amount: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        suggestedMax: 5000000, // 5M
        grid: { display: false },
        ticks: {
          stepSize: 500000, // 0.5M
          callback: (value) => {
            if (value === 0) return '0';
            if (value >= 1000000) {
              const val = value / 1000000;
              return Number.isInteger(val) ? val + 'm' : val.toFixed(1) + 'm';
            }
            if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
            return value;
          }
        }
      },
      x: { grid: { display: false } }
    }
  };

  const doughnutOptions = {
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { 
        enabled: true,
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed !== null) {
                label += formatCurrency(context.parsed);
            }
            return label;
          }
        }
      }
    }
  };

  const loadingState =
    dashboardLoadingSource || outstandingLoadingSource;

  if (loadingState && !dashboardStatsSource) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  const { metrics, targets, remittance } = dashboardStatsSource || {
    metrics: { loanCount: 0, totalDisbursed: 0, totalCollection: 0, pendingAmount: 0 },
    targets: { loanTarget: 0, disbursementTarget: 0, defaultingTarget: 0 },
    remittance: { collected: 0, paid: 0 }
  };

  return (
    <div className="relative space-y-8 pb-12">
      {loadingState && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">CSO Performance</h1>
          <p className="mt-1 text-xs text-slate-500 md:text-sm">Overview of your loan activities and targets</p>
        </div>

        <div className="flex w-full overflow-x-auto pb-2 lg:w-auto lg:pb-0">
          <div className="flex min-w-max items-center gap-1 rounded-2xl bg-slate-100 p-1">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => handleTimeframeChange(tf.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all md:text-sm ${
                  activeTimeframe === tf.id
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <MetricCard 
          title="Loan Count" 
          value={metrics.loanCount} 
          icon={Users} 
          color="indigo"
          subtitle={`${targets.loanTarget} target`}
        />
        <MetricCard 
          title="Total Disbursed" 
          value={formatCurrency(metrics.totalDisbursed)} 
          icon={TrendingUp} 
          color="emerald"
          subtitle={`${formatCurrency(targets.disbursementTarget)} target`}
        />
        <MetricCard 
          title="Total Collection" 
          value={formatCurrency(metrics.totalCollection)} 
          icon={Wallet} 
          color="amber"
          subtitle="Payments + Form Fees"
        />
        <MetricCard 
          title="Pending Amount" 
          value={formatCurrency(metrics.pendingAmount)} 
          icon={Clock} 
          color="rose"
          subtitle="Outstanding from customers"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Progress Section */}
        <section className="col-span-full space-y-6 rounded-2xl border border-slate-200 bg-white p-4 md:space-y-8 md:rounded-3xl md:p-8 lg:col-span-2">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Target className="h-5 w-5 text-indigo-600" />
            <h2>Target Progress</h2>
          </div>
          
          <div className="space-y-8">
            <ProgressBar label="Loan Distribution" current={metrics.loanCount} target={targets.loanTarget} color="indigo" />
            <ProgressBar label="Disbursement Value" current={metrics.totalDisbursed} target={targets.disbursementTarget} color="emerald" />
            <ProgressBar 
                label="Collection Efficiency" 
                current={metrics.totalCollection} 
                target={metrics.pendingAmount + metrics.totalCollection} 
                color="amber" 
            />
            <ProgressBar 
                label="Remittance Completion" 
                current={remittance.paid} 
                target={remittance.collected} 
                color="rose" 
            />
          </div>
        </section>

        {/* Charts Section */}
        <div className="col-span-full space-y-6 md:space-y-8 lg:col-span-3">
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {/* Default Tracker */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 md:rounded-3xl md:p-8">
                <div className="mb-4 flex items-center gap-2 font-bold text-slate-900 md:mb-6">
                    <ShieldAlert className="h-5 w-5 text-rose-600" />
                    <h2 className="text-sm md:text-base">Default Limit Tracker</h2>
                </div>
                <div className="relative flex flex-1 items-center justify-center py-4">
                    <div className="h-36 w-36 md:h-48 md:w-48">
                        {doughnutData && <Doughnut data={doughnutData} options={doughnutOptions} />}
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-slate-900 md:text-2xl">{formatCurrency(outstandingValue || 0)}</span>
                        <span className="text-[8px] uppercase text-slate-400 md:text-[10px]">of {formatCurrency(targets.defaultingTarget)} max</span>
                    </div>
                </div>
            </div>

            {/* Quick Summary Section */}
            {/* <div className="rounded-3xl bg-indigo-600 p-8 text-white shadow-lg shadow-indigo-100">
               <div className="flex h-full flex-col justify-between">
                  <div className="space-y-2">
                      <p className="text-indigo-100">Projected Monthly Earnings</p>
                      <h4 className="text-2xl font-bold">{formatCurrency((metrics.totalCollection * 0.1) || 0)}</h4>
                  </div>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between border-t border-indigo-400/30 pt-4">
                          <span className="text-sm text-indigo-100">Collection Rate</span>
                          <span className="font-bold">84%</span>
                      </div>
                      <button className="flex w-full items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20">
                          View Detailed Report
                          <ChevronRight className="h-4 w-4" />
                      </button>
                  </div>
               </div>
            </div> */}
          </div>

          {/* Monthly Bar Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:rounded-3xl md:p-8">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-6">
                <h2 className="text-sm font-bold text-slate-900 md:text-base">Monthly Performance</h2>
                <div className="flex items-center gap-4 text-[10px] font-medium text-slate-400 md:text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                        <span>Actual</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                        <span>Target</span>
                    </div>
                </div>
            </div>
            <div className="h-48 w-full md:h-64">
                {barData && <Bar data={barData} options={chartOptions} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
