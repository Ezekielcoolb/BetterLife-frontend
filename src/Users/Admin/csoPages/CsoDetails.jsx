
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchCsoById,
  updateCso,
  changeCsoStatus,
  clearCsoError,
  resolveCsoRemittance,
} from "../../../redux/slices/csoSlice";
import { fetchBranches } from "../../../redux/slices/branchSlice";
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, X, ExternalLink, Loader2 } from "lucide-react";
import CsoLoansTab from "./CsoLoansTab";
import CsoCustomersTab from "./CsoCustomersTab";
import CsoCollectionTab from "./CsoCollectionTab";
import CsoDashboardTab from "./CsoDashboardTab";

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
  } = useSelector((state) => state.cso);
  const { items: branches } = useSelector((state) => state.branch);

  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Remittance State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveData, setResolveData] = useState({ date: "", message: "" });
  const [imageModal, setImageModal] = useState(null);

  useEffect(() => {
    dispatch(fetchCsoById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (branches.length === 0) {
      dispatch(fetchBranches());
    }
  }, [branches.length, dispatch]);

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
              <img src={`http://localhost:5000${imageModal}`} alt="Proof" className="max-h-[90vh] max-w-full rounded-lg" />
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
