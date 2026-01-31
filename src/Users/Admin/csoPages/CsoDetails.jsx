
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  fetchCsoById,
  updateCso,
  changeCsoStatus,
  clearCsoError,
  resolveCsoRemittance,
  fetchAdminCsoWallet,
  approveCsoWalletWithdrawal,
} from "../../../redux/slices/csoSlice";
import { fetchBranches } from "../../../redux/slices/branchSlice";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  Loader2,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Wallet,
  Coins,
  PiggyBank,
  HandCoins,
  ShieldCheck,
  TrendingUp,
  Zap,
  Lock,
} from "lucide-react";
import CsoLoansTab from "./CsoLoansTab";
import CsoCustomersTab from "./CsoCustomersTab";
import CsoCollectionTab from "./CsoCollectionTab";
import CsoDashboardTab from "./CsoDashboardTab";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const editableFields = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "branch",
  "branchId",
  "address",
  "workId",
  "guaratorName",
  "guaratorAddress",
  "guaratorPhone",
  "guaratorEmail",
  "dateOfBirth",
  "city",
  "state",
  "zipCode",
  "country",
  "defaultingTarget",
  "loanTarget",
  "disbursementTarget",
];

const formatCurrency = (value) => {
    if (typeof value !== "number" && typeof value !== "string") return "₦0.00";
    const num = Number(value);
    if (Number.isNaN(num)) return "₦0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(num);
};

const OUTLINE_CLASSES = {
  indigo: "border-indigo-500/40 bg-indigo-50 text-indigo-600",
  emerald: "border-emerald-500/40 bg-emerald-50 text-emerald-600",
  rose: "border-rose-500/40 bg-rose-50 text-rose-600",
  amber: "border-amber-500/40 bg-amber-50 text-amber-600",
  violet: "border-violet-500/40 bg-violet-50 text-violet-600",
  slate: "border-slate-200 bg-slate-100 text-slate-600",
  white: "border-white/30 bg-white/20 text-white",
};

const OutlinePill = ({ tone = "slate", children }) => {
  const toneClass = OUTLINE_CLASSES[tone] || OUTLINE_CLASSES.slate;
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {children}
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value, hint, accent = "bg-indigo-500" }) => (
  <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className={`absolute inset-x-6 top-0 h-20 rounded-full ${accent} opacity-10 blur-3xl`} />
    <div className="relative space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  </div>
);

const WalletActivityItem = ({ loan }) => (
  <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
      <span>{loan.loanId || "Loan"}</span>
      <OutlinePill tone="rose">{formatCurrency(loan.balance)}</OutlinePill>
    </div>
    <p className="text-sm text-slate-500">{loan.customerName || "Customer"}</p>
    <div className="flex items-center justify-between text-xs text-slate-400">
      <span>
        Disbursed: {loan.disbursedAt ? new Date(loan.disbursedAt).toLocaleDateString() : "—"}
      </span>
      <span className="font-semibold text-rose-500">{loan.daysPast} days past recovery</span>
    </div>
  </div>
);

export default function CsoDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    selected,
    detailLoading,
    saving,
    resolvingRemittance,
    error,
    adminWallet,
  } = useSelector((state) => state.cso);
  const { items: branches } = useSelector((state) => state.branch);

  const selectedId = selected?._id;

  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Remittance State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveData, setResolveData] = useState({ date: "", message: "" });
  const [imageModal, setImageModal] = useState(null);
  const walletLoading = adminWallet.loading;
  const walletSubmitting = adminWallet.submitting;
  const walletError = adminWallet.error;
  const walletSummary = adminWallet.summary;
  const walletCso = adminWallet.cso;
  const lastWithdrawal = adminWallet.lastWithdrawal;
  const walletBonusBreakdown = adminWallet.bonusBreakdown;
  const lastWithdrawalBreakdown = adminWallet.lastWithdrawalBreakdown;

  const performance = walletSummary?.performance || {};
  const operational = walletSummary?.operational || {};
  const deductionLoans = performance.deductionLoans || [];
  const historyLabels = performance.history?.labels || [];
  const historyEarned = performance.history?.earned || [];
  const historyDeductions = performance.history?.deductions || [];
  const hasHistory =
    historyLabels.length > 0 &&
    historyEarned.length === historyLabels.length &&
    historyDeductions.length === historyLabels.length;

  const chartData = useMemo(() => {
    if (!hasHistory) return null;

    return {
      labels: historyLabels,
      datasets: [
        {
          label: "Earned Bonus",
          data: historyEarned.map((value) => value ?? 0),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "#2563eb",
        },
        {
          label: "Recovery",
          data: historyLabels.map((_, index) => -Math.abs(historyDeductions[index] ?? 0)),
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.15)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "#f97316",
        },
      ],
    };
  }, [hasHistory, historyLabels, historyEarned, historyDeductions]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: {
              family: "'Poppins', 'Inter', sans-serif",
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Math.abs(context.parsed.y || 0);
              const label = context.dataset.label || "";
              return `${label}: ${formatCurrency(value)}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => formatCurrency(Math.abs(value || 0)),
          },
          grid: {
            color: "rgba(148, 163, 184, 0.15)",
          },
        },
        x: {
          ticks: {
            font: {
              family: "'Poppins', 'Inter', sans-serif",
            },
          },
          grid: {
            display: false,
          },
        },
      },
    }),
    [],
  );

  const walletSummaryReady = Boolean(walletSummary);
  const csoName = walletCso
    ? `${walletCso.firstName || ""} ${walletCso.lastName || ""}`.trim()
    : `${selected?.firstName || ""} ${selected?.lastName || ""}`.trim();
  const branchLabel = walletCso?.branch || selected?.branch || "";
  const asOfDate = performance.asOf
    ? new Date(performance.asOf).toLocaleDateString()
    : null;

  const totalBonus = Number(performance.totalBonus) || 0;
  const basePerformanceBonus = Number(
    performance.basePerformanceBonus ?? walletBonusBreakdown?.basePerformanceBonus ?? 0,
  );
  const overshootBonusAggregate = Number(
    performance.overshootBonus ?? walletBonusBreakdown?.overshootBonus ?? 0,
  );
  const deductionTotal = Number(performance.deductionTotal) || 0;
  
  // Robust Recalculation
  const remainingBonus = Math.max(totalBonus - deductionTotal, 0);
  const withdrawable = Number((remainingBonus * 0.7).toFixed(2));
  const lockedPortion = Math.max(remainingBonus - withdrawable, 0);

  const deductionCount = Number(performance.deductionLoanCount) || deductionLoans.length || 0;
  const readyToTransfer = Math.max(remainingBonus - deductionTotal, 0); // Note: This might need adjustment based on business rules but keeping standard
  const heldForRecoveries = Math.max(remainingBonus - withdrawable, 0);
  const operationalBalance = Number(operational.balance) || 0;

  const lastWithdrawalLabel = typeof lastWithdrawal === "number" && lastWithdrawal > 0
    ? formatCurrency(lastWithdrawal)
    : null;
  const lastWithdrawalPerformance = Number(lastWithdrawalBreakdown?.performance || 0);
  const lastWithdrawalOvershoot = Number(lastWithdrawalBreakdown?.overshoot || 0);

  const walletOverlay = walletLoading
    ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-4xl bg-white/70 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )
    : null;

  const isDecemberWindow = new Date().getMonth() === 11;
  const withdrawDisabled = walletSubmitting || walletLoading || withdrawable <= 0.01 || !isDecemberWindow;

  const performanceCards = [
    {
      label: "Total Bonus Pool",
      value: formatCurrency(totalBonus),
      icon: Sparkles,
      accent: "bg-indigo-500",
      hint: "Combined performance and overshoot bonuses accrued so far.",
    },
    {
      label: "Performance Bonus",
      value: formatCurrency(basePerformanceBonus),
      icon: TrendingUp,
      accent: "bg-emerald-600",
      hint: "Performance Bonus is guaranteed by your repayment efficiency.",
    },
    {
      label: "Overshoot Bonus (1%)",
      value: formatCurrency(overshootBonusAggregate),
      icon: Zap,
      accent: "bg-rose-600",
      hint: overshootBonusAggregate > 0
        ? "Residual 1% pool after prior overshoot payouts."
        : "Disburse beyond 100 loans monthly to grow this bucket.",
    },
    {
      label: "Recovery Deductions",
      value: formatCurrency(deductionTotal),
      icon: ShieldAlert,
      accent: "bg-amber-600",
      hint: "Outstanding balances on loans 45+ days past disbursement.",
    },
    {
      label: "Remaining Bonus",
      value: formatCurrency(remainingBonus),
      icon: Coins,
      accent: "bg-sky-500",
      hint: "Bonus pool available after recovery deductions.",
    },
    {
      label: "Available to Withdraw",
      value: formatCurrency(withdrawable),
      icon: Wallet,
      accent: "bg-emerald-500",
      hint: "Exactly 70% of the remaining bonus, releasable on approval.",
    },
    {
      label: "Held for Future",
      value: formatCurrency(lockedPortion),
      icon: Lock,
      accent: "bg-slate-500",
      hint: "Portion (30%) retained until recoveries clear or next payout window.",
    },
  ];

  const topPerformanceCards = performanceCards.slice(0, 4);
  const bottomPerformanceCards = performanceCards.slice(4);

  const operationalCards = [
    // {
    //   label: "Operational Balance",
    //   value: formatCurrency(operationalBalance),
    //   icon: PiggyBank,
    //   accent: "bg-indigo-500",
    //   hint: "Funds already sitting in the operational wallet.",
    // },
    {
      label: "Annual Release (70%)",
      value: formatCurrency(withdrawable),
      icon: HandCoins,
      accent: "bg-emerald-500",
      hint: "Amount queued to move from performance once approved.",
    },
    {
      label: "Held for Recoveries",
      value: formatCurrency(heldForRecoveries),
      icon: ShieldCheck,
      accent: "bg-rose-500",
      hint: "Bonus still restricted due to recovery accounts.",
    },
    {
      label: "Transfer-ready Bonus",
      value: formatCurrency(readyToTransfer),
      icon: HandCoins,
      accent: "bg-violet-500",
      hint: "Portion that could move to operations once deductions clear.",
    },
  ];

  useEffect(() => {
    dispatch(fetchCsoById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (branches.length === 0) {
      dispatch(fetchBranches());
    }
  }, [branches.length, dispatch]);

  useEffect(() => {
    if (activeTab === "wallet" && selectedId) {
      dispatch(fetchAdminCsoWallet({ csoId: selectedId }));
    }
  }, [activeTab, selectedId, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCsoError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (selected) {
      const initialData = editableFields.reduce((acc, key) => {
        if (selected[key] !== undefined && selected[key] !== null) {
          if (key === "dateOfBirth" && selected[key]) {
            acc[key] = selected[key].slice(0, 10);
          } else {
            acc[key] = selected[key];
          }
        } else if (key === "dateOfBirth") {
          acc[key] = "";
        } else {
          acc[key] = "";
        }
        return acc;
      }, {});
      setFormData(initialData);
    }
  }, [selected]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    
    if (name === "branch") {
      const selectedBranch = branches.find(b => b.name === value);
      setFormData((prev) => ({ 
        ...prev, 
        branch: value,
        branchId: selectedBranch ? selectedBranch._id : ""
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData) return;

    const payload = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value === "" || value === null) {
        acc[key] = "";
        return acc;
      }

      if (["defaultingTarget", "loanTarget", "disbursementTarget"].includes(key)) {
        const numericValue = Number(value);
        acc[key] = Number.isNaN(numericValue) ? 0 : numericValue;
        return acc;
      }

      if (key === "dateOfBirth") {
        acc[key] = value ? new Date(value) : null;
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {});

    try {
      await dispatch(updateCso({ id, data: payload })).unwrap();
      toast.success("CSO updated successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update CSO");
    }
  };

  const handleToggleStatus = async () => {
    if (!selected) return;
    const action = selected.isActive ? "deactivate" : "activate";
    const confirmed = window.confirm(`Are you sure you want to ${action} this CSO?`);
    if (!confirmed) return;

    try {
      await dispatch(changeCsoStatus({ id: selected._id, isActive: !selected.isActive })).unwrap();
      toast.success(`CSO ${selected.isActive ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update CSO status");
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch (error_) {
      return "—";
    }
  };

  // Remittance Logic
  const handleMonthChange = (direction) => {
    setCurrentMonth(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + direction);
        return newDate;
    });
  };



  const monthRemittances = useMemo(() => {
      if (!selected || !selected.remittance) return [];
      
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Filter existing remittances for the selected month
      return selected.remittance.filter(r => {
          const rDate = new Date(r.date);
          return rDate.getFullYear() === year && rDate.getMonth() === month;
      }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Show newest first
  }, [selected, currentMonth]);

  const handleResolveSubmit = async (e) => {
      e.preventDefault();
      try {
          await dispatch(resolveCsoRemittance({
              id: selected._id,
              date: resolveData.date,
              resolvedIssue: resolveData.message
          })).unwrap();
          
          toast.success("Issue resolved successfully");
          setResolveModalOpen(false);
          setResolveData({ date: "", message: "" });
          dispatch(fetchCsoById(id)); // Refresh data
      } catch (err) {
          toast.error("Failed to resolve issue");
      }
  };

  const openResolveModal = (date = "") => {
      setResolveData({ date, message: "" });
      setResolveModalOpen(true);
  };

  const handleRefreshWallet = () => {
    if (!selectedId) return;
    dispatch(fetchAdminCsoWallet({ csoId: selectedId }));
  };

  const handleApproveWalletWithdrawal = async () => {
    if (!selectedId || walletSubmitting || !isDecemberWindow) {
      if (!isDecemberWindow) {
        toast.info("Withdrawals can only be approved during December.");
      }
      return;
    }

    try {
      const result = await dispatch(
        approveCsoWalletWithdrawal({ csoId: selectedId })
      ).unwrap();

      const amount = Number(result?.amount) || 0;
      if (amount > 0) {
        toast.success(`Approved withdrawal of ${formatCurrency(amount)} for ${selected?.firstName || "the CSO"}.`);
      } else {
        toast.success("Withdrawal processed successfully.");
      }

      handleRefreshWallet();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to approve withdrawal");
    }
  };

  if (detailLoading || !selected || !formData) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading CSO details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Resolve Modal */}
      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Resolve Remittance Issue</h3>
                    <button onClick={() => setResolveModalOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
                </div>
                <p className="mb-4 text-sm text-slate-600">
                    Resolving the issue for <strong>{resolveData.date}</strong>. This will clear any blocking alerts for the CSO.
                </p>
                <form onSubmit={handleResolveSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Date to Resolve</label>
                        <input
                            type="date"
                            required
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                            value={resolveData.date}
                            onChange={(e) => setResolveData({...resolveData, date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Resolution Note</label>
                        <textarea
                            required
                            rows="3"
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="e.g., Cash collected manually, System error verified..."
                            value={resolveData.message}
                            onChange={(e) => setResolveData({...resolveData, message: e.target.value})}
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        disabled={resolvingRemittance}
                        className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                    >
                        {resolvingRemittance ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Submitting...
                            </span>
                        ) : (
                            "Submit Resolution"
                        )}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imageModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setImageModal(null)}>
              <img src={`${API_BASE_URL}${imageModal}`} alt="Proof" className="max-h-[90vh] max-w-full rounded-lg" />
              <button className="absolute top-4 right-4 text-white" onClick={() => setImageModal(null)}>
                  <X className="h-8 w-8" />
              </button>
          </div>
      )}

      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
                Back
            </button>
            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                {selected.firstName} {selected.lastName}
                </h2>
                <p className="text-sm text-slate-500">Work ID: {selected.workId}</p>
            </div>
        </div>
        
        <div className="flex gap-2">
             <button
              type="button"
              className={`rounded-lg px-4 py-2 text-xs font-semibold text-white ${
                selected.isActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              onClick={handleToggleStatus}
              disabled={saving}
            >
              {selected.isActive ? "Deactivate" : "Activate"}
            </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
            <button
                onClick={() => setActiveTab("details")}
                className={`border-b-2 py-4 text-sm font-medium ${
                    activeTab === "details"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
            >
                Details
            </button>
            <button
                onClick={() => setActiveTab("wallet")}
                className={`border-b-2 py-4 text-sm font-medium ${
                    activeTab === "wallet"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
            >
                Wallet
            </button>
            <button
                onClick={() => setActiveTab("remittance")}
                className={`border-b-2 py-4 text-sm font-medium ${
                    activeTab === "remittance"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
            >
                Remittance Records
            </button>
            <button
                onClick={() => setActiveTab("dashboard")}
                className={`border-b-2 py-4 text-sm font-medium ${
                    activeTab === "dashboard"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
            >
                Dashboard
            </button>
            <button
                onClick={() => setActiveTab("collections")}
                className={`border-b-2 py-4 text-sm font-medium ${
                    activeTab === "collections"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
            >
                Collections
            </button>
            <button
                onClick={() => setActiveTab("loans")}
                className={`border-b-2 py-4 text-sm font-medium ${
                    activeTab === "loans"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
            >
                Loans
            </button>
            <button
                onClick={() => setActiveTab("customers")}
                className={`border-b-2 py-4 text-sm font-medium ${
                    activeTab === "customers"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
            >
                Customers
            </button>
        </nav>
      </div>

      {activeTab === "details" ? (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <header className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">Basic Information</h3>
                    <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    onClick={() => setIsEditing((prev) => !prev)}
                    >
                    {isEditing ? "Cancel" : "Edit Details"}
                    </button>
                </header>

                <dl className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Created</dt>
                    <dd className="text-sm text-slate-700">{formatDateTime(selected.createdAt)}</dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Last Updated</dt>
                    <dd className="text-sm text-slate-700">{formatDateTime(selected.updatedAt)}</dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Status</dt>
                    <dd>
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        selected.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                    >
                        {selected.isActive ? "Active" : "Inactive"}
                    </span>
                    </dd>
                </div>
                </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="firstName">
                    First Name
                    </label>
                    <input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="lastName">
                    Last Name
                    </label>
                    <input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
                    Email
                    </label>
                    <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="phone">
                    Phone
                    </label>
                    <input
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="branch">
                    Branch
                    </label>
                    <select
                    id="branch"
                    name="branch"
                    value={formData.branch || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                        <option key={branch._id} value={branch.name}>
                        {branch.name}
                        </option>
                    ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="workId">
                    Work ID
                    </label>
                    <input
                    id="workId"
                    name="workId"
                    value={formData.workId || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="address">
                    Address
                    </label>
                    <input
                    id="address"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="city">
                    City
                    </label>
                    <input
                    id="city"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="state">
                    State
                    </label>
                    <input
                    id="state"
                    name="state"
                    value={formData.state || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="zipCode">
                    ZIP Code
                    </label>
                    <input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="country">
                    Country
                    </label>
                    <input
                    id="country"
                    name="country"
                    value={formData.country || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="dateOfBirth">
                    Date of Birth
                    </label>
                    <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-slate-700">Guarantor Information</p>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="guaratorName">
                    Guarantor Name
                    </label>
                    <input
                    id="guaratorName"
                    name="guaratorName"
                    value={formData.guaratorName || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="guaratorPhone">
                    Guarantor Phone
                    </label>
                    <input
                    id="guaratorPhone"
                    name="guaratorPhone"
                    value={formData.guaratorPhone || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="guaratorEmail">
                    Guarantor Email
                    </label>
                    <input
                    id="guaratorEmail"
                    name="guaratorEmail"
                    type="email"
                    value={formData.guaratorEmail || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="guaratorAddress">
                    Guarantor Address
                    </label>
                    <input
                    id="guaratorAddress"
                    name="guaratorAddress"
                    value={formData.guaratorAddress || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-slate-700">Targets</p>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="defaultingTarget">
                    Defaulting Target
                    </label>
                    <input
                    id="defaultingTarget"
                    name="defaultingTarget"
                    type="number"
                    value={formData.defaultingTarget ?? ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="loanTarget">
                    Loan Target
                    </label>
                    <input
                    id="loanTarget"
                    name="loanTarget"
                    type="number"
                    value={formData.loanTarget ?? ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="disbursementTarget">
                    Disbursement Target
                    </label>
                    <input
                    id="disbursementTarget"
                    name="disbursementTarget"
                    type="number"
                    value={formData.disbursementTarget ?? ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={!isEditing}
                    />
                </div>

                {isEditing && (
                    <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                        onClick={() => {
                        const initialData = editableFields.reduce((acc, key) => {
                            if (selected[key] !== undefined && selected[key] !== null) {
                            if (key === "dateOfBirth" && selected[key]) {
                                acc[key] = selected[key].slice(0, 10);
                            } else {
                                acc[key] = selected[key];
                            }
                            } else if (key === "dateOfBirth") {
                            acc[key] = "";
                            } else {
                            acc[key] = "";
                            }
                            return acc;
                        }, {});
                        setFormData(initialData);
                        setIsEditing(false);
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                    </div>
                )}
                </form>
            </section>
          </>
      ) : activeTab === "wallet" ? (
          <section className="space-y-8">
            {walletLoading && !walletSummaryReady ? (
              <div className="flex h-[40vh] items-center justify-center rounded-3xl border border-slate-200 bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : !walletLoading && walletError && !walletSummaryReady ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-600">
                <AlertCircle className="mx-auto mb-3 h-8 w-8" />
                <p className="font-semibold">{walletError}</p>
                <p className="mt-1 text-xs text-rose-500">Attempt the request again or confirm the CSO still has an active wallet.</p>
                <button
                  type="button"
                  onClick={handleRefreshWallet}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Refresh wallet
                </button>
              </div>
            ) : walletSummaryReady ? (
              <>
                <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-4xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-700 p-6 text-white shadow-xl sm:p-8">
                  <div className="absolute inset-0 opacity-25">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.45),transparent_60%)]" />
                  </div>
                  <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-4 text-center lg:text-left">
                      <OutlinePill tone="white">
                        {csoName || "Wallet overview"}
                        {branchLabel ? ` • ${branchLabel}` : ""}
                      </OutlinePill>
                      <h2 className="text-3xl font-semibold md:text-4xl">Monitor and approve this CSO's incentive movement.</h2>
                      <p className="mx-auto max-w-2xl text-sm text-indigo-100/90 lg:mx-0">
                        Bonuses accrue in the performance wallet. 70% of the unlocked balance becomes eligible for transfer to operations once recoveries are under control.
                        Review the deductions list before approving withdrawals.
                      </p>
                      {asOfDate && (
                        <OutlinePill tone="white">Figures updated on {asOfDate}</OutlinePill>
                      )}
                    </div>
                    <div className="max-w-sm rounded-3xl border border-white/20 bg-white/10 p-6 text-left backdrop-blur">
                      <span className="text-xs uppercase tracking-wide text-indigo-100/70">Withdrawable (70%)</span>
                      <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(withdrawable)}</p>
                      <p className="mt-3 text-xs text-indigo-100/80">
                        Exactly 70% of the unlocked bonus. The remaining 30% stays reserved until every recovery loan is resolved or the next payout window opens.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-indigo-100">
                        <TrendingUp className="h-5 w-5 text-emerald-200" />
                        <span>{formatCurrency(totalBonus)} earned in total bonuses.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-3xl border border-slate-200 bg-white/60 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <OutlinePill tone="indigo">{deductionCount} recovery loans impacting bonus</OutlinePill>
                    <OutlinePill tone="emerald">{formatCurrency(remainingBonus)} unlocked balance</OutlinePill>
                    {lastWithdrawalLabel && (
                      <OutlinePill tone="amber">Last approval: {lastWithdrawalLabel}</OutlinePill>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRefreshWallet}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Refresh wallet
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveWalletWithdrawal}
                      disabled={withdrawDisabled}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      {walletSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        "Approve 70% withdrawal"
                      )}
                    </button>
                    {!isDecemberWindow && (
                      <OutlinePill tone="slate">Available in December</OutlinePill>
                    )}
                  </div>
                </div>

                <div className="relative mx-auto w-full max-w-6xl rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
                  {walletOverlay}
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {topPerformanceCards.map((card) => (
                          <MetricCard key={card.label} {...card} />
                        ))}
                      </div>
                      {bottomPerformanceCards.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {bottomPerformanceCards.map((card) => (
                            <MetricCard key={card.label} {...card} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="min-w-0 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h2 className="text-base font-semibold text-slate-900">Bonus timeline</h2>
                            <p className="text-xs text-slate-500">Monitor how incentives are earned, locked, and released every month.</p>
                          </div>
                          <OutlinePill tone="indigo">Performance history</OutlinePill>
                        </div>
                        <div className="relative h-56 w-full sm:h-64">
                          {chartData ? (
                            <Line data={chartData} options={chartOptions} className="!h-full !w-full" />
                          ) : (
                            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                              No performance history yet. Once bonuses post, your trend will appear here.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-6">
                        <div>
                          <h2 className="text-base font-semibold text-slate-900">Recovery deductions</h2>
                          <p className="text-xs text-slate-500">Loans 45+ days past disbursement.</p>
                        </div>
                        <div className="space-y-3">
                          {deductionLoans.length > 0 ? (
                            deductionLoans.slice(0, 5).map((loan) => (
                              <WalletActivityItem key={loan.id || loan.loanId} loan={loan} />
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-600">
                              Fantastic! No loans are currently locking this CSO's bonus.
                            </div>
                          )}
                        </div>
                        {deductionLoans.length > 5 && (
                          <p className="text-xs text-slate-400">Showing the first five loans. Resolve recoveries to release the rest.</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                        <h3 className="text-base font-semibold text-slate-900">Approval checklist</h3>
                        <ul className="mt-4 space-y-3 text-sm text-slate-600">
                          <li className="flex gap-3">
                            <span className="mt-1 block h-2 w-2 rounded-full bg-indigo-500" />
                            <p>Confirm recoveries are actively being managed for all loans listed above before releasing funds.</p>
                          </li>
                          <li className="flex gap-3">
                            <span className="mt-1 block h-2 w-2 rounded-full bg-emerald-500" />
                            <p>Ensure branch cash availability or operational budget can absorb the transfer.</p>
                          </li>
                          <li className="flex gap-3">
                            <span className="mt-1 block h-2 w-2 rounded-full bg-rose-500" />
                            <p>Document approval in the finance log after processing the transfer.</p>
                          </li>
                        </ul>
                      </div>

                      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                        <h3 className="text-base font-semibold text-slate-900">Operational wallet outlook</h3>
                        <div className="mt-4 space-y-3">
                          {operationalCards.map((card) => (
                            <MetricCard key={card.label} {...card} />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                        <h3 className="text-base font-semibold text-slate-900">Supporting actions</h3>
                        <ul className="mt-4 space-y-3 text-sm text-slate-600">
                          <li>
                            <OutlinePill tone="emerald">Coach CSO</OutlinePill>
                            <p className="mt-1 text-xs text-slate-500">Share feedback on recovery accounts so the CSO keeps bonuses unlocked.</p>
                          </li>
                          <li>
                            <OutlinePill tone="amber">Schedule payout</OutlinePill>
                            <p className="mt-1 text-xs text-slate-500">Align withdrawals with quarterly finance runs for smoother reconciliation.</p>
                          </li>
                          <li>
                            <OutlinePill tone="violet">Track history</OutlinePill>
                            <p className="mt-1 text-xs text-slate-500">Log approvals to maintain a clear audit trail for regulatory reporting.</p>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                Wallet data is not yet available for this CSO.
              </div>
            )}
          </section>
      ) : activeTab === "dashboard" ? (
          <CsoDashboardTab csoId={id} />
      ) : activeTab === "collections" ? (
          <CsoCollectionTab csoId={id} />
      ) : activeTab === "loans" ? (
          <CsoLoansTab csoId={id} />
      ) : activeTab === "customers" ? (
          <CsoCustomersTab csoId={id} />
      ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <button onClick={() => handleMonthChange(-1)} className="rounded-full p-1 hover:bg-slate-100">
                          <ChevronLeft className="h-5 w-5 text-slate-600" />
                      </button>
                      <h3 className="text-lg font-semibold text-slate-900">
                          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button onClick={() => handleMonthChange(1)} className="rounded-full p-1 hover:bg-slate-100">
                          <ChevronRight className="h-5 w-5 text-slate-600" />
                      </button>
                  </div>
                  <button
                      onClick={() => openResolveModal()}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                      Resolve Issue
                  </button>
              </div>

              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead>
                          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3 text-right">Collected</th>
                              <th className="px-4 py-3 text-right">Paid</th>
                              <th className="px-4 py-3 text-center">Proof</th>
                              <th className="px-4 py-3">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {monthRemittances.length > 0 ? (
                            monthRemittances.map((record) => {
                                const collected = Number(record.amountCollected) || 0;
                                const paid = Number(record.amountPaid) || 0;
                                const isResolved = Boolean(record.resolvedIssue);
                                
                                let status = "Missing";
                                let statusClass = "bg-rose-100 text-rose-700";
                                
                                if (isResolved) {
                                    status = "Resolved";
                                    statusClass = "bg-slate-100 text-slate-700";
                                } else if (record.amountCollected) {
                                    if (paid >= collected) {
                                        status = "Paid";
                                        statusClass = "bg-emerald-100 text-emerald-700";
                                    } else {
                                        status = "Partial";
                                        statusClass = "bg-amber-100 text-amber-700";
                                    }
                                }

                                return (
                                    <tr key={record.date} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{record.date}</td>
                                        <td className="px-4 py-3 text-right font-mono">{record.amountCollected ? formatCurrency(collected) : "-"}</td>
                                        <td className="px-4 py-3 text-right font-mono">{record.amountPaid ? formatCurrency(paid) : "-"}</td>
                                        <td className="px-4 py-3 text-center">
                                            {record.image ? (
                                                <button onClick={() => setImageModal(record.image)} className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                                                    <ExternalLink className="h-3 w-3" /> View
                                                </button>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                                                {status}
                                            </span>
                                            {isResolved && (
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {record.resolvedIssue}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                          ) : (
                              <tr>
                                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                      No remittance records found for this month.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </section>
      )}
    </div>
  );
}
