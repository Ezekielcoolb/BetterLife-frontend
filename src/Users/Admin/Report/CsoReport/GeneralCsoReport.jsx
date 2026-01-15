import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Calendar, RefreshCcw, Loader2, AlertCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";

import {
  fetchCsoGeneralReport,
  clearAdminLoanErrors,
} from "../../../../redux/slices/adminLoanSlice";

const CURRENCY_FORMAT = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const NUMBER_FORMAT = new Intl.NumberFormat("en-NG");

const formatCurrency = (value) => {
  if (!Number.isFinite(value)) {
    return "₦0";
  }

  return CURRENCY_FORMAT.format(value);
};

const formatNumber = (value) => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return NUMBER_FORMAT.format(value);
};

const MONTH_LABEL_FORMAT = { month: "long", year: "numeric" };

const ensureMonthOptions = (currentMonth, availableMonths = []) => {
  const normalized = new Map();

  const addEntry = (entry) => {
    if (!entry || !entry.month || !entry.year) {
      return;
    }

    const key = `${entry.year}-${String(entry.month).padStart(2, "0")}`;

    if (normalized.has(key)) {
      return;
    }

    const date = new Date(entry.year, entry.month - 1, 1);
    normalized.set(key, {
      key,
      value: key,
      year: entry.year,
      month: entry.month,
      label: date.toLocaleDateString("en-GB", MONTH_LABEL_FORMAT),
    });
  };

  addEntry(currentMonth);
  availableMonths.forEach(addEntry);

  return Array.from(normalized.values()).sort((first, second) => {
    if (first.year !== second.year) {
      return second.year - first.year;
    }

    return second.month - first.month;
  });
};

const SUMMARY_CARDS = [
  {
    key: "totalCsos",
    label: "Total CSOs",
    formatter: formatNumber,
    accent: "text-indigo-600",
  },
  {
    key: "totalLoans",
    label: "Loan Count",
    formatter: formatNumber,
    accent: "text-emerald-600",
  },
  {
    key: "portfolioWorth",
    label: "Portfolio Worth",
    formatter: formatCurrency,
    accent: "text-slate-900",
  },
  {
    key: "totalDisbursed",
    label: "Total Disbursed",
    formatter: formatCurrency,
    accent: "text-indigo-600",
  },
  {
    key: "balanceOfDebt",
    label: "Balance of Debt",
    formatter: formatCurrency,
    accent: "text-rose-600",
  },
  {
    key: "totalRecovery",
    label: "Total Recovery",
    formatter: formatCurrency,
    accent: "text-emerald-600",
  },
];

const TABLE_COLUMNS = [
  { key: "portfolioWorth", label: "Portfolio Worth", type: "currency" },
  { key: "balanceOfDebt", label: "Balance of Debt", type: "currency" },
  { key: "totalRepayment", label: "Total Repayment", type: "currency" },
  { key: "totalDisbursed", label: "Total Disbursed", type: "currency" },
  { key: "totalInterest", label: "Total Interest", type: "currency" },
  { key: "totalLoans", label: "Loan Count", type: "number" },
  { key: "totalRecovery", label: "Total Recovery", type: "currency" },
  { key: "overshootValue", label: "Overshoot Value", type: "currency" },
  { key: "tenBones", label: "Ten Bones (1%)", type: "currency" },
];

export default function GeneralCsoReport() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    csoGeneralData,
    csoGeneralSummary,
    csoGeneralMonth,
    csoGeneralAvailableMonths,
    csoGeneralGeneratedAt,
    csoGeneralLoading,
    csoGeneralError,
  } = useSelector((state) => state.adminLoans);

  const [monthSelection, setMonthSelection] = useState(() => ({
    month: csoGeneralMonth?.month || new Date().getMonth() + 1,
    year: csoGeneralMonth?.year || new Date().getFullYear(),
  }));

  useEffect(() => {
    if (csoGeneralMonth?.month && csoGeneralMonth?.year) {
      setMonthSelection({
        month: csoGeneralMonth.month,
        year: csoGeneralMonth.year,
      });
    }
  }, [csoGeneralMonth?.month, csoGeneralMonth?.year]);

  useEffect(() => {
    dispatch(
      fetchCsoGeneralReport({
        month: monthSelection.month,
        year: monthSelection.year,
      })
    );
  }, [dispatch, monthSelection.month, monthSelection.year]);

  useEffect(() => {
    if (!csoGeneralError) {
      return;
    }

    toast.error(csoGeneralError);
    dispatch(clearAdminLoanErrors());
  }, [csoGeneralError, dispatch]);

  const monthOptions = useMemo(
    () => ensureMonthOptions(csoGeneralMonth, csoGeneralAvailableMonths),
    [csoGeneralAvailableMonths, csoGeneralMonth]
  );

  const currentMonthLabel = useMemo(() => {
    if (!monthSelection?.month || !monthSelection?.year) {
      return "Select Month";
    }

    const date = new Date(monthSelection.year, monthSelection.month - 1, 1);
    return date.toLocaleDateString("en-GB", MONTH_LABEL_FORMAT);
  }, [monthSelection.year, monthSelection.month]);

  const generatedAtLabel = useMemo(() => {
    if (!csoGeneralGeneratedAt) {
      return null;
    }

    const generated = new Date(csoGeneralGeneratedAt);
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
  }, [csoGeneralGeneratedAt]);

  const totalsRow = useMemo(() => {
    if (!Array.isArray(csoGeneralData) || csoGeneralData.length === 0) {
      return null;
    }

    return {
      csoName: "Totals",
      portfolioWorth: csoGeneralSummary?.portfolioWorth || 0,
      balanceOfDebt: csoGeneralSummary?.balanceOfDebt || 0,
      totalRepayment: csoGeneralSummary?.totalRepayment || 0,
      totalDisbursed: csoGeneralSummary?.totalDisbursed || 0,
      totalInterest: csoGeneralSummary?.totalInterest || 0,
      totalLoans: csoGeneralSummary?.totalLoans || 0,
      totalRecovery: csoGeneralSummary?.totalRecovery || 0,
      overshootValue: csoGeneralSummary?.overshootValue || 0,
      tenBones: csoGeneralSummary?.tenBones || 0,
    };
  }, [csoGeneralData, csoGeneralSummary]);

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
      fetchCsoGeneralReport({
        month: monthSelection.month,
        year: monthSelection.year,
      })
    );
  };

  const handleViewDetails = (cso) => {
    if (!cso?.csoId) {
      return;
    }

    const search = new URLSearchParams({
      month: String(monthSelection.month),
      year: String(monthSelection.year),
    });

    navigate(`/admin/reports/cso/${cso.csoId}?${search.toString()}`, {
      state: {
        cso,
        monthSelection,
      },
    });
  };

  const renderCell = (cso, column) => {
    const value = cso?.[column.key] || 0;

    if (column.type === "currency") {
      return formatCurrency(value);
    }

    if (column.type === "number") {
      return formatNumber(value);
    }

    return value;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CSO General Report</h1>
          <p className="text-sm text-slate-500">
            Monthly portfolio worth, repayments, disbursements, and overshoot metrics per CSO.
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
                <option value="">{currentMonthLabel}</option>
              ) : (
                monthOptions.map((option) => (
                  <option key={option.key} value={option.value}>
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

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {SUMMARY_CARDS.map((card) => (
          <article
            key={card.key}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p className={`mt-1 text-lg font-semibold ${card.accent}`}>
              {card.formatter(csoGeneralSummary?.[card.key] || 0)}
            </p>
          </article>
        ))}
      </section>

      {generatedAtLabel && (
        <p className="text-xs text-slate-400">Generated at {generatedAtLabel}</p>
      )}

      {csoGeneralLoading ? (
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
                  {TABLE_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {csoGeneralData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={TABLE_COLUMNS.length + 2}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-slate-400" />
                        <p>No CSO activity recorded for the selected month.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  csoGeneralData.map((cso) => (
                    <tr key={cso.csoId} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{cso.csoName}</div>
                        {cso.branch && (
                          <div className="text-xs text-slate-400">{cso.branch}</div>
                        )}
                      </td>
                      {TABLE_COLUMNS.map((column) => (
                        <td
                          key={column.key}
                          className="px-4 py-3 text-right font-mono text-sm text-slate-700"
                        >
                          {renderCell(cso, column)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(cso)}
                          className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 hover:text-indigo-700"
                        >
                          View Details
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {totalsRow && (
                <tfoot className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Totals
                    </th>
                    {TABLE_COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        className="px-4 py-3 text-right font-semibold text-slate-800"
                      >
                        {renderCell(totalsRow, column)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-500">
                      —
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
