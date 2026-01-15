import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCsoLoanMetrics, clearAdminLoanErrors } from "../../../../redux/slices/adminLoanSlice";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Calendar, Target, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

const formatCurrency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CsoLoans() {
  const dispatch = useDispatch();
  
  const {
    csoMetrics,
    csoMetricsPagination,
    csoMetricsMonth,
    csoMetricsYear,
    csoMetricsLoading,
    csoMetricsError,
  } = useSelector((state) => state.adminLoans);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Fetch data when month/year/page changes
  useEffect(() => {
    dispatch(fetchCsoLoanMetrics({
      month: selectedMonth,
      year: selectedYear,
      page: currentPage,
      limit: itemsPerPage
    }));
  }, [dispatch, selectedMonth, selectedYear, currentPage, itemsPerPage]);

  // Handle errors
  useEffect(() => {
    if (csoMetricsError) {
      toast.error(csoMetricsError);
      dispatch(clearAdminLoanErrors());
    }
  }, [csoMetricsError, dispatch]);

  // Reset to page 1 when month/year changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Don't allow navigation beyond current month
    if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth >= currentMonth)) {
      return;
    }
    
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const canGoNext = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    return !(selectedYear > currentYear || (selectedYear === currentYear && selectedMonth >= currentMonth));
  }, [selectedMonth, selectedYear]);

  // Generate year options (last 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  // Summary calculations
  const summary = useMemo(() => {
    if (!csoMetrics || csoMetrics.length === 0) {
      return { totalLoans: 0, totalDisbursed: 0, totalPayments: 0, targetsMet: 0, total: 0 };
    }
    return csoMetrics.reduce((acc, cso) => {
      acc.totalLoans += cso.noOfLoans || 0;
      acc.totalDisbursed += cso.totalDisbursed || 0;
      acc.totalPayments += cso.paymentsThisMonth || 0;
      if (cso.targetMet) acc.targetsMet += 1;
      acc.total += 1;
      return acc;
    }, { totalLoans: 0, totalDisbursed: 0, totalPayments: 0, targetsMet: 0, total: 0 });
  }, [csoMetrics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CSO Loan Metrics</h1>
          <p className="text-sm text-slate-500">Monthly performance overview for all CSOs</p>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              {MONTHS.map((month, idx) => (
                <option key={month} value={idx + 1}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            disabled={!canGoNext}
            className={`rounded-lg border border-slate-200 p-2 ${canGoNext ? 'hover:bg-slate-50' : 'opacity-50 cursor-not-allowed'}`}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Loans</p>
              <p className="text-xl font-bold text-slate-900">{summary.totalLoans}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Disbursed</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(summary.totalDisbursed)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Repayments This Month</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(summary.totalPayments)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Target className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Targets Met</p>
              <p className="text-xl font-bold text-slate-900">{summary.targetsMet} / {summary.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {csoMetricsLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      )}

      {/* Error State */}
      {csoMetricsError && !csoMetricsLoading && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{csoMetricsError}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      {!csoMetricsLoading && !csoMetricsError && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 whitespace-nowrap">CSO Name</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">No. of Loans</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Total Disbursed</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Principal + Interest</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Actual Paid</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Loan Balance</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Admin Fee</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Loan Target</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Disbursement Target</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {csoMetrics.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-slate-500">
                      No CSO data found for {MONTHS[selectedMonth - 1]} {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  csoMetrics.map((cso) => (
                    <tr key={cso.csoId} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-slate-900">{cso.csoName || "—"}</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-600">{cso.noOfLoans}</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-600">{formatCurrency(cso.totalDisbursed)}</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-600">{formatCurrency(cso.amountToBePaid)}</td>
                      <td className="px-4 py-4 text-right font-mono text-emerald-600">{formatCurrency(cso.paymentsThisMonth)}</td>
                      <td className="px-4 py-4 text-right font-mono text-rose-600">{formatCurrency(cso.loanBalance)}</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-600">{formatCurrency(cso.loanAppForm)}</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-600">{cso.loanTarget}</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-600">{formatCurrency(cso.disbursementTarget)}</td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            cso.targetMet
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {cso.targetMet ? "Target Met" : "Target Not Met"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {csoMetricsPagination.totalPages > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value, 10));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-slate-500">per page</span>
              </div>

              <div className="text-sm text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, csoMetricsPagination.total)} of {csoMetricsPagination.total} results
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {csoMetricsPagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(csoMetricsPagination.totalPages, prev + 1))}
                  disabled={currentPage >= csoMetricsPagination.totalPages}
                  className={`rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium ${
                    currentPage >= csoMetricsPagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
