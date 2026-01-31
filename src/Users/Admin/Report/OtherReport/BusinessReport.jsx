import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  TrendingUp,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  fetchBusinessReportWeeklyMetrics,
  fetchBusinessReportLiquidity,
  clearAdminLoanErrors,
} from "../../../../redux/slices/adminLoanSlice";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-NG");

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => currencyFormatter.format(safeNumber(value));
const formatNumber = (value) => numberFormatter.format(safeNumber(value));

const formatMonthLabel = (year, month) => {
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return "Select Month";
  }

  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

const formatWeekRange = (start, end) => {
  if (!start || !end) {
    return "";
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  });

  const startLabel = formatter.format(startDate);
  const endLabel = formatter.format(endDate);

  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
};

const shiftMonth = ({ month, year }, delta) => {
  const date = new Date(year, month - 1 + delta, 1);
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
};

const isAfter = (left, right) => {
  if (left.year > right.year) return true;
  if (left.year < right.year) return false;
  return left.month > right.month;
};

const generateMonthOptions = ({ month, year }, count = 12) => {
  const options = [];

  for (let index = 0; index < count; index += 1) {
    const reference = new Date(year, month - 1 - index, 1);
    const optionMonth = reference.getMonth() + 1;
    const optionYear = reference.getFullYear();

    options.push({
      value: `${optionYear}-${String(optionMonth).padStart(2, "0")}`,
      label: formatMonthLabel(optionYear, optionMonth),
      month: optionMonth,
      year: optionYear,
    });
  }

  return options;
};

const buildWeekOptions = (weeks = []) =>
  weeks.map((week) => ({
    value: week.weekKey,
    label: week.label || `Week ${week.order + 1}`,
  }));

const resolveCurrentWeekIndex = (weeks = []) => {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return -1;
  }

  const now = new Date();
  const nowTime = now.getTime();

  // First, check if today falls within any week's range
  for (let index = 0; index < weeks.length; index += 1) {
    const week = weeks[index];
    const start = week.startDate ? new Date(week.startDate).getTime() : NaN;
    const end = week.endDate ? new Date(week.endDate).getTime() : NaN;

    if (!Number.isNaN(start) && !Number.isNaN(end) && start <= nowTime && nowTime <= end) {
      return index;
    }
  }

  // If not (e.g., it's a weekend), find the most recent week that has ended
  let mostRecentWeekIndex = -1;
  let mostRecentEndTime = -Infinity;

  for (let index = 0; index < weeks.length; index += 1) {
    const week = weeks[index];
    const end = week.endDate ? new Date(week.endDate).getTime() : NaN;

    if (!Number.isNaN(end) && end < nowTime && end > mostRecentEndTime) {
      mostRecentEndTime = end;
      mostRecentWeekIndex = index;
    }
  }

  // If we found a recent past week, return it; otherwise return the first week
  return mostRecentWeekIndex >= 0 ? mostRecentWeekIndex : 0;
};

const mergeWeekDays = (primaryDays = [], secondaryDays = []) => {
  if (!Array.isArray(primaryDays) || primaryDays.length === 0) {
    return Array.isArray(secondaryDays) ? secondaryDays.slice() : [];
  }

  if (!Array.isArray(secondaryDays) || secondaryDays.length === 0) {
    return primaryDays.slice();
  }

  const dayMap = new Map();

  for (const day of primaryDays) {
    if (day?.date) {
      dayMap.set(day.date, { ...day });
    }
  }

  for (const day of secondaryDays) {
    if (!day?.date) {
      continue;
    }

    if (dayMap.has(day.date)) {
      dayMap.set(day.date, {
        ...dayMap.get(day.date),
        ...day,
      });
    } else {
      dayMap.set(day.date, { ...day });
    }
  }

  return Array.from(dayMap.values()).sort(
    (first, second) => (first.order ?? 0) - (second.order ?? 0)
  );
};

export default function BusinessReport() {
  const dispatch = useDispatch();

  const {
    businessReportWeeks,
    businessReportMonth,
    businessReportLoading,
    businessReportError,
    businessLiquidityWeeks,
    businessLiquidityLoading,
    businessLiquidityError,
  } = useSelector((state) => state.adminLoans);

  const currentMonthInfo = useMemo(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }, []);

  const [monthSelection, setMonthSelection] = useState(() => ({
    month: businessReportMonth?.month || currentMonthInfo.month,
    year: businessReportMonth?.year || currentMonthInfo.year,
  }));

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(() => {
    const weeks = businessReportWeeks || businessLiquidityWeeks || [];
    const index = resolveCurrentWeekIndex(weeks);
    return index >= 0 ? index : 0;
  });

  useEffect(() => {
    if (businessReportMonth?.month && businessReportMonth?.year) {
      setMonthSelection({
        month: businessReportMonth.month,
        year: businessReportMonth.year,
      });
    }
  }, [businessReportMonth?.month, businessReportMonth?.year]);

  useEffect(() => {
    dispatch(
      fetchBusinessReportWeeklyMetrics({
        month: monthSelection.month,
        year: monthSelection.year,
      })
    );
    dispatch(
      fetchBusinessReportLiquidity({
        month: monthSelection.month,
        year: monthSelection.year,
      })
    );
  }, [dispatch, monthSelection.month, monthSelection.year]);

  useEffect(() => {
    if (businessReportError) {
      toast.error(businessReportError);
      dispatch(clearAdminLoanErrors());
    }
  }, [businessReportError, dispatch]);

  useEffect(() => {
    if (businessLiquidityError) {
      toast.error(businessLiquidityError);
      dispatch(clearAdminLoanErrors());
    }
  }, [businessLiquidityError, dispatch]);

  const handleShiftMonth = (delta) => {
    const next = shiftMonth(monthSelection, delta);

    if (delta > 0 && isAfter(next, currentMonthInfo)) {
      return;
    }

    setMonthSelection(next);
  };

  const monthOptions = useMemo(
    () => generateMonthOptions(currentMonthInfo, 12),
    [currentMonthInfo]
  );

  const handleMonthSelect = (event) => {
    const value = event.target.value;
    if (!value) {
      return;
    }

    const [yearPart, monthPart] = value.split("-");
    const parsedYear = Number.parseInt(yearPart, 10);
    const parsedMonth = Number.parseInt(monthPart, 10);

    if (!Number.isFinite(parsedYear) || !Number.isFinite(parsedMonth)) {
      return;
    }

    setMonthSelection({ month: parsedMonth, year: parsedYear });
  };

  const combinedWeeks = useMemo(() => {
    const map = new Map();

    if (Array.isArray(businessReportWeeks)) {
      for (const week of businessReportWeeks) {
        if (!week?.weekKey) {
          continue;
        }

        map.set(week.weekKey, {
          ...week,
          days: Array.isArray(week.days) ? week.days.slice() : [],
        });
      }
    }

    if (Array.isArray(businessLiquidityWeeks)) {
      for (const week of businessLiquidityWeeks) {
        if (!week?.weekKey) {
          continue;
        }

        if (map.has(week.weekKey)) {
          const existing = map.get(week.weekKey);
          const mergedDays = mergeWeekDays(existing.days, week.days);

          map.set(week.weekKey, {
            ...existing,
            ...week,
            days: mergedDays,
          });
        } else {
          map.set(week.weekKey, {
            ...week,
            days: Array.isArray(week.days) ? week.days.slice() : [],
          });
        }
      }
    }

    const list = Array.from(map.values());
    list.sort((first, second) => (first.order ?? 0) - (second.order ?? 0));
    return list;
  }, [businessReportWeeks, businessLiquidityWeeks]);

  useEffect(() => {
    const index = resolveCurrentWeekIndex(combinedWeeks);
    setSelectedWeekIndex(index >= 0 ? index : 0);
  }, [combinedWeeks]);

  const loading = businessReportLoading || businessLiquidityLoading;
  const monthLabel = formatMonthLabel(monthSelection.year, monthSelection.month);
  const canGoNext = !isAfter(monthSelection, currentMonthInfo);

  const selectedWeek = combinedWeeks[selectedWeekIndex] || null;
  const weekOptions = useMemo(() => buildWeekOptions(combinedWeeks), [combinedWeeks]);

  const handleWeekShift = (delta) => {
    if (combinedWeeks.length === 0) {
      return;
    }

    const nextIndex = Math.min(
      Math.max(0, selectedWeekIndex + delta),
      combinedWeeks.length - 1
    );

    setSelectedWeekIndex(nextIndex);
  };

  const handleWeekSelect = (event) => {
    const value = event.target.value;
    if (!value) {
      return;
    }

    const index = combinedWeeks.findIndex((week) => week.weekKey === value);
    if (index >= 0) {
      setSelectedWeekIndex(index);
    }
  };

  const weekRangeLabel = selectedWeek
    ? formatWeekRange(selectedWeek.startDate, selectedWeek.endDate)
    : "";

  const dailyRows = useMemo(() => {
    if (!selectedWeek) {
      return [];
    }

    const rows = Array.isArray(selectedWeek.days) ? selectedWeek.days : [];

    if (rows.length === 0) {
      return [];
    }

    return rows
      .slice()
      .sort((first, second) => (first.order ?? 0) - (second.order ?? 0));
  }, [selectedWeek]);

  const monthlyTotals = useMemo(() => {
    return combinedWeeks.reduce(
      (acc, week) => ({
        loanCount: acc.loanCount + (week.loanCount || 0),
        totalDisbursed: acc.totalDisbursed + (week.totalDisbursed || 0),
        totalLoanAppForm: acc.totalLoanAppForm + (week.totalLoanAppForm || 0),
        totalInsurance: acc.totalInsurance + (week.totalInsurance || 0),
        totalInterest: acc.totalInterest + (week.totalInterest || 0),
        totalExpenses: acc.totalExpenses + (week.totalExpenses || 0),
        profit: acc.profit + (week.profit || 0),
      }),
      {
        loanCount: 0,
        totalDisbursed: 0,
        totalLoanAppForm: 0,
        totalInsurance: 0,
        totalInterest: 0,
        totalExpenses: 0,
        profit: 0,
      }
    );
  }, [combinedWeeks]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Report</h1>
          <p className="text-sm text-slate-500">
            Weekly business performance for the selected month. Weeks run Monday to Friday; weekends are excluded.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            {monthLabel}
          </div>

          <div className="inline-flex items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => handleShiftMonth(-1)}
              className="flex items-center justify-center px-3 py-2 text-slate-500 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </button>
            <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
            <button
              type="button"
              onClick={() => handleShiftMonth(1)}
              disabled={!canGoNext}
              className="flex items-center justify-center px-3 py-2 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </button>
          </div>

          <select
            value={`${monthSelection.year}-${String(monthSelection.month).padStart(2, "0")}`}
            onChange={handleMonthSelect}
            className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-auto"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Loan Count</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-slate-900">{formatNumber(monthlyTotals.loanCount)}</p>
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-1 text-xs text-slate-400">Total loans funded for the selected month</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Amount Disbursed</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(monthlyTotals.totalDisbursed)}</p>
            <Wallet className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-1 text-xs text-slate-400">Total disbursement for the selected month</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Cards &amp; Others</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(monthlyTotals.totalLoanAppForm)}</p>
            <TrendingUp className="h-5 w-5 text-violet-500" />
          </div>
          <p className="mt-1 text-xs text-slate-400">Total form charges for the selected month</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Insurance</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(monthlyTotals.totalInsurance)}</p>
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-1 text-xs text-slate-400">Total insurance fees for the selected month</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Interest</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(monthlyTotals.totalInterest)}</p>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-1 text-xs text-slate-400">Total interest for the selected month</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Expenses</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(monthlyTotals.totalExpenses)}</p>
            <TrendingUp className="h-5 w-5 text-rose-500" />
          </div>
          <p className="mt-1 text-xs text-slate-400">Total expenses for the selected month</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Profit</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(monthlyTotals.profit)}</p>
            <TrendingUp className="h-5 w-5 text-rose-500" />
          </div>
          <p className="mt-1 text-xs text-slate-400">Total Profit for the selected month</p>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Loan Balance</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-slate-900">
              {formatCurrency(selectedWeek?.loanBalance || 0)}
            </p>
            <TrendingUp className="h-5 w-5 text-slate-500" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Outstanding balance across all loans as at {selectedWeek?.endDate || "week end"}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Growth</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-slate-900">
              {formatCurrency(selectedWeek?.growth || 0)}
            </p>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Cash at hand + loan balance snapshot for the selected week
          </p>
        </article>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Selected Week</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {selectedWeek ? selectedWeek.label || `Week ${selectedWeek.order + 1}` : "No week"}
          </p>
          <p className="text-xs text-slate-400">{weekRangeLabel || "Monday to Friday window"}</p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm">
            <button
              type="button"
              onClick={() => handleWeekShift(-1)}
              disabled={selectedWeekIndex <= 0}
              className="flex items-center justify-center px-3 py-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Previous week</span>
            </button>
            <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
            <button
              type="button"
              onClick={() => handleWeekShift(1)}
              disabled={selectedWeekIndex >= combinedWeeks.length - 1}
              className="flex items-center justify-center px-3 py-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only">Next week</span>
            </button>
          </div>

          <select
            value={selectedWeek ? selectedWeek.weekKey : ""}
            onChange={handleWeekSelect}
            disabled={weekOptions.length === 0}
            className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-auto"
          >
            {weekOptions.length === 0 ? (
              <option value="">No weeks available</option>
            ) : (
              weekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        </div>
      ) : combinedWeeks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <AlertCircle className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">
            No business metrics were recorded for the selected month. Try choosing another month.
          </p>
        </div>
      ) : !selectedWeek || dailyRows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <AlertCircle className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">
            No weekday activity was recorded for the selected week.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[960px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Day
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Loan Count
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount Disbursed
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cards &amp; Others
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Insurance
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Interest
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Expenses
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Profit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Loan Balance
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cash at Hand
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {dailyRows.map((day) => (
                  <tr key={day.date} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">{day.label}</div>
                      <div className="text-xs text-slate-400">{day.date}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-base text-slate-700">
                      {formatNumber(day.loanCount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(day.totalDisbursed || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(day.totalLoanAppForm || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(day.totalInsurance || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(day.totalInterest || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(day.totalExpenses || 0)}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${safeNumber(day.profit) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatCurrency(day.profit || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(day.loanBalance || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(day.cashAtHand || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {formatCurrency(day.growth || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

