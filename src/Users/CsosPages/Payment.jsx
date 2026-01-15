import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Wallet, Pencil } from "lucide-react";

import { clearLoanError, fetchCsoLoanById, recordLoanPayment } from "../../redux/slices/loanSlice";
import { computeLoanMetrics } from "../../utils/loanMetrics";

const formatCurrency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value);
};

export default function Payment() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { detail, detailLoading, detailError, paymentSubmitting, paymentError } = useSelector((state) => state.loan);

  const loan = detail && detail._id === id ? detail : null;

  useEffect(() => {
    if (!id) {
      navigate("/cso/home", { replace: true });
      return;
    }

    if (!loan && !detailLoading) {
      dispatch(fetchCsoLoanById(id));
    }
  }, [dispatch, id, loan, detailLoading, navigate]);

  useEffect(() => {
    if (detailError) {
      toast.error(detailError);
      dispatch(clearLoanError());
    }
  }, [detailError, dispatch]);

  useEffect(() => {
    if (paymentError) {
      toast.error(paymentError);
      dispatch(clearLoanError());
    }
  }, [paymentError, dispatch]);

  const {
    amountPaidSoFar,
    outstandingDue,
    balanceRemaining,
    dailyAmount,
    businessDaysSinceDisbursement,
  } = useMemo(() => computeLoanMetrics(loan), [loan]);

  const dueAmount = useMemo(() => {
    if (typeof outstandingDue !== "number" || Number.isNaN(outstandingDue)) {
      return 0;
    }
    return Number(outstandingDue.toFixed(2));
  }, [outstandingDue]);

  const normalizedBalanceRemaining = useMemo(() => {
    if (typeof balanceRemaining !== "number" || Number.isNaN(balanceRemaining)) {
      return 0;
    }
    return Number(balanceRemaining.toFixed(2));
  }, [balanceRemaining]);

  const [selectedMode, setSelectedMode] = useState("due");
  const [amountInput, setAmountInput] = useState("");
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (selectedMode === "due") {
      setAmountInput(dueAmount > 0 ? dueAmount.toFixed(2) : "");
    }
  }, [selectedMode, dueAmount]);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    if (mode === "due") {
      setAmountInput(dueAmount > 0 ? dueAmount.toFixed(2) : "");
    } else {
      setAmountInput("");
    }
  };

  const customerName = useMemo(() => {
    const customer = loan?.customerDetails || {};
    return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer";
  }, [loan]);

  const loanRef = loan?.loanId || "—";

  const isLoading = detailLoading || (!loan && !detailError);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!loan) {
      toast.error("Loan details not available yet");
      return;
    }

    if (selectedMode === "due" && dueAmount <= 0) {
      toast.error("There is no outstanding amount due today");
      return;
    }

    const numericAmount = Number.parseFloat(amountInput);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Enter a valid payment amount greater than zero");
      return;
    }

    if (numericAmount > normalizedBalanceRemaining) {
      toast.error("Payment exceeds outstanding balance");
      return;
    }

    let paymentDate = undefined;

    if (dateInput) {
      const parsedDate = new Date(dateInput);
      if (Number.isNaN(parsedDate.getTime())) {
        toast.error("Select a valid payment date");
        return;
      }
      paymentDate = parsedDate.toISOString();
    }

    const normalizedAmount = Number(numericAmount.toFixed(2));

    try {
      await dispatch(
        recordLoanPayment({
          loanId: loan._id,
          amount: normalizedAmount,
          date: paymentDate,
        })
      ).unwrap();

      toast.success("Payment recorded successfully");
      navigate(`/cso/loans/${loan._id}`);
    } catch (error) {
      const message = typeof error === "string" ? error : "Unable to record payment";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          Loading payment details...
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-base font-semibold text-slate-700">Loan not found</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
      </div>
    );
  }

  const helperText = selectedMode === "due"
    ? "Automatically fills the amount due today based on repayment schedule."
    : "Enter a custom payment amount you collected.";

  const paymentDisabled = paymentSubmitting || amountInput.trim() === "";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          Loan ID:
          <span>{loanRef}</span>
        </span>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Record payment for {customerName}</h1>
            <p className="text-sm text-slate-500">Select one of the quick options below to capture a repayment.</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Paid</span>
            <span className="text-base font-semibold text-slate-900">{formatCurrency(amountPaidSoFar)}</span>
          </div>
        </header>

        <dl className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount due today</dt>
            <dd className="text-lg font-semibold text-slate-900">{formatCurrency(dueAmount)}</dd>
            <p className="mt-2 text-xs text-slate-500">Calculated as {formatCurrency(dailyAmount)} × {businessDaysSinceDisbursement} business day(s) minus payments.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outstanding balance</dt>
            <dd className="text-lg font-semibold text-slate-900">{formatCurrency(normalizedBalanceRemaining)}</dd>
            <p className="mt-2 text-xs text-slate-500">Total remaining amount to be collected for this loan.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Daily/weekly amount</dt>
            <dd className="text-lg font-semibold text-slate-900">{formatCurrency(dailyAmount)}</dd>
            <p className="mt-2 text-xs text-slate-500">Standard installment expected from the borrower.</p>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => handleModeSelect("due")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition shadow-sm ${
                selectedMode === "due"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              disabled={dueAmount <= 0}
            >
              <Wallet className="h-4 w-4" /> Pay amount due
            </button>

            <button
              type="button"
              onClick={() => handleModeSelect("custom")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition shadow-sm ${
                selectedMode === "custom"
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Pencil className="h-4 w-4" /> Enter other payment
            </button>
          </div>

          <p className="text-xs text-slate-500">{helperText}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="payment-amount">
              Payment amount (₦)
              <input
                id="payment-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                placeholder={selectedMode === "custom" ? "0.00" : ""}
                readOnly={selectedMode === "due"}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                  selectedMode === "due" ? "border-slate-200 bg-slate-100 text-slate-600" : "border-slate-200"
                }`}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="payment-date">
              Payment date
              <input
                id="payment-date"
                type="date"
                value={dateInput}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setDateInput(event.target.value)}
                disabled={true}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
              disabled={paymentDisabled}
            >
              {paymentSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              {paymentSubmitting ? "Submitting..." : "Submit payment"}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/cso/loans/${loan._id}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              disabled={paymentSubmitting}
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
