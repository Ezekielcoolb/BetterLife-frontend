import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, CalendarDays, CreditCard, FileText, ListChecks, Loader2, Receipt, UploadCloud, Wallet, X } from "lucide-react";
import { fetchCsoLoanById, resetLoanDetail, clearLoanError, syncLoanRepaymentSchedule } from "../../redux/slices/loanSlice";
import { computeLoanMetrics } from "../../utils/loanMetrics";
import LoanCard from "./LoanCard";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = "https://api.betterlifeloan.com"

const formatCurrency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(value);
};

const formatDateWithTime = (value) => {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return value;
  }
};

const resolveAssetUrl = (url) => {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

export default function LoanActiveDetails() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { detail, detailLoading, detailError, scheduleSyncing, scheduleSyncError } = useSelector((state) => state.loan);

  const [mediaPreview, setMediaPreview] = useState(false);
  const [showLoanCard, setShowLoanCard] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/cso/home", { replace: true });
      return () => {};
    }

    dispatch(fetchCsoLoanById(id));

    return () => {
      dispatch(resetLoanDetail());
    };
  }, [dispatch, id, navigate]);

  useEffect(() => {
    if (detailError) {
      toast.error(detailError);
      dispatch(clearLoanError());
    }
  }, [detailError, dispatch]);

  useEffect(() => {
    if (scheduleSyncError) {
      toast.error(scheduleSyncError);
      dispatch(clearLoanError());
    }
  }, [scheduleSyncError, dispatch]);

  const loan = detail;

  const {
    disbursedAt,
    projectedEndDate,
    amountDisbursed,
    amountToBePaid,
    amountPaidSoFar,
    dailyAmount,
    businessDaysSinceDisbursement,
    outstandingDue,
    balanceRemaining,
  } = useMemo(() => computeLoanMetrics(loan), [loan]);

  const defaultsCount = useMemo(() => {
    if (!Array.isArray(loan?.repaymentSchedule)) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return loan.repaymentSchedule
      .slice(1)
      .filter((entry) => {
        if (!entry?.date || entry?.status !== "pending") {
          return false;
        }

        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate <= today;
      })
      .length;
  }, [loan?.repaymentSchedule]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewCustomerLoans = () => {
    const bvn = loan?.customerDetails?.bvn;

    if (!bvn) {
      toast.error("Customer BVN unavailable");
      return;
    }

    navigate(`/cso/customers/${bvn}/loans`);
  };

  const customerName = useMemo(() => {
    const customer = loan?.customerDetails || {};
    return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer";
  }, [loan]);

  const businessName = loan?.businessDetails?.businessName;
  const loanType = loan?.loanDetails?.loanType;
  const customerPhoto = resolveAssetUrl(loan?.pictures?.customer);
  const businessPhoto = resolveAssetUrl(loan?.pictures?.business);
  const disbursementPictureRaw = loan?.loanDetails?.disbursementPicture;

  const handleLoanCardOpen = async () => {
    if (!loan?._id) {
      toast.error("Loan details unavailable");
      return;
    }

    try {
      await dispatch(syncLoanRepaymentSchedule(loan._id)).unwrap();
      setShowLoanCard(true);
    } catch (error) {
      const message = typeof error === "string" ? error : "Unable to load loan card";
      toast.error(message);
    }
  };

  const handleLoanCardClose = () => {
    setShowLoanCard(false);
  };

  if (detailLoading || !loan) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          Loading loan details...
        </div>
      </div>
    );
  }

  const infoChips = [
    { label: "Loan type", value: loanType ? loanType.toUpperCase() : "—" },
    { label: "Amount disbursed", value: formatCurrency(amountDisbursed) },
    { label: "Principal + Interest", value: formatCurrency(amountToBePaid) },
    { label: "Defaults", value: defaultsCount.toLocaleString("en-NG") },
  ];

  const performanceMetrics = [
    {
      title: "Total paid",
      value: formatCurrency(amountPaidSoFar),
      icon: <Wallet className="h-5 w-5 text-emerald-500" />,
    },
    {
      title: "Outstanding balance",
      value: formatCurrency(balanceRemaining),
      icon: <CreditCard className="h-5 w-5 text-amber-500" />,
    },
    {
      title: "Amount due today",
      value: formatCurrency(outstandingDue),
      icon: <Receipt className="h-5 w-5 text-indigo-500" />,
      helper: `Calculated as ${formatCurrency(dailyAmount)} × ${businessDaysSinceDisbursement} business day(s) minus payments`,
    },
  ];

  const timeline = [
    {
      title: "Loan Start Date",
      value: formatDateWithTime(disbursedAt),
      icon: <CalendarDays className="h-5 w-5 text-emerald-500" />,
    },
    {
      title: "Loan End Date",
      value: projectedEndDate ? formatDateWithTime(projectedEndDate) : "—",
      icon: <CalendarDays className="h-5 w-5 text-indigo-500" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          Status:
          <span className="capitalize">{loan.status}</span>
        </span>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {customerPhoto ? (
                <img src={customerPhoto} alt={customerName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
                  {customerName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{customerName}</h1>
              <p className="text-sm text-slate-500">{businessName || "Business name unavailable"}</p>
              {(businessPhoto || loan?.customerDetails?.nin) && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {businessPhoto && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      onClick={() => setMediaPreview({ url: businessPhoto, title: businessName || "Business photo" })}
                    >
                      <UploadCloud className="h-4 w-4" /> View business photo
                    </button>
                  )}
                  {loan?.customerDetails?.bvn && (
                    <button
                      type="button"
                      onClick={handleViewCustomerLoans}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
                    >
                      <ListChecks className="h-4 w-4" /> Customer loans
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <dl className="flex flex-1 flex-wrap gap-3">
            {infoChips.map(({ label, value }) => (
              <div key={label} className="flex min-w-[160px] flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="text-sm font-semibold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {performanceMetrics.map(({ title, value, icon, helper }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">{icon}</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
                <p className="text-lg font-semibold text-slate-900">{value}</p>
              </div>
            </div>
            {helper && <p className="mt-3 text-xs text-slate-500">{helper}</p>}
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {timeline.map(({ title, value, icon }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">{icon}</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
                <p className="text-sm font-semibold text-slate-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
          <p className="text-sm text-slate-500">Use these quick options to manage the loan.</p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/cso/loans/${loan._id}/payment`)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Wallet className="h-4 w-4" /> Add payment
          </button>
          <button
            type="button"
            onClick={handleLoanCardOpen}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={scheduleSyncing}
          >
            {scheduleSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Loan card
          </button>
          <button
            type="button"
            onClick={() => {
              setMediaPreview(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <UploadCloud className="h-4 w-4" /> Disbursement proof
          </button>
        </div>
      </section>

      {mediaPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setMediaPreview(false)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200">
              <img
                src={`https://api.betterlifeloan.com${disbursementPictureRaw}`}
                alt="Preview"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {showLoanCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 px-4">
          <div className="relative w-full max-w-5xl rounded-3xl bg-slate-900 shadow-2xl">
            <button
              type="button"
              onClick={handleLoanCardClose}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="max-h-[80vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
              <LoanCard loan={loan} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
