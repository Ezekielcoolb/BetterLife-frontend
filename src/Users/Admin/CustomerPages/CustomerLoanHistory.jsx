import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ListOrdered,
  ReceiptText,
} from "lucide-react";
import {
  fetchCustomerLoansByBvn,
  clearAdminLoanErrors,
} from "../../../redux/slices/adminLoanSlice";
import LoanCard from "../../CsosPages/LoanCard";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = "https://api.betterlifeloan.com"

const formatCurrency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "₦0.00";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (_error) {
    return value;
  }
};

export default function CustomerLoanHistory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bvn } = useParams();

  const {
    customerLoanHistory,
    customerLoanHistoryLoading,
    customerLoanHistoryError,
    customerLoanHistoryCustomer,
  } = useSelector((state) => state.adminLoans);

  const [activePaymentLoan, setActivePaymentLoan] = useState(null);
  const [loanCardData, setLoanCardData] = useState(null);
  const [loanCardLoading, setLoanCardLoading] = useState(false);

  useEffect(() => {
    if (!bvn) {
      toast.error("Customer BVN is required");
      navigate("/admin/customers", { replace: true });
      return;
    }

    dispatch(fetchCustomerLoansByBvn(bvn));
  }, [dispatch, bvn, navigate]);

  useEffect(() => {
    if (customerLoanHistoryError) {
      toast.error(customerLoanHistoryError);
      dispatch(clearAdminLoanErrors());
    }
  }, [customerLoanHistoryError, dispatch]);

  const loans = useMemo(
    () => customerLoanHistory ?? [],
    [customerLoanHistory]
  );

  const sortedLoans = useMemo(() => {
    return [...loans].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [loans]);

  const handleViewLoanCard = async (loanId) => {
    if (!loanId) {
      toast.error("Unable to locate loan identifier");
      return;
    }

    try {
      setLoanCardLoading(true);
      setLoanCardData(null);
      const response = await axios.get(`${API_BASE_URL}/api/loans/${loanId}`);
      setLoanCardData(response.data);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to load loan card";
      toast.error(message);
    } finally {
      setLoanCardLoading(false);
    }
  };

  const handleOpenPaymentModal = (loan) => {
    setActivePaymentLoan(loan);
  };

  const handleClosePaymentModal = () => {
    setActivePaymentLoan(null);
  };

  const handleCloseLoanCard = () => {
    setLoanCardData(null);
    setLoanCardLoading(false);
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/customers")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to customers
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {customerLoanHistoryCustomer?.name || "Customer"} loans
            </h1>
            <p className="text-sm text-slate-500">
              BVN:{" "}
              <span className="font-mono">
                {customerLoanHistoryCustomer?.bvn || bvn || "—"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {customerLoanHistoryLoading ? (
        <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            Loading customer loans...
          </div>
        </div>
      ) : customerLoanHistoryError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{customerLoanHistoryError}</p>
          </div>
        </div>
      ) : sortedLoans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No loans were found for this customer.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left font-semibold text-slate-700">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Amount to be paid</th>
                  <th className="px-4 py-3 text-right">Amount paid so far</th>
                  <th className="px-4 py-3 text-right">Loan balance</th>
                  <th className="px-4 py-3 text-center">Start date</th>
                  <th className="px-4 py-3 text-center">End date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Payment breakdown</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>{loan.customerName || "—"}</div>
                      <p className="text-xs text-slate-500">{loan.loanId}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {formatCurrency(loan.amountToBePaid)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">
                      {formatCurrency(loan.amountPaidSoFar)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600">
                      {formatCurrency(loan.balance)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600">
                      {formatDate(loan.startDate)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600">
                      {formatDate(loan.endDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${
                          loan.status === "fully paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : loan.status === "active loan"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {loan.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenPaymentModal(loan)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewLoanCard(loan.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                      >
                        <ReceiptText className="h-4 w-4" />
                        View loan card
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activePaymentLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-2 py-4 sm:px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Payment breakdown
                </h2>
                <p className="text-sm text-slate-500">
                  {activePaymentLoan.customerName} • {activePaymentLoan.loanId}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePaymentModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {activePaymentLoan.dailyPayment.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No payment records available for this loan.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activePaymentLoan.dailyPayment
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime()
                      )
                      .map((payment, index) => (
                        <tr key={`${payment.date}-${index}`}>
                          <td className="px-4 py-2 text-slate-700">
                            {formatDate(payment.date)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-slate-900">
                            {formatCurrency(payment.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {(loanCardLoading || loanCardData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 px-2 py-4 sm:px-4">
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={handleCloseLoanCard}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:bg-slate-100"
              aria-label="Close loan card"
            >
              ×
            </button>

            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl sm:p-4">
              {loanCardLoading && (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    Loading loan card...
                  </div>
                </div>
              )}

              {!loanCardLoading && loanCardData && (
                <div className="max-h-[80vh] overflow-y-auto px-1 sm:px-2">
                  <LoanCard loan={loanCardData} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
