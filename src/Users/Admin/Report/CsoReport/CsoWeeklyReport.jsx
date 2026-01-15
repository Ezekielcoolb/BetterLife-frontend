import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  Loader2,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  fetchCsoWeeklyLoanCounts,
  clearAdminLoanErrors,
} from "../../../../redux/slices/adminLoanSlice";

const formatMonthLabel = (year, month) => {
  if (!year || !month) {
    return "Select Month";
  }

  const date = new Date(year, month - 1, 1);
  return date.toLocaleString("en-GB", { month: "long", year: "numeric" });
};

const formatWeekLabel = (week) => {
  if (!week) return "Week";

  const start = week.startDate ? new Date(week.startDate) : null;
  const end = week.endDate ? new Date(week.endDate) : null;

  const range = [start, end]
    .map((date) =>
      date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })
        : ""
    )
    .filter(Boolean)
    .join(" – ");

  return {
    title: week.label || `Week ${week.index + 1}`,
    range,
  };
};

const ensureMonthOptions = (current, available = []) => {
  const map = new Map();

  const addOption = (entry) => {
    if (!entry || !entry.year || !entry.month) {
      return;
    }

    const key = `${entry.year}-${String(entry.month).padStart(2, "0")}`;
    if (map.has(key)) {
      return;
    }

    map.set(key, {
      key,
      year: entry.year,
      month: entry.month,
      label: formatMonthLabel(entry.year, entry.month),
    });
  };

  addOption(current);
  available.forEach(addOption);

  return Array.from(map.values()).sort((first, second) => {
    if (first.year !== second.year) {
      return second.year - first.year;
    }

    return second.month - first.month;
  });
};

export default function CsoWeeklyReport() {
  const dispatch = useDispatch();

  const {
    csoWeeklyData,
    csoWeeklyWeeks,
    csoWeeklySummary,
    csoWeeklyMonth,
    csoWeeklyAvailableMonths,
    csoWeeklyGeneratedAt,
    csoWeeklyLoading,
    csoWeeklyError,
  } = useSelector((state) => state.adminLoans);

  const [monthSelection, setMonthSelection] = useState(() => ({
    month: csoWeeklyMonth?.month || new Date().getMonth() + 1,
    year: csoWeeklyMonth?.year || new Date().getFullYear(),
  }));

  useEffect(() => {
    if (csoWeeklyMonth?.month && csoWeeklyMonth?.year) {
      setMonthSelection({ month: csoWeeklyMonth.month, year: csoWeeklyMonth.year });
    }
  }, [csoWeeklyMonth?.month, csoWeeklyMonth?.year]);

  useEffect(() => {
    dispatch(
      fetchCsoWeeklyLoanCounts({
        month: monthSelection.month,
        year: monthSelection.year,
      })
    );
  }, [dispatch, monthSelection.month, monthSelection.year]);

  useEffect(() => {
    if (!csoWeeklyError) {
      return;
    }

    toast.error(csoWeeklyError);
    dispatch(clearAdminLoanErrors());
  }, [csoWeeklyError, dispatch]);

  const weekHeaders = useMemo(() => {
    if (!Array.isArray(csoWeeklyWeeks) || csoWeeklyWeeks.length === 0) {
      return [];
    }

    return csoWeeklyWeeks.map((week) => ({
      ...week,
      label: formatWeekLabel(week),
    }));
  }, [csoWeeklyWeeks]);

  const monthOptions = useMemo(
    () => ensureMonthOptions(csoWeeklyMonth, csoWeeklyAvailableMonths),
    [csoWeeklyAvailableMonths, csoWeeklyMonth]
  );

  const currentMonthLabel = formatMonthLabel(
    monthSelection.year,
    monthSelection.month
  );

  const generatedAtLabel = useMemo(() => {
    if (!csoWeeklyGeneratedAt) {
      return null;
    }

    const generated = new Date(csoWeeklyGeneratedAt);
    if (Number.isNaN(generated.getTime())) {
      return null;
    }

    return generated.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [csoWeeklyGeneratedAt]);

  const summaryTotals = useMemo(() => {
    if (!csoWeeklySummary?.weekTotals) {
      return [];
    }

    return weekHeaders.map((week) =>
      csoWeeklySummary.weekTotals.find((item) => item.index === week.index) || {
        index: week.index,
        count: 0,
      }
    );
  }, [csoWeeklySummary?.weekTotals, weekHeaders]);

  const handleMonthChange = (event) => {
    const value = event.target.value;

    if (!value) {
      return;
    }

    const [year, month] = value.split("-").map((part) => Number.parseInt(part, 10));
    if (!Number.isFinite(year) || !Number.isFinite(month)) {
      return;
    }

    setMonthSelection({ month, year });
  };

  const handleRefresh = () => {
    dispatch(
      fetchCsoWeeklyLoanCounts({
        month: monthSelection.month,
        year: monthSelection.year,
      })
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CSO Weekly Report</h1>
          <p className="text-sm text-slate-500">
            Loan disbursement counts grouped by CSO and weekly buckets.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-400" />
            <select
              value={`${monthSelection.year}-${String(monthSelection.month).padStart(2, "0")}`}
              onChange={handleMonthChange}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {monthOptions.length === 0 ? (
                <option value="">
                  {formatMonthLabel(monthSelection.year, monthSelection.month)}
                </option>
              ) : (
                monthOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Month
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {currentMonthLabel}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total CSOs
          </p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">
            {csoWeeklySummary?.totalCsos || 0}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Loans
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {csoWeeklySummary?.totalLoans || 0}
          </p>
        </article>
      </section>

      {generatedAtLabel && (
        <div className="text-xs text-slate-400">
          Generated at {generatedAtLabel}
        </div>
      )}

      {csoWeeklyLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    CSO
                  </th>
                  {weekHeaders.map((week) => (
                    <th
                      key={week.index}
                      className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      <div className="font-semibold text-slate-700">
                        {week.label.title}
                      </div>
                      {week.label.range && (
                        <div className="text-[10px] text-slate-400">
                          {week.label.range}
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {csoWeeklyData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(2, weekHeaders.length + 2)}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-slate-400" />
                        <p>No loans were disbursed for the selected month.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  csoWeeklyData.map((cso) => (
                    <tr key={cso.csoId} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{cso.csoName}</div>
                        <div className="text-xs text-slate-400">{cso.csoId}</div>
                      </td>
                      {weekHeaders.map((week) => {
                        const weekEntry = cso.weeks?.find(
                          (entry) => entry.index === week.index
                        );
                        return (
                          <td key={week.index} className="px-4 py-3 text-center font-mono text-base text-slate-700">
                            {weekEntry?.count || 0}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-semibold text-slate-900">
                        {cso.total || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {csoWeeklyData.length > 0 && (
                <tfoot className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Weekly Totals
                    </th>
                    {summaryTotals.map((week) => (
                      <td
                        key={week.index}
                        className="px-4 py-3 text-center font-semibold text-slate-700"
                      >
                        {week.count || 0}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-semibold text-indigo-600">
                      {csoWeeklySummary?.totalLoans || 0}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
