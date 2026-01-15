import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  submitLoan,
  clearLoanError,
  fetchCsoLoans,
  fetchCsoOutstandingLoans,
  submitLoanEdit,
} from "../../redux/slices/loanSlice";
import { fetchMyApprovedGroupLeaders, createGroupLeader } from "../../redux/slices/groupLeaderSlice";
import { uploadImages } from "../../redux/slices/uploadSlice";
import { useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import toast from "react-hot-toast";
import {
  Plus,
  Upload,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  ListChecks,
  Users,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Search,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function getRemittanceReferenceDate(baseDate = new Date()) {
  const reference = new Date(baseDate);
  const day = reference.getDay(); // 0 = Sunday, 6 = Saturday

  if (day === 1) {
    // Monday → check previous Friday
    reference.setDate(reference.getDate() - 3);
  } else if (day === 0) {
    // Sunday → check previous Friday
    reference.setDate(reference.getDate() - 2);
  } else if (day === 6) {
    // Saturday → check previous Friday
    reference.setDate(reference.getDate() - 1);
  } else {
    reference.setDate(reference.getDate() - 1);
  }

  return reference;
}

function formatRemittanceDateLabel(date) {
  if (!date) {
    return "yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

const STEP_ITEMS = [
  {
    id: 1,
    title: "Customer & group",
    description: "Borrower identity and group selection",
  },
  {
    id: 2,
    title: "Business & guarantor",
    description: "Business profile and guarantor confirmation",
  },
  {
    id: 3,
    title: "Bank, loan & uploads",
    description: "Financial details, media uploads, and signatures",
  },
  {
    id: 4,
    title: "Review & submit",
    description: "Confirm every section before submission",
  },
];

const TOTAL_STEPS = STEP_ITEMS.length;
const REVIEW_STEP = TOTAL_STEPS;

const MEDIA_UPLOAD_CONFIG = {
  customer: {
    label: "Customer photo",
    description: "Upload a clear photo of the borrower.",
    folder: "customer",
  },
  business: {
    label: "Business photo",
    description: "Show the business location or assets.",
    folder: "business",
  },
  disclosure: {
    label: "Disclosure document",
    description: "Upload the signed disclosure form.",
    folder: "disclosure",
  },
};

const REQUIRED_UPLOAD_KEYS = ["customer", "business", "disclosure"];

const SIGNATURE_UPLOAD_FOLDER = "signatures";
const MEDIA_UPLOAD_KEYS = Object.keys(MEDIA_UPLOAD_CONFIG);

const createInitialFormState = () => ({
  customerDetails: {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phoneOne: "",
    address: "",
    bvn: "",
    NextOfKin: "",
    NextOfKinNumber: "",
  },
  businessDetails: {
    businessName: "",
    natureOfBusiness: "",
    address: "",
    yearsHere: "",
    nameKnown: "",
    estimatedValue: "",
  },
  bankDetails: {
    accountName: "",
    bankName: "",
    accountNo: "",
  },
  loanDetails: {
    amountRequested: "",
    loanType: "daily",
    amountToBePaid: "",
    dailyAmount: "",
  },
  guarantorDetails: {
    name: "",
    address: "",
    phone: "",
    relationship: "",
    yearsKnown: "",
    signature: "",
  },
  pictures: {
    customer: "",
    business: "",
    disclosure: "",
    signature: "",
  },
  groupDetails: {
    groupId: "",
    groupName: "",
    leaderName: "",
    address: "",
    mobileNo: "",
  },
});

function mapSection(template, source = {}) {
  return Object.entries(template).reduce((acc, [key, defaultValue]) => {
    const candidate = source[key];
    if (candidate === null || candidate === undefined) {
      acc[key] = defaultValue;
      return acc;
    }

    if (typeof defaultValue === "number" || typeof candidate === "number") {
      acc[key] = candidate;
      return acc;
    }

    acc[key] = typeof candidate === "string" ? candidate : String(candidate);
    return acc;
  }, {});
}

function buildInitialFormStateFromLoan(loan) {
  if (!loan) {
    return createInitialFormState();
  }

  const base = createInitialFormState();

  return {
    customerDetails: mapSection(base.customerDetails, loan.customerDetails),
    businessDetails: mapSection(base.businessDetails, loan.businessDetails),
    bankDetails: mapSection(base.bankDetails, loan.bankDetails),
    loanDetails: {
      ...base.loanDetails,
      ...mapSection(base.loanDetails, loan.loanDetails),
      loanType: loan.loanDetails?.loanType || base.loanDetails.loanType,
    },
    guarantorDetails: mapSection(base.guarantorDetails, loan.guarantorDetails),
    pictures: mapSection(base.pictures, loan.pictures),
    groupDetails: mapSection(base.groupDetails, loan.groupDetails),
  };
}

const REQUIRED_FIELDS = [
  { section: "customerDetails", field: "firstName", label: "Customer first name" },
  { section: "customerDetails", field: "lastName", label: "Customer last name" },
  { section: "customerDetails", field: "phoneOne", label: "Customer phone number" },
  { section: "customerDetails", field: "address", label: "Customer address" },
  { section: "customerDetails", field: "bvn", label: "Customer BVN" },
  { section: "customerDetails", field: "NextOfKin", label: "Next of kin" },
  { section: "customerDetails", field: "NextOfKinNumber", label: "Next of kin phone" },
  { section: "businessDetails", field: "businessName", label: "Business name" },
  { section: "businessDetails", field: "natureOfBusiness", label: "Nature of business" },
  { section: "businessDetails", field: "address", label: "Business address" },
  { section: "businessDetails", field: "nameKnown", label: "How well known is the name" },
  { section: "bankDetails", field: "accountName", label: "Account name" },
  { section: "bankDetails", field: "bankName", label: "Bank name" },
  { section: "bankDetails", field: "accountNo", label: "Account number" },
  { section: "guarantorDetails", field: "name", label: "Guarantor name" },
  { section: "guarantorDetails", field: "address", label: "Guarantor address" },
  { section: "guarantorDetails", field: "phone", label: "Guarantor phone" },
  { section: "guarantorDetails", field: "relationship", label: "Guarantor relationship" },
  { section: "guarantorDetails", field: "yearsKnown", label: "Years known" },
];

const STEP1_REQUIRED_FIELDS = REQUIRED_FIELDS.filter(({ section }) => section === "customerDetails");

const STEP2_REQUIRED_FIELDS = REQUIRED_FIELDS.filter(({ section }) =>
  ["businessDetails", "guarantorDetails"].includes(section)
);

const STEP3_REQUIRED_FIELDS = REQUIRED_FIELDS.filter(({ section }) => section === "bankDetails");

const LOAN_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const CUSTOMER_FIELDS = [
  { key: "firstName", label: "First name", type: "text", placeholder: "Customer first name" },
  { key: "lastName", label: "Last name", type: "text", placeholder: "Customer last name" },
  { key: "dateOfBirth", label: "Date of birth", type: "date" },
  { key: "phoneOne", label: "Phone number", type: "tel", placeholder: "0801 234 5678" },
  { key: "address", label: "Residential address", type: "text", colSpan: 2, placeholder: "Street, city, state" },
  { key: "bvn", label: "NIN", type: "text", placeholder: "Enter NIN" },
  { key: "NextOfKin", label: "Next of kin", type: "text", placeholder: "Next of kin name" },
  { key: "NextOfKinNumber", label: "Next of kin phone", type: "tel", placeholder: "0801 234 5678" },
];

const BUSINESS_FIELDS = [
  { key: "businessName", label: "Business name", type: "text" },
  { key: "natureOfBusiness", label: "Nature of business", type: "text", placeholder: "Retail, services, etc." },
  { key: "address", label: "Business address", type: "text", colSpan: 2, placeholder: "Shop address" },
  { key: "yearsHere", label: "Years at location", type: "number", min: 0, placeholder: "0" },
  { key: "nameKnown", label: "How well known is the name?", type: "text", placeholder: "Popular in the market" },
  { key: "estimatedValue", label: "Estimated business value (₦)", type: "number", min: 0, placeholder: "" },
];

const GUARANTOR_FIELDS = [
  { key: "name", label: "Guarantor name", type: "text" },
  { key: "phone", label: "Guarantor phone", type: "tel", placeholder: "0801 234 5678" },
  { key: "address", label: "Guarantor address", type: "text", colSpan: 2, placeholder: "Residential address" },
  { key: "relationship", label: "Relationship", type: "text", placeholder: "Brother, friend, etc." },
  { key: "yearsKnown", label: "Years known", type: "number", min: 0, placeholder: "0" },
];

const BANK_FIELDS = [
  { key: "accountName", label: "Account name", type: "text" },
  { key: "bankName", label: "Bank name", type: "text" },
  { key: "accountNo", label: "Account number", type: "text", inputMode: "numeric", colSpan: 2, placeholder: "0123456789" },
];

const STATUS_BADGE_STYLES = {
  "waiting for approval": "bg-amber-500",
  approved: "bg-emerald-500",
  "active loan": "bg-blue-500",
  "fully paid": "bg-blue-900",
  rejected: "bg-rose-500",
  edited: "bg-slate-500",
};

function getStatusBadgeClass(status) {
  const normalized = typeof status === "string" ? status.toLowerCase() : "";
  return STATUS_BADGE_STYLES[normalized] || "bg-slate-400";
}

function resolveAssetUrl(url) {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatCurrencyValue(value) {
  const number = toNumber(value);

  if (number === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
}

function displayText(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(value)
      : "—";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : "—";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }

  return String(value);
}

function ReviewSection({ title, description, onEdit, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
          >
            Edit section
          </button>
        )}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function ReviewItem({ label, value, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value ?? "—"}</p>
    </div>
  );
}

import { fetchCsoProfile } from "../../redux/slices/csoSlice";

export default function CsoHome() {
  const dispatch = useDispatch();
  const { loans, loansPagination, loading, submitting, error } = useSelector((state) => state.loan);
  const { token, cso: csoAuth } = useSelector((state) => state.csoAuth);
  const { profile: csoProfile } = useSelector((state) => state.cso);
  const { imageUploadLoading } = useSelector((state) => state.upload);
  const { totalOutstanding } = useSelector((state) => state.loan);

  const [form, setForm] = useState(createInitialFormState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingFromModal, setIsSubmittingFromModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeUploadTarget, setActiveUploadTarget] = useState(null);
  const [loanStatusModal, setLoanStatusModal] = useState(null);
  const [editingLoanSnapshot, setEditingLoanSnapshot] = useState(null);
  const [editingLoanId, setEditingLoanId] = useState(null);

  // Floating Action Button State
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showGroupLeaderModal, setShowGroupLeaderModal] = useState(false);
  const [groupLeaderForm, setGroupLeaderForm] = useState({
    groupName: "",
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
  });

  // Group Leaders State - using Redux
  const groupLeaders = useSelector((state) => state.groupLeader.items);
  const loadingGroupLeaders = useSelector((state) => state.groupLeader.loading);

  // Blocking Modal State
  const [showBlockingModal, setShowBlockingModal] = useState(false);
  const [blockingModalType, setBlockingModalType] = useState(null); // 'missing' | 'partial'
  const [pendingRemittanceDate, setPendingRemittanceDate] = useState(null);

  const navigate = useNavigate();

  const customerSignatureRef = useRef(null);
  const guarantorSignatureRef = useRef(null);

  const [page, setPage] = useState(1);
  const defaultPageSize = 16;
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  useEffect(() => {
    if (loansPagination?.page && loansPagination.page !== page) {
      setPage(loansPagination.page);
    }
  }, [loansPagination?.page]);

  const currentPageSize = loansPagination?.limit || defaultPageSize;

  const effectiveFilterParams = useMemo(
    () => ({
      search: searchTerm.trim(),
      groupId: groupFilter === "all" ? "" : groupFilter,
    }),
    [searchTerm, groupFilter]
  );

  useEffect(() => {
    setPage(1);
  }, [effectiveFilterParams.search, effectiveFilterParams.groupId]);

  // Group Leader Handlers using Redux
  const handleGroupLeaderFormChange = (e) => {
    const { name, value } = e.target;
    setGroupLeaderForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGroupLeaderSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(createGroupLeader(groupLeaderForm)).unwrap();
      toast.success('Group leader created successfully!');
      setShowGroupLeaderModal(false);
      setGroupLeaderForm({
        groupName: "",
        firstName: "",
        lastName: "",
        address: "",
        phone: "",
      });
      // Refresh group leaders list
      dispatch(fetchMyApprovedGroupLeaders());
    } catch (error) {
      toast.error(error || 'Failed to create group leader');
    }
  };

  // Handle group leader selection
  const handleGroupLeaderChange = (selectedGroupId) => {
    const selectedLeader = groupLeaders.find(gl => gl._id === selectedGroupId);
    if (selectedLeader) {
      setForm(prev => ({
        ...prev,
        groupDetails: {
          groupId: selectedLeader._id,
          groupName: selectedLeader.groupName,
          leaderName: `${selectedLeader.firstName} ${selectedLeader.lastName}`,
          address: selectedLeader.address,
          mobileNo: selectedLeader.phone,
        }
      }));
    }
  };

  const handleFabClick = () => {
    setShowFabMenu(!showFabMenu);
  };

  const handleFabAction = (action) => {
    setShowFabMenu(false);
    if (action === 'loan') {
      // Check if CSO has exceeded defaulting target before opening modal
      const defaultingTarget = csoAuth?.defaultingTarget || 0;
      if (defaultingTarget > 0 && totalOutstanding > defaultingTarget) {
        toast.error(
          `Cannot create loan: Your outstanding defaults (₦${totalOutstanding.toFixed(2)}) exceed your limit (₦${defaultingTarget.toFixed(2)})`,
          { duration: 5000 }
        );
        return;
      }
      setIsModalOpen(true);
    } else if (action === 'groupLeader') {
      setShowGroupLeaderModal(true);
    }
  };

  useEffect(() => {
    if (token) {
      dispatch(fetchCsoProfile());
      dispatch(fetchMyApprovedGroupLeaders());
      dispatch(fetchCsoOutstandingLoans()); // Fetch outstanding loans for validation
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (token) {
      dispatch(
        fetchCsoLoans({
          page,
          limit: currentPageSize,
          search: effectiveFilterParams.search,
          groupId: effectiveFilterParams.groupId,
        })
      );
    }
  }, [token, page, currentPageSize, effectiveFilterParams.search, effectiveFilterParams.groupId, dispatch]);

  useEffect(() => {
    if (csoProfile) {
      checkOutstandingRemittance(csoProfile);
    }
  }, [csoProfile]);

  const checkOutstandingRemittance = (profile) => {
    if (!profile || !profile.remittance) {
      setShowBlockingModal(false);
      setPendingRemittanceDate(null);
      return;
    }

    const referenceDate = getRemittanceReferenceDate();
    const referenceDateStr = referenceDate.toISOString().slice(0, 10);

    const targetRemittances = profile.remittance.filter((record) => {
      const recordDate = new Date(record.date).toISOString().slice(0, 10);
      return recordDate === referenceDateStr;
    });

    // Case 1: No remittance record at all for the reference date
    if (targetRemittances.length === 0) {
      setBlockingModalType("missing");
      setPendingRemittanceDate(referenceDate);
      setShowBlockingModal(true);
      return;
    }

    // Case 2: Remittance exists, check if resolved
    const isResolved = targetRemittances.some((record) => record.resolvedIssue);
    if (isResolved) {
      setShowBlockingModal(false);
      setPendingRemittanceDate(null);
      return;
    }

    // Case 3: Check for partial payment
    const amountCollected = Math.max(
      ...targetRemittances.map((record) => Number(record.amountCollected) || 0)
    );
    const totalPaid = targetRemittances.reduce(
      (sum, record) => sum + (Number(record.amountPaid) || 0),
      0
    );

    if (totalPaid < amountCollected) {
      setBlockingModalType("partial");
      setPendingRemittanceDate(referenceDate);
      setShowBlockingModal(true);
    } else {
      setShowBlockingModal(false);
      setPendingRemittanceDate(null);
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearLoanError());
    }
  }, [error, dispatch]);

  const handleNestedChange = (section, field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const loanPayload = useMemo(() => {
    const amountRequested = toNumber(form.loanDetails.amountRequested);
    const businessYears = toNumber(form.businessDetails.yearsHere);
    const estimatedValue = toNumber(form.businessDetails.estimatedValue);
    const amountToBePaid = toNumber(form.loanDetails.amountToBePaid);
    const dailyAmount = toNumber(form.loanDetails.dailyAmount);
    const yearsKnown = toNumber(form.guarantorDetails.yearsKnown);

    const sanitizedPictures = Object.entries(form.pictures).reduce((acc, [key, value]) => {
      if (typeof value === "string" && value.trim()) {
        acc[key] = value.trim();
      }
      return acc;
    }, {});

    return {
      customerDetails: {
        firstName: form.customerDetails.firstName.trim(),
        lastName: form.customerDetails.lastName.trim(),
        dateOfBirth: form.customerDetails.dateOfBirth.trim() || undefined,
        phoneOne: form.customerDetails.phoneOne.trim(),
        address: form.customerDetails.address.trim(),
        bvn: form.customerDetails.bvn.trim(),
        NextOfKin: form.customerDetails.NextOfKin.trim(),
        NextOfKinNumber: form.customerDetails.NextOfKinNumber.trim(),
      },
      businessDetails: {
        businessName: form.businessDetails.businessName.trim(),
        natureOfBusiness: form.businessDetails.natureOfBusiness.trim(),
        address: form.businessDetails.address.trim(),
        nameKnown: form.businessDetails.nameKnown.trim(),
        ...(businessYears !== undefined ? { yearsHere: businessYears } : {}),
        ...(estimatedValue !== undefined ? { estimatedValue } : {}),
      },
      bankDetails: {
        accountName: form.bankDetails.accountName.trim(),
        bankName: form.bankDetails.bankName.trim(),
        accountNo: form.bankDetails.accountNo.trim(),
      },
      loanDetails: {
        amountRequested,
        loanType: form.loanDetails.loanType,
        ...(amountToBePaid !== undefined ? { amountToBePaid } : {}),
        ...(dailyAmount !== undefined ? { dailyAmount } : {}),
      },
      guarantorDetails: {
        name: form.guarantorDetails.name.trim(),
        address: form.guarantorDetails.address.trim(),
        phone: form.guarantorDetails.phone.trim(),
        relationship: form.guarantorDetails.relationship.trim(),
        yearsKnown,
        signature: form.guarantorDetails.signature?.trim() || undefined,
      },
      groupDetails: {
        groupId: form.groupDetails.groupId || undefined,
        groupName: form.groupDetails.groupName?.trim() || undefined,
        leaderName: form.groupDetails.leaderName?.trim() || undefined,
        address: form.groupDetails.address?.trim() || undefined,
        mobileNo: form.groupDetails.mobileNo?.trim() || undefined,
      },
      pictures: sanitizedPictures,
    };
  }, [form]);

  const step1Valid = useMemo(() => {
    return STEP1_REQUIRED_FIELDS.every(({ section, field }) => {
      const candidate = form[section]?.[field];
      return typeof candidate === "string" ? candidate.trim().length > 0 : Boolean(candidate);
    });
  }, [form]);

  const step2Valid = useMemo(() => {
    const requiredComplete = STEP2_REQUIRED_FIELDS.every(({ section, field }) => {
      const candidate = form[section]?.[field];
      return typeof candidate === "string" ? candidate.trim().length > 0 : Boolean(candidate);
    });

    const yearsKnown = toNumber(form.guarantorDetails.yearsKnown);
    const yearsHereValue = form.businessDetails.yearsHere;
    const yearsHereNumber = toNumber(yearsHereValue);
    const estimatedValue = form.businessDetails.estimatedValue;
    const estimatedValueNumber = toNumber(estimatedValue);

    const yearsHereValid =
      yearsHereValue === "" || yearsHereNumber === undefined || yearsHereNumber >= 0;
    const estimatedValid =
      estimatedValue === "" || estimatedValueNumber === undefined || estimatedValueNumber >= 0;

    return (
      requiredComplete &&
      yearsKnown !== undefined &&
      yearsKnown >= 0 &&
      yearsHereValid &&
      estimatedValid
    );
  }, [form]);

  const step3Valid = useMemo(() => {
    const hasRequiredStrings = STEP3_REQUIRED_FIELDS.every(({ section, field }) => {
      const candidate = form[section]?.[field];
      return typeof candidate === "string" ? candidate.trim().length > 0 : Boolean(candidate);
    });

    const amountRequested = toNumber(form.loanDetails.amountRequested);
    const yearsKnown = toNumber(form.guarantorDetails.yearsKnown);

    return (
      hasRequiredStrings &&
      amountRequested &&
      amountRequested > 0 &&
      Boolean(form.loanDetails.loanType) &&
      yearsKnown !== undefined &&
      yearsKnown >= 0 &&
      REQUIRED_UPLOAD_KEYS.every((key) => form.pictures[key]) &&
      Boolean(form.pictures.signature) &&
      Boolean(form.guarantorDetails.signature)
    );
  }, [form]);

  const isUploading = imageUploadLoading || Boolean(activeUploadTarget);

  const isSubmitDisabled =
    submitting || isUploading || !step1Valid || !step2Valid || !step3Valid;

  const describeMissingStep1 = () => {
    const missing = STEP1_REQUIRED_FIELDS.filter(({ section, field }) => {
      const candidate = form[section]?.[field];
      return !(typeof candidate === "string" ? candidate.trim().length > 0 : Boolean(candidate));
    });

    if (missing.length === 0) return null;

    const labels = missing.map(({ label }) => label);
    return `Fill these fields: ${labels.join(", ")}`;
  };

  const describeMissingStep2 = () => {
    const missing = STEP2_REQUIRED_FIELDS.filter(({ section, field }) => {
      const candidate = form[section]?.[field];
      return !(typeof candidate === "string" ? candidate.trim().length > 0 : Boolean(candidate));
    });

    const businessMissing = missing
      .filter(({ section }) => section === "businessDetails")
      .map(({ label }) => label);
    const guarantorMissing = missing
      .filter(({ section }) => section === "guarantorDetails")
      .map(({ label }) => label);

    const yearsKnown = toNumber(form.guarantorDetails.yearsKnown);
    const yearsHereValue = form.businessDetails.yearsHere;
    const yearsHereNumber = toNumber(yearsHereValue);
    const estimatedValue = form.businessDetails.estimatedValue;
    const estimatedValueNumber = toNumber(estimatedValue);

    const messages = [];

    if (businessMissing.length > 0) {
      messages.push(`Business details: ${businessMissing.join(", ")}`);
    }

    if (guarantorMissing.length > 0) {
      messages.push(`Guarantor details: ${guarantorMissing.join(", ")}`);
    }

    if (yearsHereValue && (yearsHereNumber === undefined || yearsHereNumber < 0)) {
      messages.push("Business years at location must be zero or greater");
    }

    if (estimatedValue && (estimatedValueNumber === undefined || estimatedValueNumber < 0)) {
      messages.push("Estimated business value must be zero or greater");
    }

    if (yearsKnown === undefined || yearsKnown < 0) {
      messages.push("Guarantor years known must be zero or greater");
    }

    if (!messages.length) {
      return null;
    }

    return messages.join(". ");
  };

  const describeMissingStep3 = () => {
    const missing = STEP3_REQUIRED_FIELDS.filter(({ section, field }) => {
      const candidate = form[section]?.[field];
      return !(typeof candidate === "string" ? candidate.trim().length > 0 : Boolean(candidate));
    });

    const uploadIssues = REQUIRED_UPLOAD_KEYS.filter((key) => !form.pictures[key]);
    const signatureMissing = !form.pictures.signature;
    const guarantorSignatureMissing = !form.guarantorDetails.signature;
    const amountRequested = toNumber(form.loanDetails.amountRequested);

    const messages = [];

    if (missing.length > 0) {
      messages.push(`Bank details: ${missing.map(({ label }) => label).join(", ")}`);
    }

    if (!form.loanDetails.loanType) {
      messages.push("Select a loan type");
    }

    if (!amountRequested || amountRequested <= 0) {
      messages.push("Amount requested must be greater than zero");
    }

    if (uploadIssues.length > 0) {
      messages.push(`Uploads required for: ${uploadIssues.join(", ")}`);
    }

    if (signatureMissing) {
      messages.push("Customer signature upload is required");
    }

    if (guarantorSignatureMissing) {
      messages.push("Guarantor signature upload is required");
    }

    if (!messages.length) {
      return null;
    }

    return messages.join(". ");
  };

  const resetSignatures = () => {
    customerSignatureRef.current?.clear();
    guarantorSignatureRef.current?.clear();
  };

  const resetForm = () => {
    setForm(createInitialFormState());
    setCurrentStep(1);
    resetSignatures();
    setActiveUploadTarget(null);
  };

  const closeModal = () => {
    if (!submitting) {
      setIsModalOpen(false);
      setIsSubmittingFromModal(false);
      resetForm();
    }

    setEditingLoanSnapshot(null);
    setEditingLoanId(null);
  };

  const openModal = (initialFormState) => {
    if (initialFormState) {
      setForm(initialFormState);
    }
    setIsModalOpen(true);
  };

  const beginLoanEdit = (loan) => {
    if (!loan) {
      return;
    }

    const initialState = buildInitialFormStateFromLoan(loan);
    setEditingLoanSnapshot(loan);
    setEditingLoanId(loan._id || loan.loanId || null);
    setCurrentStep(1);
    openModal(initialState);
  };

  const goToNextStep = () => {
    if (currentStep === 1 && !step1Valid) {
      const summary = describeMissingStep1();
      toast.error(summary || "Fill in all required customer details before continuing");
      return;
    }

    if (currentStep === 2 && !step2Valid) {
      const summary = describeMissingStep2();
      toast.error(summary || "Complete business and guarantor details before continuing");
      return;
    }

    if (currentStep === 3 && !step3Valid) {
      const summary = describeMissingStep3();
      toast.error(summary || "Resolve outstanding fields before continuing to review");
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleUpload = async (event, targetKey, folderName) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    try {
      setActiveUploadTarget(targetKey);
      const { urls } = await dispatch(uploadImages({ files, folderName, target: targetKey })).unwrap();
      setForm((prev) => ({
        ...prev,
        pictures: {
          ...prev.pictures,
          [targetKey]: urls[0],
        },
      }));
      toast.success("Upload completed");
    } catch (uploadError) {
      const message = typeof uploadError === "string" ? uploadError : "Upload failed";
      toast.error(message);
    } finally {
      setActiveUploadTarget(null);
      event.target.value = "";
    }
  };

  const handleSignatureUpload = async (canvasRef, { uploadKey, applyToForm }) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.isEmpty()) {
      toast.error("Draw the signature before uploading");
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");

    try {
      setActiveUploadTarget(uploadKey);
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${uploadKey}-signature.png`, { type: "image/png" });

      const { urls } = await dispatch(
        uploadImages({ files: [file], folderName: SIGNATURE_UPLOAD_FOLDER, target: uploadKey })
      ).unwrap();

      const uploadedUrl = urls[0];
      setForm((prev) => applyToForm(prev, uploadedUrl));

      toast.success("Signature uploaded");
    } catch (signatureError) {
      const message = typeof signatureError === "string" ? signatureError : "Unable to upload signature";
      toast.error(message);
    } finally {
      setActiveUploadTarget(null);
    }
  };

  const clearSignaturePad = (canvasRef) => {
    canvasRef.current?.clear();
  };

  const removeUploadedMedia = (key) => {
    setForm((prev) => ({
      ...prev,
      pictures: {
        ...prev.pictures,
        [key]: "",
      },
    }));
  };

  const removeSignature = (type) => {
    setForm((prev) => {
      if (type === "customer") {
        return {
          ...prev,
          pictures: {
            ...prev.pictures,
            signature: "",
          },
        };
      }

      if (type === "guarantor") {
        return {
          ...prev,
          guarantorDetails: {
            ...prev.guarantorDetails,
            signature: "",
          },
        };
      }

      return prev;
    });

    if (type === "customer") {
      customerSignatureRef.current?.clear();
    } else if (type === "guarantor") {
      guarantorSignatureRef.current?.clear();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (currentStep !== REVIEW_STEP) {
      goToNextStep();
      return;
    }

    if (!step1Valid) {
      const summary = describeMissingStep1();
      toast.error(summary || "Fill in all required customer details before submitting");
      setCurrentStep(1);
      return;
    }

    if (!step2Valid) {
      const summary = describeMissingStep2();
      toast.error(summary || "Complete business and guarantor details before submitting");
      setCurrentStep(2);
      return;
    }

    if (!step3Valid) {
      const summary = describeMissingStep3();
      toast.error(summary || "Resolve bank, loan, and upload requirements before submitting");
      setCurrentStep(3);
      return;
    }

    const isEditing = Boolean(editingLoanId);
    const actionThunk = isEditing ? submitLoanEdit : submitLoan;

    try {
      setIsSubmittingFromModal(true);
      if (isEditing) {
        await dispatch(actionThunk({ loanId: editingLoanId, data: loanPayload })).unwrap();
      } else {
        await dispatch(actionThunk(loanPayload)).unwrap();
      }
      toast.success(
        isEditing
          ? "Edited loan resubmitted for approval"
          : "Loan submitted successfully"
      );
      closeModal();
      setEditingLoanSnapshot(null);
      setEditingLoanId(null);
    } catch (submissionError) {
      const message = typeof submissionError === "string" ? submissionError : "Unable to submit loan";
      toast.error(message);
    } finally {
      setIsSubmittingFromModal(false);
    }
  };

  const handleLoanCardClick = (loan) => {
    if (!loan) {
      return;
    }

    const status = loan.status;

    if (status === "waiting for approval") {
      setLoanStatusModal({
        title: "Waiting for approval",
        message: "This loan is pending admin review. Please wait for approval.",
        bvn: loan?.customerDetails?.bvn,
        icon: <Clock className="h-10 w-10 text-amber-500" />,
      });
      return;
    }

    if (status === "approved") {
      setLoanStatusModal({
        title: "Awaiting disbursement",
        message: "This loan has been approved. An admin will disburse the funds soon.",
        bvn: loan?.customerDetails?.bvn,
        icon: <CheckCircle2 className="h-10 w-10 text-emerald-500" />,
      });
      return;
    }

    if (status === "rejected") {
      setLoanStatusModal({
        title: "Loan rejected",
        message: loan.rejectionReason
          ? `Reason provided: ${loan.rejectionReason}`
          : "This loan was rejected by admin.",
        bvn: loan?.customerDetails?.bvn,
        icon: <AlertCircle className="h-10 w-10 text-rose-500" />,
      });
      return;
    }

    if (status === "edited") {
      setLoanStatusModal({
        title: "Edit requested",
        message: loan.editedReason
          ? `Admin feedback: ${loan.editedReason}`
          : "Admin asked for corrections before approval.",
        bvn: loan?.customerDetails?.bvn,
        icon: <AlertCircle className="h-10 w-10 text-amber-500" />,
        loanId: loan?._id,
        context: "edit",
      });
      return;
    }

    if (status === "active loan") {
      navigate(`/cso/loans/${loan._id}`);
      return;
    }

    setLoanStatusModal({
      title: "Loan status",
      message: `Current status: ${status}`,
      icon: <FileText className="h-10 w-10 text-indigo-500" />,
    });
  };

  const handleGiveNewLoan = (event, loan) => {
    event.stopPropagation();
    if (!loan) {
      return;
    }

    // Check if CSO has exceeded defaulting target before allowing new loan
    const defaultingTarget = csoAuth?.defaultingTarget || 0;
    if (defaultingTarget > 0 && totalOutstanding > defaultingTarget) {
      toast.error(
        `Cannot create loan: Your outstanding defaults (₦${totalOutstanding.toFixed(2)}) exceed your limit (₦${defaultingTarget.toFixed(2)})`,
        { duration: 5000 }
      );
      return;
    }

    // Check performance of the previous (fully paid) loan
    // Count defaults (pending status) excluding the first scheduled day
    const schedule = loan.repaymentSchedule || [];
    const defaultsCount = schedule.filter((entry, index) => index > 0 && entry.status === "pending").length;

    if (defaultsCount >= 3) {
      const dailyPayments = loan.loanDetails?.dailyPayment || [];
      
      if (dailyPayments.length > 0) {
        // Find the last payment date
        // Assuming dailyPayment is chronological, but sorting ensures accuracy
        const sortedPayments = [...dailyPayments].sort((a, b) => new Date(a.date) - new Date(b.date));
        const lastPayment = sortedPayments[sortedPayments.length - 1];
        const lastPaymentDate = new Date(lastPayment.date);

        // Calculate wait days: 3 defaults -> 7 days, 4 -> 14 days, etc.
        // Formula: (defaultsCount - 2) * 7
        const waitDays = (defaultsCount - 2) * 7;
        
        const allowedDate = new Date(lastPaymentDate);
        allowedDate.setDate(allowedDate.getDate() + waitDays);

        // Normalize dates to midnight for accurate comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        allowedDate.setHours(0, 0, 0, 0);

        if (today < allowedDate) {
          const formattedDate = allowedDate.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          toast.error(
            `Cannot create loan yet. Customer had ${defaultsCount} defaults. Eligibility date: ${formattedDate}`,
            { duration: 6000 }
          );
          return;
        }
      }
    }

    navigate(`/cso/loans/${loan._id}/new-loan`, { state: { previousLoan: loan } });
  };

  const handleViewCustomerHistory = (bvn) => {
    if (!bvn) {
      toast.error("Customer BVN unavailable");
      return;
    }

    setLoanStatusModal(null);
    navigate(`/cso/customers/${bvn}/loans`);
  };

  const renderLoanCard = (loan) => {
    const customer = loan?.customerDetails || {};
    const business = loan?.businessDetails || {};
    const businessImage = resolveAssetUrl(loan?.pictures?.customer) || resolveAssetUrl(loan?.pictures?.business);
    const statusLabel = loan?.status || "waiting for approval";
    const statusClass = getStatusBadgeClass(statusLabel);

    return (
      <article
        key={loan?._id || loan?.loanId}
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        onClick={() => handleLoanCardClick(loan)}
      >
        <div className="relative aspect-square w-full">
          <div
            className="absolute inset-0"
            style={
              businessImage
                ? {
                    backgroundImage: `linear-gradient(200deg, rgba(15,23,42,0.6), rgba(15,23,42,0.05)), url(${businessImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : { backgroundColor: "#e2e8f0" }
            }
          />
          <span
            className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-2 py-2 text-xs uppercase tracking-wide shadow sm:px-3 sm:py-1"
            aria-label={`Loan status: ${statusLabel}`}
          >
            <span className={`h-3.5 w-3.5 rounded-full ${statusClass}`} />
            <span className="hidden font-semibold text-slate-700 sm:inline">{statusLabel}</span>
          </span>
        </div>

        <div className="space-y-2 p-4">
          <h3 className="text-sm font-semibold leading-tight text-slate-900">
            {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unnamed customer"}
          </h3>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {business.natureOfBusiness || business.businessName || "Business type unavailable"}
          </p>
          <p className="text-xs font-semibold text-slate-600">
            Loan type: <span className="capitalize">{loan?.loanDetails?.loanType || "—"}</span>
          </p>
          {statusLabel === "fully paid" && (
            <button
              type="button"
              onClick={(event) => handleGiveNewLoan(event, loan)}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Sparkles className="h-3.5 w-3.5" /> Give new loan
            </button>
          )}
          {loan?.customerDetails?.bvn && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleViewCustomerHistory(loan.customerDetails.bvn);
              }}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600"
            >
              <ListChecks className="h-3.5 w-3.5" /> Loan history
            </button>
          )}
        </div>
      </article>
    );
  };

  const totalLoans = loansPagination?.total ?? loans.length;
  const totalPages = Math.max(1, loansPagination?.totalPages ?? 1);
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const rangeStart = totalLoans === 0 ? 0 : (page - 1) * currentPageSize + 1;
  const rangeEnd = totalLoans === 0 ? 0 : Math.min(totalLoans, rangeStart + loans.length - 1);

  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(1, prevPage - 1));
  };

  const handleNextPage = () => {
    setPage((prevPage) => Math.min(totalPages, prevPage + 1));
  };

  const handleGoToPage = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const target = Number(formData.get("page"));

    if (Number.isFinite(target) && target >= 1 && target <= totalPages) {
      setPage(target);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleGroupFilterChange = (event) => {
    setGroupFilter(event.target.value);
  };

  return (
    <div className="space-y-10 relative">
      {/* Blocking Modal for Missing Remittance */}
      {showBlockingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Action Required</h2>
            {blockingModalType === "missing" ? (
              <p className="text-slate-600">
                You did not submit remittance for {formatRemittanceDateLabel(pendingRemittanceDate)}.
                Please contact the admin immediately to resolve this issue.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-600">
                  Your remittance for {formatRemittanceDateLabel(pendingRemittanceDate)} is incomplete. Please
                  complete the payment to continue.
                </p>
                <button
                  onClick={() => navigate("/cso/collections")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Go to Remittance Page
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Your loan submissions</h1>
          <p className="text-sm text-slate-500">Review your customers and follow up approvals.</p>
        </div>
        {/* <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />
          Submit new loan
        </button> */}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          {loading ? (
            <span className="inline-flex items-center gap-2 text-indigo-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching loans...
            </span>
          ) : (
            <span>
              {totalLoans === 0
                ? "No loans found"
                : `${loans.length.toLocaleString("en-NG")} loan(s) on this page • Total: ${totalLoans.toLocaleString("en-NG")}`}
            </span>
          )}
        </div>

        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="loan-search">
              Search loans
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="loan-search"
                type="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by customer, loan ID, BVN, business..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="loan-group-filter">
              Group leader
            </label>
            <div className="relative mt-2">
              <select
                id="loan-group-filter"
                value={groupFilter}
                onChange={handleGroupFilterChange}
                className="w-full appearance-none rounded-lg border border-slate-200 py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">All group leaders</option>
                <option value="ungrouped">Ungrouped</option>
                {groupLeaders.map((leader) => (
                  <option key={leader._id} value={leader._id}>
                    {leader.groupName || `${leader.firstName || ""} ${leader.lastName || ""}`.trim() || "Unnamed group"}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Use the filters to narrow loans on the current page. Navigate pages to review more results.
            </div>
          </div>
        </div>

        {loans.length === 0 && !loading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
            <p className="text-base font-medium">No loans submitted yet.</p>
            <p className="text-sm">Use the button above to submit your first loan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loans.map(renderLoanCard)}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Page <span className="font-semibold text-slate-700">{page}</span> of {totalPages.toLocaleString("en-NG")}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={!canGoPrev}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={!canGoNext}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
              <form className="flex items-center gap-2" onSubmit={handleGoToPage}>
                <label htmlFor="goto-page" className="text-sm text-slate-500">
                  Go to page
                </label>
                <input
                  id="goto-page"
                  name="page"
                  type="number"
                  min="1"
                  max={totalPages}
                  defaultValue={page}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Go
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {loanStatusModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setLoanStatusModal(null)}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <button
                type="button"
                onClick={() => setLoanStatusModal(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close status modal"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center gap-4 text-center text-slate-600">
                <div className="rounded-full bg-slate-100 p-4">{loanStatusModal.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{loanStatusModal.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed">{loanStatusModal.message}</p>
                </div>
                {loanStatusModal.context === "edit" && (
                  <div className="flex w-full flex-col gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                      onClick={() => {
                        setLoanStatusModal(null);
                        beginLoanEdit(editingLoanSnapshot || loans.find((loan) => loan._id === loanStatusModal.loanId));
                      }}
                    >
                      <FileText className="h-4 w-4" /> Edit loan now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            aria-hidden="true"
            onClick={closeModal}
          />

          <div className="absolute inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-6">
              <div className="relative w-full max-w-5xl rounded-3xl bg-white p-6 shadow-xl">
                <div className="sticky -top-6 mb-4 flex items-center justify-between rounded-3xl bg-white/90 px-4 py-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Submit a new loan</h2>
                    <p className="text-sm text-slate-500">
                      Capture borrower, business, and guarantor details. Form amount is fixed at ₦2,000.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Close loan submission form"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>
                  <div className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-xs font-medium text-slate-500">
                    {STEP_ITEMS.map((item) => (
                      <div key={item.id} className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold sm:h-7 sm:w-7 ${
                            currentStep === item.id
                              ? "bg-indigo-600 text-white"
                              : item.id < currentStep
                              ? "bg-indigo-100 text-indigo-600"
                              : "bg-white text-slate-400"
                          }`}
                        >
                          {item.id}
                        </div>
                        <div className="hidden text-center sm:block sm:text-left">
                          <p className="font-semibold text-slate-700">{item.title}</p>
                          <p className="text-[11px] text-slate-500">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {currentStep === 1 && (
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">Customer information</h2>
                          <p className="text-sm text-slate-500">Provide the borrower’s personal details and next of kin.</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {CUSTOMER_FIELDS.map((field) => (
                            <div key={field.key} className={field.colSpan ? "sm:col-span-2" : undefined}>
                              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor={`customer-${field.key}`}>
                                {field.label}
                                <input
                                  id={`customer-${field.key}`}
                                  type={field.type}
                                  value={form.customerDetails[field.key]}
                                  onChange={handleNestedChange("customerDetails", field.key)}
                                  placeholder={field.placeholder}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Group Leader Selection */}
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">Group Leader</h2>
                          <p className="text-sm text-slate-500">Select an approved group leader if applicable.</p>
                        </div>
                        <div className="space-y-2">
                          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                            Select Group Leader (Optional)
                            <select
                              value={form.groupDetails.groupId}
                              onChange={(e) => handleGroupLeaderChange(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                              <option value="">Select a group leader...</option>
                              {loadingGroupLeaders ? (
                                <option disabled>Loading group leaders...</option>
                              ) : (
                                groupLeaders.map((leader) => (
                                  <option key={leader._id} value={leader._id}>
                                    {leader.groupName} - {leader.firstName} {leader.lastName}
                                  </option>
                                ))
                              )}
                            </select>
                          </label>
                          {form.groupDetails.groupId && (
                            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                              <p><strong>Group:</strong> {form.groupDetails.groupName}</p>
                              <p><strong>Leader:</strong> {form.groupDetails.leaderName}</p>
                              <p><strong>Phone:</strong> {form.groupDetails.mobileNo}</p>
                              <p><strong>Address:</strong> {form.groupDetails.address}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">Business details</h2>
                          <p className="text-sm text-slate-500">Outline the business operations and history.</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {BUSINESS_FIELDS.map((field) => (
                            <div key={field.key} className={field.colSpan ? "sm:col-span-2" : undefined}>
                              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor={`business-${field.key}`}>
                                {field.label}
                                <input
                                  id={`business-${field.key}`}
                                  type={field.type}
                                  min={field.min}
                                  value={form.businessDetails[field.key]}
                                  onChange={handleNestedChange("businessDetails", field.key)}
                                  placeholder={field.placeholder}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">Guarantor details</h2>
                          <p className="text-sm text-slate-500">Provide guarantor contacts and relationship.</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {GUARANTOR_FIELDS.map((field) => (
                            <div key={field.key} className={field.colSpan ? "sm:col-span-2" : undefined}>
                              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor={`guarantor-${field.key}`}>
                                {field.label}
                                <input
                                  id={`guarantor-${field.key}`}
                                  type={field.type}
                                  min={field.min}
                                  value={form.guarantorDetails[field.key]}
                                  onChange={handleNestedChange("guarantorDetails", field.key)}
                                  placeholder={field.placeholder}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">Bank details</h2>
                          <p className="text-sm text-slate-500">Settlement account for approved disbursement.</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {BANK_FIELDS.map((field) => (
                            <div key={field.key} className={field.colSpan ? "sm:col-span-2" : undefined}>
                              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor={`bank-${field.key}`}>
                                {field.label}
                                <input
                                  id={`bank-${field.key}`}
                                  type={field.type}
                                  inputMode={field.inputMode}
                                  value={form.bankDetails[field.key]}
                                  onChange={handleNestedChange("bankDetails", field.key)}
                                  placeholder={field.placeholder}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">Loan details</h2>
                          <p className="text-sm text-slate-500">Provide request specifics alongside supporting assets.</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="loan-amountRequested">
                            Amount requested (₦)
                            <input
                              id="loan-amountRequested"
                              type="number"
                              min="0"
                              value={form.loanDetails.amountRequested}
                              onChange={handleNestedChange("loanDetails", "amountRequested")}
                              placeholder="0"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                          </label>

                          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="loan-loanType">
                            Loan type
                            <select
                              id="loan-loanType"
                              value={form.loanDetails.loanType}
                              onChange={handleNestedChange("loanDetails", "loanType")}
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                              {LOAN_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          {/* <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="loan-amountToBePaid">
                            Amount to be paid (₦)
                            <input
                              id="loan-amountToBePaid"
                              type="number"
                              min="0"
                              value={form.loanDetails.amountToBePaid}
                              onChange={handleNestedChange("loanDetails", "amountToBePaid")}
                              placeholder="Optional"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                          </label>

                          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="loan-dailyAmount">
                            Daily/weekly amount (₦)
                            <input
                              id="loan-dailyAmount"
                              type="number"
                              min="0"
                              value={form.loanDetails.dailyAmount}
                              onChange={handleNestedChange("loanDetails", "dailyAmount")}
                              placeholder="Optional"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                          </label> */}
                        </div>
                      </div>

                      <div className="space-y-4 lg:col-span-2">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">Uploads</h2>
                          <p className="text-sm text-slate-500">Attach supporting photos and signatures. Uploaded files are stored and linked to this loan.</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {MEDIA_UPLOAD_KEYS.map((key) => {
                            const config = MEDIA_UPLOAD_CONFIG[key];
                            const currentUrl = form.pictures[key];
                            const isProcessing = activeUploadTarget === key;

                            return (
                              <div key={key} className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-sm font-semibold text-slate-800">{config.label}</p>
                                <p className="mb-3 text-xs text-slate-500">{config.description}</p>

                                {currentUrl ? (
                                  <div className="space-y-3">
                                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                      <img
                                        src={resolveAssetUrl(currentUrl)}
                                        alt={`${config.label} upload`}
                                        className="h-32 w-full object-cover"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeUploadedMedia(key)}
                                      className="text-xs font-semibold text-rose-600 hover:underline"
                                      disabled={isUploading}
                                    >
                                      Remove and re-upload
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50">
                                    <span className="text-xs font-semibold text-indigo-600">Click to upload</span>
                                    <span className="text-[11px] text-slate-500">JPG, PNG, or PDF files allowed</span>
                                    <input
                                      type="file"
                                      accept="image/*,application/pdf"
                                      className="hidden"
                                      onChange={(event) => handleUpload(event, key, config.folder)}
                                      disabled={isUploading}
                                    />
                                  </label>
                                )}

                                {isProcessing && (
                                  <p className="mt-2 text-xs text-indigo-600">Uploading...</p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">Customer signature</p>
                                <p className="text-xs text-slate-500">Draw the customer’s signature directly on the pad.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => clearSignaturePad(customerSignatureRef)}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                              >
                                Clear
                              </button>
                            </div>

                            <SignatureCanvas
                              ref={customerSignatureRef}
                              penColor="#111827"
                              canvasProps={{ className: "h-40 w-full rounded-xl border border-slate-200 bg-white" }}
                            />

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSignatureUpload(customerSignatureRef, {
                                    uploadKey: "signature",
                                    applyToForm: (prev, url) => ({
                                      ...prev,
                                      pictures: {
                                        ...prev.pictures,
                                        signature: url,
                                      },
                                    }),
                                  })
                                }
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                                disabled={isUploading}
                              >
                                Upload signature
                              </button>
                              {form.pictures.signature && (
                                <button
                                  type="button"
                                  onClick={() => removeSignature("customer")}
                                  className="text-xs font-semibold text-rose-600 hover:underline"
                                  disabled={isUploading}
                                >
                                  Remove uploaded signature
                                </button>
                              )}
                            </div>

                            {form.pictures.signature && (
                              <p className="text-[11px] text-slate-500">Uploaded to: {form.pictures.signature}</p>
                            )}
                          </div>

                          <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">Guarantor signature</p>
                                <p className="text-xs text-slate-500">Capture the guarantor’s consent. This will be stored with the loan.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => clearSignaturePad(guarantorSignatureRef)}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                              >
                                Clear
                              </button>
                            </div>

                            <SignatureCanvas
                              ref={guarantorSignatureRef}
                              penColor="#111827"
                              canvasProps={{ className: "h-40 w-full rounded-xl border border-slate-200 bg-white" }}
                            />

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSignatureUpload(guarantorSignatureRef, {
                                    uploadKey: "guarantor-signature",
                                    applyToForm: (prev, url) => ({
                                      ...prev,
                                      guarantorDetails: {
                                        ...prev.guarantorDetails,
                                        signature: url,
                                      },
                                    }),
                                  })
                                }
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                                disabled={isUploading}
                              >
                                Upload signature
                              </button>
                              {form.guarantorDetails.signature && (
                                <button
                                  type="button"
                                  onClick={() => removeSignature("guarantor")}
                                  className="text-xs font-semibold text-rose-600 hover:underline"
                                  disabled={isUploading}
                                >
                                  Remove uploaded signature
                                </button>
                              )}
                            </div>

                            {form.guarantorDetails.signature && (
                              <p className="text-[11px] text-slate-500">Uploaded to: {form.guarantorDetails.signature}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === REVIEW_STEP && (
                    <div className="space-y-6">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                        <h2 className="text-lg font-semibold text-slate-900">Review loan application</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Confirm each section. Use the edit buttons to jump back and adjust any information.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <ReviewSection
                          title="Customer & group"
                          description="Personal details and group affiliation"
                          onEdit={() => setCurrentStep(1)}
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <ReviewItem label="First name" value={displayText(loanPayload.customerDetails.firstName)} />
                            <ReviewItem label="Last name" value={displayText(loanPayload.customerDetails.lastName)} />
                            <ReviewItem label="Date of birth" value={displayText(loanPayload.customerDetails.dateOfBirth)} />
                            <ReviewItem label="Phone" value={displayText(loanPayload.customerDetails.phoneOne)} />
                            <ReviewItem label="Address" value={displayText(loanPayload.customerDetails.address)} className="sm:col-span-2" />
                            <ReviewItem label="NIN" value={displayText(loanPayload.customerDetails.bvn)} />
                            <ReviewItem label="Next of kin" value={displayText(loanPayload.customerDetails.NextOfKin)} />
                            <ReviewItem label="Next of kin phone" value={displayText(loanPayload.customerDetails.NextOfKinNumber)} />
                            <ReviewItem label="Group" value={displayText(loanPayload.groupDetails.groupName)} />
                            <ReviewItem label="Group leader" value={displayText(loanPayload.groupDetails.leaderName)} />
                          </div>
                        </ReviewSection>

                        <ReviewSection
                          title="Business & guarantor"
                          description="Operational summary and guarantor"
                          onEdit={() => setCurrentStep(2)}
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <ReviewItem label="Business name" value={displayText(loanPayload.businessDetails.businessName)} />
                            <ReviewItem label="Nature of business" value={displayText(loanPayload.businessDetails.natureOfBusiness)} />
                            <ReviewItem label="Business address" value={displayText(loanPayload.businessDetails.address)} className="sm:col-span-2" />
                            <ReviewItem label="Years at location" value={displayText(loanPayload.businessDetails.yearsHere)} />
                            <ReviewItem label="Name recognition" value={displayText(loanPayload.businessDetails.nameKnown)} />
                            <ReviewItem label="Estimated value" value={formatCurrencyValue(loanPayload.businessDetails.estimatedValue)} />
                            <ReviewItem label="Guarantor name" value={displayText(loanPayload.guarantorDetails.name)} />
                            <ReviewItem label="Guarantor phone" value={displayText(loanPayload.guarantorDetails.phone)} />
                            <ReviewItem label="Guarantor address" value={displayText(loanPayload.guarantorDetails.address)} className="sm:col-span-2" />
                            <ReviewItem label="Relationship" value={displayText(loanPayload.guarantorDetails.relationship)} />
                            <ReviewItem label="Years known" value={displayText(loanPayload.guarantorDetails.yearsKnown)} />
                          </div>
                        </ReviewSection>

                        <ReviewSection
                          title="Bank & loan details"
                          description="Financial destination and request summary"
                          onEdit={() => setCurrentStep(3)}
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <ReviewItem label="Account name" value={displayText(loanPayload.bankDetails.accountName)} />
                            <ReviewItem label="Bank name" value={displayText(loanPayload.bankDetails.bankName)} />
                            <ReviewItem label="Account number" value={displayText(loanPayload.bankDetails.accountNo)} />
                            <ReviewItem label="Loan type" value={displayText(loanPayload.loanDetails.loanType)} />
                            <ReviewItem label="Amount requested" value={formatCurrencyValue(loanPayload.loanDetails.amountRequested)} />
                            <ReviewItem label="Amount to be paid" value={formatCurrencyValue(loanPayload.loanDetails.amountToBePaid)} />
                            <ReviewItem label="Daily/weekly amount" value={formatCurrencyValue(loanPayload.loanDetails.dailyAmount)} />
                          </div>
                        </ReviewSection>

                        <ReviewSection
                          title="Supporting documents"
                          description="Uploaded media and signatures"
                          onEdit={() => setCurrentStep(3)}
                        >
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {MEDIA_UPLOAD_KEYS.map((key) => {
                              const config = MEDIA_UPLOAD_CONFIG[key];
                              const currentUrl = loanPayload.pictures[key];

                              return (
                                <div key={key} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">{config.label}</p>
                                    <p className="text-xs text-slate-500">{config.description}</p>
                                  </div>

                                  {currentUrl ? (
                                    <div className="space-y-2">
                                      <div className="overflow-hidden rounded-xl border border-slate-200">
                                        <img
                                          src={resolveAssetUrl(currentUrl)}
                                          alt={`${config.label} upload`}
                                          className="h-32 w-full object-cover"
                                        />
                                      </div>
                                      <span className="block text-[11px] text-slate-500">Uploaded</span>
                                    </div>
                                  ) : (
                                    <div className="rounded-xl border border-dashed border-rose-300 bg-rose-50/60 p-4 text-center text-xs text-rose-500">
                                      Missing upload
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                              <p className="text-sm font-semibold text-slate-800">Customer signature</p>
                              {loanPayload.pictures.signature ? (
                                <span className="text-xs text-slate-500">Captured</span>
                              ) : (
                                <span className="text-xs text-rose-500">Missing signature upload</span>
                              )}
                            </div>

                            <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                              <p className="text-sm font-semibold text-slate-800">Guarantor signature</p>
                              {loanPayload.guarantorDetails.signature ? (
                                <span className="text-xs text-slate-500">Captured</span>
                              ) : (
                                <span className="text-xs text-rose-500">Missing signature upload</span>
                              )}
                            </div>
                          </div>
                        </ReviewSection>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-slate-500">Form amount is automatically set to ₦2,000 for every loan.</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        disabled={isSubmittingFromModal || isUploading}
                      >
                        Reset form
                      </button>

                      <div className="flex items-center gap-3">
                        {currentStep > 1 && currentStep !== REVIEW_STEP && (
                          <button
                            type="button"
                            onClick={goToPreviousStep}
                            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                            disabled={isSubmittingFromModal || isUploading}
                          >
                            Previous
                          </button>
                        )}

                        {currentStep < TOTAL_STEPS && (
                          <button
                            type="button"
                            onClick={goToNextStep}
                            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                            disabled={!step1Valid || isUploading}
                          >
                            Next step
                          </button>
                        )}

                        {currentStep === TOTAL_STEPS && (
                          <button onClick={handleSubmit}
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                            disabled={isSubmitDisabled || isSubmittingFromModal}
                          >
                            {isSubmittingFromModal ? "Submitting..." : "Submit loan"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {showFabMenu && (
          <div className="absolute bottom-16 right-0 space-y-3">
            <button
              onClick={() => handleFabAction('loan')}
              className="flex items-center gap-3 rounded-lg bg-indigo-600 px-4 py-3 shadow-lg border border-slate-200 hover:bg-indigo-700 transition whitespace-nowrap"
            >
              <FileText className="h-5 w-5 text-white " />
              <span className="text-sm font-medium text-white">Submit New Loan</span>
            </button>
            <button
              onClick={() => handleFabAction('groupLeader')}
              className="flex items-center gap-3 rounded-lg bg-indigo-600 px-4 py-3 shadow-lg border border-slate-200 hover:bg-indigo-700 transition whitespace-nowrap"
            >
              <UserPlus className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">Add Group Leader</span>
            </button>
          </div>
        )}
        
        <button
          onClick={handleFabClick}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${
            showFabMenu 
              ? 'bg-rose-500 hover:bg-rose-600 rotate-45' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Group Leader Modal */}
      {showGroupLeaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div className="flex items-center gap-2 text-slate-800">
                <Users className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Add Group Leader</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupLeaderModal(false)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGroupLeaderSubmit} className="p-6 space-y-5">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Group Name</label>
                  <input
                    type="text"
                    name="groupName"
                    value={groupLeaderForm.groupName}
                    onChange={handleGroupLeaderFormChange}
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Enter group name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={groupLeaderForm.firstName}
                      onChange={handleGroupLeaderFormChange}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={groupLeaderForm.lastName}
                      onChange={handleGroupLeaderFormChange}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Address</label>
                  <textarea
                    name="address"
                    value={groupLeaderForm.address}
                    onChange={handleGroupLeaderFormChange}
                    rows={3}
                    className="mt-1 block w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Residential address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={groupLeaderForm.phone}
                    onChange={handleGroupLeaderFormChange}
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="0801 234 5678"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowGroupLeaderModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Create Group Leader
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
