import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import LoanCard from "../../CsosPages/LoanCard";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle2, FileText, Loader2, X, XCircle } from "lucide-react";
import {
  approveLoan,
  clearAdminLoanErrors,
  fetchLoanById,
  fetchCustomerLoans,
  rejectLoan,
  requestLoanEdit,
  resetLoanDetail,
  updateLoanCallChecks,
} from "../../../redux/slices/adminLoanSlice";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = "https://api.betterlifeloan.com"

const resolveAssetUrl = (url) => {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const formatCurrency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(value);
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return value;
  }
};

const MediaThumbnail = ({ url, alt }) => {
  const resolved = resolveAssetUrl(url);

  if (!resolved) {
    return "—";
  }

  return (
    <a
      href={resolved}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block w-max overflow-hidden rounded-lg border border-slate-200"
    >
      <img src={resolved} alt={alt} className="h-32 w-40 object-cover" />
    </a>
  );
};

const InfoSection = ({ title, items }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <header className="mb-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </header>
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map(({ label, value, render }) => {
        const content = render ? render() : value;

        return (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-700">{content ?? "—"}</dd>
          </div>
        );
      })}
    </dl>
  </section>
);

export default function NewLoanDetails() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    detail,
    detailLoading,
    detailError,
    updating,
    updateError,
    customerLoans,
    customerLoansLoading,
    customerLoansError,
  } = useSelector((state) => state.adminLoans);

  const [amountApproved, setAmountApproved] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [editReason, setEditReason] = useState("");
  const [callChecks, setCallChecks] = useState({
    callCso: false,
    callCustomer: false,
    callGuarantor: false,
    callGroupLeader: false,
  });
  const [savingCallChecks, setSavingCallChecks] = useState(false);
  const [showPreviousLoans, setShowPreviousLoans] = useState(false);
  const [loanCardData, setLoanCardData] = useState(null);
  const [loanCardLoading, setLoanCardLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  useEffect(() => {
    if (!id) {
      navigate("/admin/loans", { replace: true });
      return () => {};
    }

    dispatch(fetchLoanById(id));

    return () => {
      dispatch(resetLoanDetail());
    };
  }, [dispatch, id, navigate]);

  useEffect(() => {
    if (detailError) {
      toast.error(detailError);
      dispatch(clearAdminLoanErrors());
    }
  }, [detailError, dispatch]);

  useEffect(() => {
    if (updateError) {
      toast.error(updateError);
      dispatch(clearAdminLoanErrors());
    }
  }, [updateError, dispatch]);

  useEffect(() => {
    if (!detail) {
      return;
    }

    const requestedAmount = detail?.loanDetails?.amountRequested;
    setAmountApproved(
      typeof requestedAmount === "number" && !Number.isNaN(requestedAmount) ? requestedAmount.toString() : ""
    );
    setRejectionReason("");
    setEditReason(detail?.editedReason || "");
    setCallChecks({
      callCso: Boolean(detail?.callChecks?.callCso),
      callCustomer: Boolean(detail?.callChecks?.callCustomer),
      callGuarantor: Boolean(detail?.callChecks?.callGuarantor),
      callGroupLeader: Boolean(detail?.callChecks?.callGroupLeader),
    });

    const customerBvn = detail?.customerDetails?.bvn;
    if (customerBvn) {
      dispatch(fetchCustomerLoans(customerBvn));
    }
  }, [detail]);

  const canModifyDecision = detail?.status === "waiting for approval";
  const canRequestEdit = detail?.status !== "active loan" && detail?.status !== "fully paid";
  const allCallsCompleted = Object.values(callChecks).every(Boolean);

  const customerInfo = useMemo(() => {
    const customer = detail?.customerDetails || {};
    const pictures = detail?.pictures || {};
    return [
      { label: "First name", value: customer.firstName },
      { label: "Last name", value: customer.lastName },
      { label: "Phone", value: customer.phoneOne },
      { label: "Address", value: customer.address },
      { label: "BVN", value: customer.bvn },
      { label: "Next of kin", value: customer.NextOfKin },
      { label: "Next of kin phone", value: customer.NextOfKinNumber },
      { label: "Date of birth", value: customer.dateOfBirth },
      {
        label: "Customer signature",
        render: () => <MediaThumbnail url={resolveAssetUrl(pictures.signature)} alt="Customer signature" />,
      },
    ];
  }, [detail]);

  const businessInfo = useMemo(() => {
    const business = detail?.businessDetails || {};
    return [
      { label: "Business name", value: business.businessName },
      { label: "Nature of business", value: business.natureOfBusiness },
      { label: "Business address", value: business.address },
      { label: "Years at location", value: business.yearsHere },
      { label: "Name known", value: business.nameKnown },
      { label: "Estimated value", value: formatCurrency(business.estimatedValue) },
    ];
  }, [detail]);

  const bankInfo = useMemo(() => {
    const bank = detail?.bankDetails || {};
    return [
      { label: "Account name", value: bank.accountName },
      { label: "Bank name", value: bank.bankName },
      { label: "Account number", value: bank.accountNo },
    ];
  }, [detail]);

  const guarantorInfo = useMemo(() => {
    const guarantor = detail?.guarantorDetails || {};
    return [
      { label: "Guarantor name", value: guarantor.name },
      { label: "Relationship", value: guarantor.relationship },
      { label: "Phone", value: guarantor.phone },
      { label: "Address", value: guarantor.address },
      { label: "Years known", value: guarantor.yearsKnown },
      {
        label: "Guarantor signature",
        render: () => <MediaThumbnail url={resolveAssetUrl(guarantor.signature)} alt="Guarantor signature" />,
      },
    ];
  }, [detail]);

  const csoInfo = useMemo(() => {
    return [
      { label: "CSO name", value: detail?.csoName },
      { label: "CSO ID", value: detail?.csoId },
      { label: "Branch", value: detail?.branch },
      {
        label: "CSO signature",
        render: () => <MediaThumbnail url={resolveAssetUrl(detail?.csoSignature)} alt="CSO signature" />,
      },
    ];
  }, [detail]);

  const groupInfo = useMemo(() => {
    const group = detail?.groupDetails || {};
    return [
      { label: "Group Name", value: group.groupName },
      { label: "Leader Name", value: group.leaderName },
      { label: "Leader Phone", value: group.mobileNo },
      { label: "Leader Address", value: group.address },
    ];
  }, [detail]);

  const loanInfo = useMemo(() => {
    const loanDetails = detail?.loanDetails || {};
    return [
      { label: "Loan type", value: loanDetails.loanType },
      { label: "Amount requested", value: formatCurrency(loanDetails.amountRequested) },
      { label: "Amount approved", value: formatCurrency(loanDetails.amountApproved) },
      { label: "Interest", value: formatCurrency(loanDetails.interest) },
      { label: "Amount to be paid", value: formatCurrency(loanDetails.amountToBePaid) },
      { label: "Daily/Weekly amount", value: formatCurrency(loanDetails.dailyAmount) },
      { label: "Status", value: detail?.status },
      { label: "Submitted", value: formatDate(detail?.createdAt) },
    ];
  }, [detail]);

  const pictures = detail?.pictures || {};
  const previewItems = [
    { label: "Customer photo", url: pictures.customer },
    { label: "Business photo", url: pictures.business },
    { label: "Disclosure", url: pictures.disclosure },
  ].filter((item) => item.url);

  const previousLoans = useMemo(() => {
    if (!Array.isArray(customerLoans) || !detail?._id) {
      return [];
    }

    return customerLoans.filter((loan) => loan._id !== detail._id);
  }, [customerLoans, detail?._id]);

  const toggleCallCheck = async (key) => {
    if (!detail?._id) {
      return;
    }

    const nextValue = !callChecks[key];
    setCallChecks((prev) => ({ ...prev, [key]: nextValue }));
    setSavingCallChecks(true);

    try {
      await dispatch(
        updateLoanCallChecks({ loanId: detail._id, callChecks: { [key]: nextValue } })
      ).unwrap();
      toast.success(nextValue ? "Verification recorded" : "Verification unchecked");
    } catch (error) {
      const message = typeof error === "string" ? error : "Unable to update verification";
      toast.error(message);
      setCallChecks((prev) => ({ ...prev, [key]: !nextValue }));
    } finally {
      setSavingCallChecks(false);
    }
  };

  const openConfirmation = (action) => {
    setPendingConfirmation(action);
  };

  const closeConfirmation = () => {
    setPendingConfirmation(null);
  };

  const confirmAction = async () => {
    if (!pendingConfirmation) {
      return;
    }

    const actionType = pendingConfirmation.type;
    closeConfirmation();

    if (actionType === "approve") {
      await executeApprove();
    } else if (actionType === "reject") {
      await executeReject();
    } else if (actionType === "edit") {
      await executeRequestEdit();
    }
  };

  const confirmationCopy = useMemo(() => {
    if (!pendingConfirmation) {
      return null;
    }

    const amountText = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(Number(amountApproved) || 0);

    const customerName = [detail?.customerDetails?.firstName, detail?.customerDetails?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (pendingConfirmation.type === "approve") {
      return {
        title: "Confirm approval",
        description: `You are about to approve a loan of ${amountText} for ${customerName || "this customer"}. Confirm to proceed.`,
        cta: "Confirm approval",
        tone: "emerald",
      };
    }

    if (pendingConfirmation.type === "reject") {
      return {
        title: "Confirm rejection",
        description: `You are about to reject this loan for ${customerName || "this customer"}. This action cannot be undone.`,
        cta: "Reject loan",
        tone: "rose",
      };
    }

    return {
      title: "Request CSO edits",
      description: `You are about to send this loan back for corrections. ${customerName || "The customer"} will remain on hold until edits are made.`,
      cta: "Send edit request",
      tone: "amber",
    };
  }, [amountApproved, detail?.customerDetails?.firstName, detail?.customerDetails?.lastName, pendingConfirmation]);

  const CALL_CHECK_OPTIONS = [
    { key: "callCso", label: "Contacted CSO" },
    { key: "callCustomer", label: "Called customer" },
    { key: "callGuarantor", label: "Called guarantor" },
    { key: "callGroupLeader", label: "Called group leader" },
  ];

  const handlePreviewLoanCard = async (loanId) => {
    if (!loanId) {
      toast.error("Unable to locate loan details");
      return;
    }

    setLoanCardLoading(true);
    setLoanCardData(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/loans/${loanId}`);
      setLoanCardData(response.data);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to load loan card";
      toast.error(message);
    } finally {
      setLoanCardLoading(false);
    }
  };

  const closeLoanCardModal = () => {
    setLoanCardData(null);
    setLoanCardLoading(false);
  };

  const executeApprove = async () => {
    if (!allCallsCompleted) {
      toast.error("Complete all verification calls before approving this loan");
      return;
    }

    const parsedAmount = Number(amountApproved);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Provide a valid approval amount greater than zero");
      return;
    }

    try {
      await dispatch(approveLoan({ loanId: detail._id, amountApproved: parsedAmount })).unwrap();
      toast.success("Loan approved");
      navigate("/admin/loans", { replace: true });
    } catch (error) {
      const message = typeof error === "string" ? error : "Unable to approve loan";
      toast.error(message);
    }
  };

  const executeReject = async () => {
    const trimmed = rejectionReason.trim();

    if (!trimmed) {
      toast.error("Provide a reason for rejection before submitting");
      return;
    }

    try {
      await dispatch(rejectLoan({ loanId: detail._id, reason: trimmed })).unwrap();
      toast.success("Loan rejected");
      setRejectionReason("");
      navigate("/admin/loans", { replace: true });
    } catch (error) {
      const message = typeof error === "string" ? error : "Unable to reject loan";
      toast.error(message);
    }
  };

  const executeRequestEdit = async () => {
    const trimmed = editReason.trim();

    if (!trimmed) {
      toast.error("Explain what needs to be corrected before requesting edits");
      return;
    }

    try {
      await dispatch(requestLoanEdit({ loanId: detail._id, reason: trimmed })).unwrap();
      toast.success("Edit request sent to CSO");
      setEditReason("");
    } catch (error) {
      const message = typeof error === "string" ? error : "Unable to request edit";
      toast.error(message);
    }
  };

  if (detailLoading || !detail) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          Loading loan details...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/admin/loans")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to waiting approvals
        </button>

        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          Status: <span className="capitalize">{detail.status}</span>
        </span>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{detail.loanId || detail._id}</h1>
            <p className="text-sm text-slate-500">Submitted {formatDate(detail.createdAt)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
              Requested: {formatCurrency(detail?.loanDetails?.amountRequested)}
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
              CSO: {detail.csoName || "—"}
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
              Branch: {detail.branch || "—"}
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Previous loans for this customer</h3>
                <p className="text-sm text-slate-500">Click to view historic submissions when needed.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviousLoans((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                {showPreviousLoans ? "Hide previous loans" : "View previous loans"}
              </button>
            </div>

            {showPreviousLoans && (
              <div className="mt-4 space-y-4">
                {customerLoansLoading && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading history
                  </div>
                )}

                {customerLoansError && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                    {customerLoansError}
                  </p>
                )}

                {previousLoans.length === 0 && !customerLoansLoading ? (
                  <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No earlier loans found for this customer.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-slate-700">Loan ID</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-700">Submitted</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-700">Amount requested</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-700">Status</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {previousLoans.map((loan) => (
                          <tr key={loan._id} className="bg-white">
                            <td className="px-4 py-2 font-semibold text-slate-800">{loan.loanId}</td>
                            <td className="px-4 py-2 text-slate-600">
                              {new Date(loan.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-slate-600">
                              ₦{Number(loan.loanDetails?.amountRequested || 0).toLocaleString("en-NG")}
                            </td>
                            <td className="px-4 py-2 text-slate-600">{loan.status}</td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => handlePreviewLoanCard(loan._id)}
                                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                              >
                                View loan card
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-amber-900">Loan verification checklist</h3>
              <p className="text-sm text-amber-800">
                Confirm the required calls before approving this loan. All items must be checked.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              {allCallsCompleted ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Ready for approval
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-200 px-3 py-1 text-amber-900">
                  <Loader2 className="h-4 w-4 animate-spin" /> Pending verifications
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CALL_CHECK_OPTIONS.map((option) => (
              <label
                key={option.key}
                className="flex items-start gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3 shadow-sm"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  checked={callChecks[option.key]}
                  onChange={() => toggleCallCheck(option.key)}
                  disabled={savingCallChecks || !canModifyDecision}
                />
                <span className="text-sm font-medium text-slate-700">{option.label}</span>
              </label>
            ))}
          </div>

          {!allCallsCompleted && (
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-amber-900">
              <FileText className="h-4 w-4" /> Approval will remain disabled until all calls are confirmed.
            </p>
          )}
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700" htmlFor="amountApproved">
              Approve amount (₦)
            </label>
            <input
              id="amountApproved"
              type="number"
              min="0"
              value={amountApproved}
              onChange={(event) => setAmountApproved(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Enter amount"
              disabled={updating || !canModifyDecision || !allCallsCompleted}
            />
            <button
              type="button"
              onClick={() => openConfirmation({ type: "approve" })}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
              disabled={updating || !canModifyDecision || !allCallsCompleted}
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve loan
            </button>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700" htmlFor="rejectionReason">
              Reject loan (reason)
            </label>
            <textarea
              id="rejectionReason"
              rows={4}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              placeholder="Provide context for rejection"
              disabled={updating || !canModifyDecision}
            />
            <button
              type="button"
              onClick={() => openConfirmation({ type: "reject" })}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
              disabled={updating || !canModifyDecision}
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject loan
            </button>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700" htmlFor="editReason">
              Request CSO edits (reason)
            </label>
            <textarea
              id="editReason"
              rows={4}
              value={editReason}
              onChange={(event) => setEditReason(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="Explain what needs to be corrected before approval"
              disabled={updating || !canRequestEdit}
            />
            <button
              type="button"
              onClick={() => openConfirmation({ type: "edit" })}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
              disabled={updating || !canRequestEdit}
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Ask for edit
            </button>
          </div>
        </div>

        {detail.rejectionReason && (
          <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Previously rejected with reason: {detail.rejectionReason}
          </div>
        )}

        {detail.editedReason && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Edit requested: {detail.editedReason}
          </div>
        )}
      </section>

      {(loanCardLoading || loanCardData) && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            aria-hidden="true"
            onClick={closeLoanCardModal}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
              <button
                type="button"
                onClick={closeLoanCardModal}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close loan card"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="mb-4 text-lg font-semibold text-slate-900">Loan card preview</h3>

              {loanCardLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading loan card...
                  </span>
                </div>
              ) : loanCardData ? (
                <div className="max-h-[70vh] overflow-y-auto">
                  <LoanCard loan={loanCardData} />
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/loans/${loanCardData._id}`)}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Open full loan page
                  </button>
                </div>
              ) : (
                <p className="text-sm text-rose-600">Unable to load loan card.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {pendingConfirmation && confirmationCopy && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeConfirmation} aria-hidden="true" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <button
                type="button"
                onClick={closeConfirmation}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close confirmation"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-semibold text-slate-900">{confirmationCopy.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{confirmationCopy.description}</p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeConfirmation}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAction}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
                    confirmationCopy.tone === "emerald"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : confirmationCopy.tone === "rose"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {confirmationCopy.cta}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <InfoSection title="CSO details" items={csoInfo} />
      <InfoSection title="Customer details" items={customerInfo} />
      <InfoSection title="Business details" items={businessInfo} />
      <InfoSection title="Bank details" items={bankInfo} />
      <InfoSection title="Guarantor details" items={guarantorInfo} />
      <InfoSection title="Group details" items={groupInfo} />
      <InfoSection title="Loan details" items={loanInfo} />

      {previewItems.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Supporting media</h2>
            <p className="text-sm text-slate-500">Uploaded documents and signatures.</p>
          </header>
          <div className="grid gap-4 md:grid-cols-3">
            {previewItems.map(({ label, url }) => (
              <div key={label} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <a
                  href={resolveAssetUrl(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-slate-200"
                >
                  <img
                    src={resolveAssetUrl(url)}
                    alt={label}
                    className="h-48 w-full object-cover"
                  />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
