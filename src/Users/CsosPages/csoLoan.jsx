import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  Search, Filter, Calendar, ChevronRight, AlertCircle, 
  CheckCircle2, Clock, XCircle, Banknote, Eye, Loader2 
} from "lucide-react";
import toast from "react-hot-toast";
import { 
  fetchCsoLoans, recordLoanPayment, clearLoanError, 
  fetchCsoOutstandingLoans, fetchCsoLoanCounts 
} from "../../redux/slices/loanSlice";
import { fetchHolidays } from "../../redux/slices/holidaySlice";
import { computeLoanMetrics } from "../../utils/loanMetrics";

const formatCurrency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDaysOverdue = (startDate) => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
};

export default function CsoLoan() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { 
    loans, loading, error, paymentSubmitting,
    loansPagination,
    outstandingLoans, totalOutstanding: totalOutstandingFromState, outstandingLoading,
    categoryCounts, currentCategoryTotalBalance 
  } = useSelector((state) => state.loan);
  const { items: holidays } = useSelector((state) => state.holiday);
  
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (activeTab !== "defaults") {
      dispatch(fetchCsoLoans({ category: activeTab, page: currentPage }));
    } else {
      dispatch(fetchCsoOutstandingLoans());
    }
    dispatch(fetchHolidays());
    dispatch(fetchCsoLoanCounts());
  }, [dispatch, activeTab, currentPage]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearLoanError());
    }
  }, [error, dispatch]);

  const loansWithMetrics = useMemo(() => {
    return (loans || []).map(loan => ({
      ...loan,
      metrics: computeLoanMetrics(loan, holidays)
    }));
  }, [loans, holidays]);

  const filteredLoans = useMemo(() => {
    // defaults tab uses outstandingLoans
    if (activeTab === "defaults") {
      let result = outstandingLoans;
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        result = result.filter(loan => 
          loan.customerDetails?.firstName?.toLowerCase().includes(lowerSearch) ||
          loan.customerDetails?.lastName?.toLowerCase().includes(lowerSearch) ||
          loan.loanId?.toLowerCase().includes(lowerSearch)
        );
      }
      return result;
    }

    // other tabs use server-filtered loans
    return loansWithMetrics;
  }, [loansWithMetrics, activeTab, searchTerm, outstandingLoans]);

  const totalDefaults = useMemo(() => {
    if (activeTab === "defaults") return totalOutstandingFromState;
    return 0;
  }, [activeTab, totalOutstandingFromState]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoanForPayment || !paymentAmount) return;

    try {
      await dispatch(recordLoanPayment({
        loanId: selectedLoanForPayment._id,
        amount: Number(paymentAmount),
        date: paymentDate
      })).unwrap();
      
      toast.success("Payment recorded successfully");
      dispatch(fetchCsoLoanCounts());
      setSelectedLoanForPayment(null);
      setPaymentAmount("");
    } catch (err) {
      // Error handled by useEffect
    }
  };

  const tabs = [
    { id: "all", label: `All Submitted (${categoryCounts.all})` },
    { id: "active", label: `Active Loans (${categoryCounts.active})` },
    { id: "defaults", label: `Defaults (${categoryCounts.defaults})` },
    { id: "overdue", label: `Overdue (${categoryCounts.overdue})` },
    { id: "recovery", label: `Recovery (${categoryCounts.recovery})` },
    { id: "paid", label: `Fully Paid (${categoryCounts.paid})` },
    { id: "pending", label: `Pending Approval (${categoryCounts.pending})` },
    { id: "rejected", label: `Rejected (${categoryCounts.rejected})` },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loan Management</h1>
          <p className="text-sm text-slate-500">Track and manage all your customer loans</p>
        </div>
        {/* <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none sm:w-64"
          />
        </div> */}
      </header>

      <div className="grid grid-cols-2 gap-3 py-6 sm:flex sm:flex-wrap sm:gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1); // reset page on tab change
              }}
              className={`flex h-16 items-center justify-center px-4 rounded-2xl text-[10px] sm:text-xs font-bold transition-all duration-200 uppercase tracking-wider text-center ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2"
                  : "bg-white text-slate-500 border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 shadow-sm"
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {/* Summary for Defaults, Overdue, Recovery */}
      {(activeTab === "defaults" || activeTab === "overdue" || activeTab === "recovery") && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-rose-100 p-3">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  {activeTab === "defaults" ? "Total Defaults" : activeTab === "overdue" ? "Total Overdue" : "Total Recovery"}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(activeTab === "defaults" ? totalDefaults : currentCategoryTotalBalance)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-slate-100 p-3">
                <Clock className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  {activeTab === "defaults" ? "Defaulting Loans" : activeTab === "overdue" ? "Overdue Loans" : "Recovery Loans"}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {activeTab === "defaults" ? filteredLoans.length : (loansPagination.total || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 whitespace-nowrap">S/N</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 whitespace-nowrap">Customer</th>
                {activeTab === "all" && (
                    <>
                        <th className="px-6 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Requested</th>
                        <th className="px-6 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Approved</th>
                        <th className="px-6 py-3 text-center font-semibold text-slate-900 whitespace-nowrap">Status</th>
                    </>
                )}
                {(activeTab === "active" || activeTab === "defaults" || activeTab === "overdue" || activeTab === "recovery" || activeTab === "paid") && (
                    <>
                        <th className="px-6 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Principal + Interest</th>
                        <th className="px-6 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Total Paid</th>
                        {activeTab === "defaults" && (
                          <th className="px-6 py-3 text-right font-semibold text-rose-600 whitespace-nowrap">Defaults</th>
                        )}
                        <th className="px-6 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Balance</th>
                        {/* <th className="px-6 py-3 text-left font-semibold text-slate-900 whitespace-nowrap">Duration</th> */}
                        <th className="px-6 py-3 text-center font-semibold text-slate-900 whitespace-nowrap">Status</th>
                    </>
                )}
                {activeTab === "pending" && (
                    <>
                        <th className="px-6 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Requested</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 whitespace-nowrap">Date Submitted</th>
                    </>
                )}
                {activeTab === "rejected" && (
                    <>
                        <th className="px-6 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Requested</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 whitespace-nowrap">Reason</th>
                    </>
                )}
                <th className="px-6 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {(loading || (activeTab === "defaults" && outstandingLoading)) ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                    <p className="mt-2">Loading loans...</p>
                  </td>
                </tr>
              ) : filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-500">
                    No loans found in this category.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan, index) => (
                  <tr key={loan._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {loan.customerDetails?.firstName} {loan.customerDetails?.lastName}
                      </div>
                      <div className="text-xs text-slate-500">{loan.loanId}</div>
                    </td>

                    {activeTab === "all" && (
                        <>
                            <td className="px-6 py-4 text-right font-mono text-slate-600">
                                {formatCurrency(loan.loanDetails?.amountRequested)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-emerald-600">
                                {formatCurrency(loan.loanDetails?.amountToBePaid)}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize
                                    ${loan.status === 'active loan' ? 'bg-emerald-100 text-emerald-800' : 
                                      loan.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 
                                      loan.status === 'fully paid' ? 'bg-blue-100 text-blue-800' :
                                      'bg-amber-100 text-amber-800'}`}>
                                    {loan.status}
                                </span>
                            </td>
                        </>
                    )}

                    {(activeTab === "active" || activeTab === "defaults" || activeTab === "overdue" || activeTab === "recovery" || activeTab === "paid") && (
                        <>
                            <td className="px-6 py-4 text-right font-mono text-slate-900">
                                {formatCurrency(loan.loanDetails?.amountToBePaid)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-emerald-600">
                                {formatCurrency(loan.loanDetails?.amountPaidSoFar || 0)}
                            </td>
                            {activeTab === "defaults" && (
                              <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                                {formatCurrency(loan.metrics?.outstandingDue)}
                              </td>
                            )}
                            <td className="px-6 py-4 text-right font-mono text-rose-600">
                                {formatCurrency((loan.loanDetails?.amountToBePaid || 0) - (loan.loanDetails?.amountPaidSoFar || 0))}
                            </td>
                            {/* <td className="px-6 py-4 text-xs text-slate-500">
                                <div>Start: {formatDate(loan.loanDetails?.startDate)}</div>
                                <div>End: {formatDate(loan.loanDetails?.endDate)}</div>
                            </td> */}
                            <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize 
                                    ${loan.status === 'fully paid' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {loan.status}
                                </span>
                            </td>
                        </>
                    )}

                    {activeTab === "pending" && (
                        <>
                            <td className="px-6 py-4 text-right font-mono text-slate-600">
                                {formatCurrency(loan.loanDetails?.amountRequested)}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                                {formatDate(loan.createdAt)}
                            </td>
                        </>
                    )}

                    {activeTab === "rejected" && (
                        <>
                            <td className="px-6 py-4 text-right font-mono text-slate-600">
                                {formatCurrency(loan.loanDetails?.amountRequested)}
                            </td>
                            <td className="px-6 py-4 text-rose-600 text-xs max-w-xs truncate">
                                {loan.rejectionReason || "No reason provided"}
                            </td>
                        </>
                    )}

                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            {(activeTab === "defaults" || activeTab === "overdue" || activeTab === "recovery") && (
                                <button
                                    onClick={() => setSelectedLoanForPayment(loan)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                                >
                                    <Banknote className="h-3.5 w-3.5" /> Pay
                                </button>
                            )}
                            <button
                                onClick={() => navigate(`/cso/loans/${loan._id}`)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                                <Eye className="h-3.5 w-3.5" /> Details
                            </button>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {activeTab !== "defaults" && loansPagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-900">{(loansPagination.page - 1) * 16 + 1}</span> to{" "}
            <span className="font-medium text-slate-900">
              {Math.min(loansPagination.page * 16, loansPagination.total)}
            </span>{" "}
            of <span className="font-medium text-slate-900">{loansPagination.total}</span> loans
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={loansPagination.page === 1}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, loansPagination.totalPages))}
              disabled={loansPagination.page === loansPagination.totalPages}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedLoanForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
              <button 
                onClick={() => setSelectedLoanForPayment(null)}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <XCircle className="h-6 w-6 text-slate-400" />
              </button>
            </div>

            <div className="mb-6 rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Customer</div>
                <div className="font-semibold text-slate-900">
                    {selectedLoanForPayment.customerDetails?.firstName} {selectedLoanForPayment.customerDetails?.lastName}
                </div>
                <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">Balance Due:</span>
                    <span className="font-mono font-medium text-rose-600">
                        {formatCurrency((selectedLoanForPayment.loanDetails?.amountToBePaid || 0) - (selectedLoanForPayment.loanDetails?.amountPaidSoFar || 0))}
                    </span>
                </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={paymentSubmitting}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {paymentSubmitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Confirm Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}