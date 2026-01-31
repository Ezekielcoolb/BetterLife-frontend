import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { fetchCsoGeneralReport } from "../../../../redux/slices/adminLoanSlice";

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENCY_FORMAT = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const NUMBER_FORMAT = new Intl.NumberFormat("en-NG");

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => CURRENCY_FORMAT.format(safeNumber(value));
const formatNumber = (value) => NUMBER_FORMAT.format(safeNumber(value));
const formatPercent = (value) => `${safeNumber(value).toFixed(1)}%`;

const resolveMonth = (value) => {
  const parsed = Number(value);
  return parsed >= 1 && parsed <= 12 ? parsed : null;
};

const resolveYear = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const BREAKDOWN_COLUMNS = [
  { key: "portfolioWorth", label: "Portfolio Worth", format: "currency" },
  { key: "balanceOfDebt", label: "Balance of Debt", format: "currency" },
  { key: "totalLoans", label: "Loan Count", format: "number" },
  { key: "totalRepayment", label: "Total Repayment", format: "currency" },
  { key: "totalDisbursed", label: "Total Amount Disbursed", format: "currency" },
  { key: "totalInterest", label: "Total Interest", format: "currency" },
  { key: "totalLoanAppForm", label: "Card & Others", format: "currency" },
  { key: "totalInsurance", label: "Insurance", format: "currency" },
  { key: "totalExpenses", label: "Total Expenses", format: "currency" },
  { key: "totalProfit", label: "Total Profit", format: "currency" },
  { key: "loanBalance", label: "Loan Balance", format: "currency" },
  { key: "totalRecovery", label: "Recovery", format: "currency" },
  { key: "overshootValue", label: "Overtarget Value", format: "currency" },
  { key: "tenBones", label: "Bonus on Overtarget", format: "currency" },
  { key: "profitability", label: "Profitability", format: "percent" },
];

export default function CsoReportDetails() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { csoId } = useParams();
  const [searchParams] = useSearchParams();

  const queryMonth = resolveMonth(searchParams.get("month"));
  const queryYear = resolveYear(searchParams.get("year"));

  const {
    csoGeneralData,
    csoGeneralMonth,
    csoGeneralLoading,
    csoGeneralAvailableMonths,
  } = useSelector((state) => state.adminLoans);

  const targetMonth =
    queryMonth ?? location.state?.monthSelection?.month ?? csoGeneralMonth?.month;
  const targetYear =
    queryYear ?? location.state?.monthSelection?.year ?? csoGeneralMonth?.year;

  useEffect(() => {
    if (!targetMonth || !targetYear) {
      return;
    }

    const needsFetch =
      csoGeneralMonth?.month !== targetMonth ||
      csoGeneralMonth?.year !== targetYear ||
      !Array.isArray(csoGeneralData) ||
      csoGeneralData.length === 0;

    if (needsFetch) {
      dispatch(fetchCsoGeneralReport({ month: targetMonth, year: targetYear }));
    }
  }, [dispatch, targetMonth, targetYear, csoGeneralData, csoGeneralMonth?.month, csoGeneralMonth?.year]);

  const csoFromState = location.state?.cso;

  const csoFromStore = useMemo(() => {
    if (!Array.isArray(csoGeneralData) || !csoId) {
      return null;
    }

    return (
      csoGeneralData.find((entry) => `${entry.csoId}` === `${csoId}`) || null
    );
  }, [csoGeneralData, csoId]);

  const activeCso = csoFromStore || csoFromState;

  const availableMonths = useMemo(() => {
    if (!Array.isArray(csoGeneralAvailableMonths)) {
      return [];
    }

    const normalized = csoGeneralAvailableMonths
      .map((entry) => {
        const month = Number(entry?.month);
        const year = Number(entry?.year);

        if (!Number.isFinite(month) || !Number.isFinite(year)) {
          return null;
        }

        const label =
          entry?.label ||
          new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
            month: "short",
            year: "numeric",
          });

        return { month, year, label };
      })
      .filter(Boolean);

    if (targetMonth && targetYear) {
      const exists = normalized.some(
        (entry) => entry.month === targetMonth && entry.year === targetYear
      );

      if (!exists) {
        const fallbackLabel = new Date(targetYear, targetMonth - 1, 1).toLocaleDateString(
          "en-GB",
          {
            month: "short",
            year: "numeric",
          }
        );

        normalized.push({ month: targetMonth, year: targetYear, label: fallbackLabel });
      }
    }

    normalized.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }

      return b.month - a.month;
    });

    return normalized;
  }, [csoGeneralAvailableMonths, targetMonth, targetYear]);

  const currentMonthIndex = useMemo(() => {
    if (!targetMonth || !targetYear) {
      return -1;
    }

    return availableMonths.findIndex(
      (entry) => entry.month === targetMonth && entry.year === targetYear
    );
  }, [availableMonths, targetMonth, targetYear]);

  const previousMonth =
    currentMonthIndex >= 0 && currentMonthIndex < availableMonths.length - 1
      ? availableMonths[currentMonthIndex + 1]
      : null;

  const nextMonth =
    currentMonthIndex > 0 ? availableMonths[currentMonthIndex - 1] : null;

  const navigationHint = useMemo(() => {
    const hints = [];

    if (previousMonth) {
      hints.push(`Prev: ${previousMonth.label}`);
    }

    if (nextMonth) {
      hints.push(`Next: ${nextMonth.label}`);
    }

    return hints.join(" • ");
  }, [nextMonth, previousMonth]);

  const handleNavigateToMonth = (entry) => {
    if (!entry || !csoId) {
      return;
    }

    const params = new URLSearchParams({
      month: String(entry.month),
      year: String(entry.year),
    });

    navigate(`/admin/reports/cso/${csoId}?${params.toString()}`, {
      replace: false,
      state: {
        ...location.state,
        monthSelection: { month: entry.month, year: entry.year },
      },
    });
  };

  const handleMonthSelect = (event) => {
    const value = event.target.value;
    if (!value) {
      return;
    }

    const [yearPart, monthPart] = value.split("-");
    const month = Number.parseInt(monthPart, 10);
    const year = Number.parseInt(yearPart, 10);

    if (!Number.isFinite(month) || !Number.isFinite(year)) {
      return;
    }

    handleNavigateToMonth({ month, year });
  };

  const monthLabel = useMemo(() => {
    if (!targetMonth || !targetYear) {
      return "Reporting Period";
    }

    const monthName = MONTH_NAMES[targetMonth] ?? "";
    return `${monthName} ${targetYear}`.trim();
  }, [targetMonth, targetYear]);

  const portfolioWorth = safeNumber(activeCso?.portfolioWorth);
  const balanceOfDebt = safeNumber(activeCso?.balanceOfDebt);
  const totalRepayment = safeNumber(activeCso?.totalRepayment);
  const totalDisbursed = safeNumber(activeCso?.totalDisbursed);
  const totalInterest = safeNumber(activeCso?.totalInterest);
  const totalLoans = safeNumber(activeCso?.totalLoans);
  const totalRecovery = safeNumber(activeCso?.totalRecovery);
  const overshootValue = safeNumber(activeCso?.overshootValue);
  const tenBones = safeNumber(activeCso?.tenBones);
  const totalLoanAppForm = safeNumber(activeCso?.totalLoanAppForm);
  const totalInsurance = safeNumber(activeCso?.totalInsurance);
  const totalExpenses = safeNumber(activeCso?.totalExpenses);
  const totalProfit =
    activeCso && activeCso.totalProfit !== undefined && activeCso.totalProfit !== null
      ? safeNumber(activeCso.totalProfit)
      : safeNumber(totalInterest + totalLoanAppForm + totalInsurance - totalExpenses);
  const loanBalance =
    activeCso && activeCso.loanBalance !== undefined && activeCso.loanBalance !== null
      ? safeNumber(activeCso.loanBalance)
      : safeNumber(portfolioWorth - totalRepayment);
  const profitability =
    activeCso && activeCso.profitability !== undefined && activeCso.profitability !== null
      ? safeNumber(activeCso.profitability)
      : (() => {
          const profitBase = totalInterest + totalLoanAppForm + totalInsurance;
          if (profitBase <= 0) {
            return 0;
          }
          return safeNumber((totalProfit / profitBase) * 100);
        })();

  const performance = useMemo(() => {
    if (!portfolioWorth) {
      return 0;
    }

    const ratio = (totalRepayment / portfolioWorth) * 100;
    return Math.min(100, Math.round(ratio));
  }, [portfolioWorth, totalRepayment]);

  const netPortfolio = portfolioWorth - balanceOfDebt;
  const averageTicket = totalLoans > 0 ? portfolioWorth / totalLoans : 0;
  const overshootCount = Math.max(0, totalLoans - 100);

  const breakdownRow = {
    portfolioWorth,
    balanceOfDebt,
    totalLoans,
    totalRepayment,
    totalDisbursed,
    totalInterest,
    totalLoanAppForm,
    totalInsurance,
    totalExpenses,
    totalProfit,
    loanBalance,
    totalRecovery,
    overshootValue,
    tenBones,
    profitability,
  };

  const renderBreakdownValue = (column) => {
    const value = breakdownRow[column.key] ?? 0;

    if (column.format === "currency") {
      return formatCurrency(value);
    }

    if (column.format === "number") {
      return formatNumber(value);
    }

    if (column.format === "percent") {
      return formatPercent(value);
    }

    return value;
  };

  const highlightCards = [
    {
      label: "Portfolio Worth",
      value: formatCurrency(portfolioWorth),
      icon: Wallet,
      accent: "from-indigo-500 to-indigo-700",
    },
    {
      label: "Total Repayment",
      value: formatCurrency(totalRepayment),
      icon: TrendingUp,
      accent: "from-emerald-500 to-emerald-700",
    },
    {
      label: "Balance of Debt",
      value: formatCurrency(balanceOfDebt),
      icon: TrendingDown,
      accent: "from-rose-500 to-rose-700",
    },
    {
      label: "Total Recovery",
      value: formatCurrency(totalRecovery),
      icon: ShieldCheck,
      accent: "from-amber-500 to-amber-700",
    },
  ];

  const detailMetrics = [
    {
      label: "Total Loans",
      value: formatNumber(totalLoans),
      helper: "Loans issued within the month",
    },
    {
      label: "Profit",
      value: formatCurrency(totalProfit),
      helper: "Interest + card & others − expenses",
    },
    {
      label: "Net Portfolio",
      value: formatCurrency(netPortfolio),
      helper: "Portfolio worth minus debt",
    },
    {
      label: "Overshoot Value",
      value: formatCurrency(overshootValue),
      helper: overshootCount > 0
        ? `${formatNumber(overshootCount)} loans over the 100 target`
        : "No overshoot recorded",
    },
    {
      label: "Ten Bones (1%)",
      value: formatCurrency(tenBones),
      helper: "One percent of the overshoot value",
    },
    {
      label: "Total Disbursed",
      value: formatCurrency(totalDisbursed),
      helper: "Cash outlay for the month",
    },
    {
      label: "Total Interest",
      value: formatCurrency(totalInterest),
      helper: "Interest accrued on the portfolio",
    },
    {
      label: "Performance",
      value: `${performance}%`,
      helper: "Repayment as a share of portfolio worth",
    },
  ];

  if (!activeCso && csoGeneralLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!activeCso) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to reports
        </button>

        <div className="rounded-3xl border border-dashed border-rose-200 bg-rose-50/60 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-rose-700">
            CSO data unavailable
          </h1>
          <p className="mt-2 text-sm text-rose-600">
            We couldn&apos;t locate the report details for this CSO in the selected month. Please return to the general report and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to reports
        </button>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow">
              <CalendarDays className="h-4 w-4" />
              {monthLabel}
            </div>

            <div className="inline-flex items-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm">
              <button
                type="button"
                onClick={() => handleNavigateToMonth(previousMonth)}
                disabled={!previousMonth}
                className="flex items-center justify-center p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">View previous month</span>
              </button>
              <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
              <button
                type="button"
                onClick={() => handleNavigateToMonth(nextMonth)}
                disabled={!nextMonth}
                className="flex items-center justify-center p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">View next month</span>
              </button>
            </div>

            {availableMonths.length > 0 && (
              <select
                value={targetMonth && targetYear ? `${targetYear}-${String(targetMonth).padStart(2, "0")}` : ""}
                onChange={handleMonthSelect}
                className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-auto"
              >
                <option value="" disabled>
                  Jump to month
                </option>
                {availableMonths.map((entry) => (
                  <option
                    key={`${entry.year}-${String(entry.month).padStart(2, "0")}`}
                    value={`${entry.year}-${String(entry.month).padStart(2, "0")}`}
                  >
                    {entry.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {navigationHint && (
            <p className="text-xs text-slate-400">{navigationHint}</p>
          )}
        </div>
      </div>

      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-700 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              CSO Overview
            </span>
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                {activeCso?.csoName || "CSO"}
              </h1>
              {activeCso?.branch && (
                <p className="mt-1 text-sm text-white/70">
                  Branch: {activeCso.branch}
                </p>
              )}
            </div>

            <p className="max-w-2xl text-sm text-white/70">
              A deep dive into this CSO&apos;s performance for {monthLabel}. Review repayment velocity, debt exposure, disbursement activity, and incentive earnings in one place.
            </p>

            <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm">
              <span className="font-semibold text-white">Performance</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900">
                {performance}%
              </span>
              <span className="text-xs text-white/70">
                Repayment vs. portfolio worth
              </span>
            </div>
          </div>

          <div className="grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
            {highlightCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.label}
                  className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur`}
                >
                  <div
                    className={`absolute inset-0 -z-10 bg-gradient-to-br ${card.accent} opacity-70`}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-white/70">
                      {card.label}
                    </p>
                    <Icon className="h-5 w-5 text-white/80" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {card.value}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[detailMetrics[0], detailMetrics[1], detailMetrics[2]].map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {metric.value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{metric.helper}</p>
          </div>
        ))}
        {[detailMetrics[3], detailMetrics[4], detailMetrics[7]].map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {metric.value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{metric.helper}</p>
          </div>
        ))}
      </section> */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <Coins className="h-5 w-5 text-indigo-500" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Monthly Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Full financial snapshot for {monthLabel}
            </p>
          </div>
        </header>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[360px] divide-y divide-slate-200 text-sm">
            <tbody className="divide-y divide-slate-200 bg-white">
              {BREAKDOWN_COLUMNS.map((column) => (
                <tr key={column.key}>
                  <th
                    scope="row"
                    className="min-w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {column.label}
                  </th>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {renderBreakdownValue(column)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Profit = Total Interest + Card & Others + Insurance − Total Expenses.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Coins className="h-5 w-5 text-indigo-500" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Financial Summary
              </h2>
              <p className="text-xs text-slate-500">
                Snapshot of cash movement and revenue for {monthLabel}
              </p>
            </div>
          </header>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[detailMetrics[5], detailMetrics[6], detailMetrics[0], detailMetrics[1]]
              .map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {metric.label}
                  </dt>
                  <dd className="mt-2 text-lg font-semibold text-slate-900">
                    {metric.value}
                  </dd>
                  <p className="mt-1 text-xs text-slate-500">{metric.helper}</p>
                </div>
              ))}
          </dl>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Risk & Incentives
              </h2>
              <p className="text-xs text-slate-500">
                Debt exposure and overshoot performance
              </p>
            </div>
          </header>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Balance of Debt
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {formatCurrency(balanceOfDebt)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Outstanding repayment balance carried for the period
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Overshoot Bonus
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <p className="text-xl font-semibold text-slate-900">
                  {formatCurrency(tenBones)}
                </p>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {formatCurrency(overshootValue)} overshoot
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Incentive earned from {formatNumber(overshootCount)} additional loans beyond the 100-loan target.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Net Portfolio Position
              </p>
              <p
                className={`mt-2 text-xl font-semibold ${
                  netPortfolio >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatCurrency(netPortfolio)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Portfolio strength after accounting for outstanding debt
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <TrendingUp className="h-5 w-5 text-indigo-500" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Performance Highlights
            </h2>
            <p className="text-xs text-slate-500">
              Key takeaways for decision-making and follow-up
            </p>
          </div>
        </header>

        <ul className="mt-4 space-y-4 text-sm text-slate-600">
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Repayment coverage</p>
              <p className="text-xs text-slate-500">
                {performance}% of the portfolio worth has been repaid. Monitor repayment velocity if coverage drops below 70%.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Debt exposure</p>
              <p className="text-xs text-slate-500">
                Outstanding balance stands at {formatCurrency(balanceOfDebt)}. Plan targeted recovery strategies to keep exposure within appetite.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Coins className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Overshoot incentive</p>
              <p className="text-xs text-slate-500">
                {overshootCount > 0
                  ? `Eligible for ₦${formatNumber(tenBones)} in bonuses from ${formatNumber(overshootCount)} overshoot loans.`
                  : "No overshoot recorded for this period."}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Recovery focus</p>
              <p className="text-xs text-slate-500">
                Total recoveries of {formatCurrency(totalRecovery)} highlight ongoing remediation. Continue coaching to sustain progress.
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
