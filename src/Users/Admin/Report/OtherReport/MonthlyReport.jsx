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
  History,
  TrendingDown,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  fetchMonthlySummary,
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

const getMonthName = (monthNumber) => {
  const date = new Date(2000, monthNumber - 1, 1);
  return date.toLocaleString("en-GB", { month: "long" });
};

export default function MonthlyReport() {
  const dispatch = useDispatch();
  const {
    monthlySummary,
    monthlySummaryLoading,
    monthlySummaryError,
  } = useSelector((state) => state.adminLoans);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState("full"); // "3months", "6months", "full"

  useEffect(() => {
    dispatch(fetchMonthlySummary({ year: selectedYear }));
  }, [dispatch, selectedYear]);

  useEffect(() => {
    if (monthlySummaryError) {
      toast.error(monthlySummaryError);
      dispatch(clearAdminLoanErrors());
    }
  }, [monthlySummaryError, dispatch]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push(y);
    }
    return years;
  }, []);

  const filteredData = useMemo(() => {
    if (!monthlySummary || monthlySummary.length === 0) return [];

    let data = [...monthlySummary];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Sort by month ascending
    data.sort((a, b) => a.month - b.month);

    if (viewMode === "3months") {
      if (selectedYear === currentYear) {
        data = data.filter(d => d.month <= currentMonth).slice(-3);
      } else {
        data = data.slice(-3);
      }
    } else if (viewMode === "6months") {
      if (selectedYear === currentYear) {
        data = data.filter(d => d.month <= currentMonth).slice(-6);
      } else {
        data = data.slice(-6);
      }
    } else if (viewMode === "full") {
      if (selectedYear === currentYear) {
        data = data.filter(d => d.month <= currentMonth);
      }
    }

    return data;
  }, [monthlySummary, viewMode, selectedYear]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monthly Business Report</h1>
          <p className="text-sm text-slate-500">
            Monthly business performance summary and financial status.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
            <button
              onClick={() => setViewMode("3months")}
              className={`px-4 py-2 text-sm font-medium transition ${
                viewMode === "3months" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              3 Months
            </button>
            <button
              onClick={() => setViewMode("6months")}
              className={`border-x border-slate-200 px-4 py-2 text-sm font-medium transition ${
                viewMode === "6months" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setViewMode("full")}
              className={`px-4 py-2 text-sm font-medium transition ${
                viewMode === "full" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Full Year
            </button>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-auto"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </header>

      {monthlySummaryLoading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-20 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">Generating monthly report...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white p-20 text-center shadow-sm">
          <AlertCircle className="h-10 w-10 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">No Data Available</h3>
          <p className="max-w-xs text-sm text-slate-500">
            We couldn't find any financial records for the selected period.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="min-w-[1600px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-[2px_0_5px_rgba(0,0,0,0.05)] whitespace-nowrap">
                    Month
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Loans
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Disbursed
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Repayment
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Interest
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Card & Others
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Expenses
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Profit
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Balance of Debt
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Total Recovery
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Cash at Hand
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 border-l border-slate-100 whitespace-nowrap">
                    Loan Balance
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-indigo-600 border-l border-slate-100 whitespace-nowrap">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredData.map((row) => (
                  <tr key={`${row.year}-${row.month}`} className="transition hover:bg-slate-50/80">
                    <td className="sticky left-0 bg-white px-6 py-4 text-sm font-semibold text-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-slate-50">
                      {getMonthName(row.month)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-slate-700">
                       {formatNumber(row.loanCount)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {formatCurrency(row.amountDisbursed)}
                    </td>
                    <td className="px-4 py-4 text-right text-emerald-600 font-medium">
                      {formatCurrency(row.totalRepayment)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {formatCurrency(row.totalInterest)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {formatCurrency(row.totalLoanAppForm)}
                    </td>
                    <td className="px-4 py-4 text-right text-rose-500">
                      {formatCurrency(row.totalExpenses)}
                    </td>
                    <td className={`px-4 py-4 text-right font-semibold ${row.totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatCurrency(row.totalProfit)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {formatCurrency(row.totalOverdue)}
                    </td>
                    <td className="px-4 py-4 text-right text-emerald-600">
                      {formatCurrency(row.totalRecovery)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {formatCurrency(row.lastCashAtHand)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700 border-l border-slate-100 bg-slate-50/30">
                      {formatCurrency(row.loanBalance)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600 border-l border-slate-100 bg-indigo-50/20">
                      {formatCurrency(row.growth)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <tr>
                    <td className="sticky left-0 bg-slate-50 px-6 py-4 text-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">TOTAL</td>
                    <td className="px-4 py-4 text-right text-slate-900">{formatNumber(filteredData.reduce((acc, curr) => acc + curr.loanCount, 0))}</td>
                    <td className="px-4 py-4 text-right text-slate-900">{formatCurrency(filteredData.reduce((acc, curr) => acc + curr.amountDisbursed, 0))}</td>
                    <td className="px-4 py-4 text-right text-emerald-600">{formatCurrency(filteredData.reduce((acc, curr) => acc + curr.totalRepayment, 0))}</td>
                    <td className="px-4 py-4 text-right text-slate-900">{formatCurrency(filteredData.reduce((acc, curr) => acc + curr.totalInterest, 0))}</td>
                    <td className="px-4 py-4 text-right text-slate-900">{formatCurrency(filteredData.reduce((acc, curr) => acc + curr.totalLoanAppForm, 0))}</td>
                    <td className="px-4 py-4 text-right text-rose-500">{formatCurrency(filteredData.reduce((acc, curr) => acc + curr.totalExpenses, 0))}</td>
                    <td className="px-4 py-4 text-right text-emerald-600">{formatCurrency(filteredData.reduce((acc, curr) => acc + curr.totalProfit, 0))}</td>
                    <td className="px-4 py-4 text-right text-slate-600">-</td>
                    <td className="px-4 py-4 text-right text-emerald-600">{formatCurrency(filteredData.reduce((acc, curr) => acc + curr.totalRecovery, 0))}</td>
                    <td className="px-4 py-4 text-right text-slate-600">-</td>
                    <td className="px-4 py-4 text-right text-slate-600 border-l border-slate-100">-</td>
                    <td className="px-6 py-4 text-right text-indigo-600 border-l border-slate-100">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
