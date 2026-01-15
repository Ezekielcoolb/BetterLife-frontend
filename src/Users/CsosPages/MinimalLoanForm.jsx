import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Loader2, Sparkles, Upload, PenLine, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";

import { clearLoanError, submitLoan, fetchCsoOutstandingLoans } from "../../redux/slices/loanSlice";
import { uploadImages } from "../../redux/slices/uploadSlice";
import { fetchMyApprovedGroupLeaders } from "../../redux/slices/groupLeaderSlice";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

const resolveAssetUrl = (url) => {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const createBlankCustomer = () => ({
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  phoneOne: "",
  address: "",
  bvn: "",
  NextOfKin: "",
  NextOfKinNumber: "",
});

const createBlankBusiness = () => ({
  businessName: "",
  natureOfBusiness: "",
  address: "",
  yearsHere: "",
  nameKnown: "",
  estimatedValue: "",
});

const createBlankBank = () => ({
  accountName: "",
  bankName: "",
  accountNo: "",
});

const createBlankGuarantor = () => ({
  name: "",
  address: "",
  phone: "",
  relationship: "",
  yearsKnown: "",
});

const createBlankLoanDetails = () => ({
  amountRequested: "",
  loanType: "daily",
  amountToBePaid: "",
  dailyAmount: "",
});

const createBlankPictures = () => ({
  customer: "",
  business: "",
  disclosure: "",
  signature: "",
});

const createBlankGroupDetails = () => ({
  groupId: "",
  groupName: "",
  leaderName: "",
  address: "",
  mobileNo: "",
});

const LOAN_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const BUSINESS_FIELD_CONFIG = [
  { key: "businessName", label: "Business name", type: "text" },
  {
    key: "natureOfBusiness",
    label: "Nature of business",
    type: "text",
    placeholder: "Retail, services, etc.",
  },
  {
    key: "address",
    label: "Business address",
    type: "text",
    colSpan: 2,
    placeholder: "Shop address",
  },
  { key: "yearsHere", label: "Years at location", type: "number", min: 0 },
  {
    key: "nameKnown",
    label: "How well known is the name?",
    type: "text",
    placeholder: "Popular in the market",
  },
  {
    key: "estimatedValue",
    label: "Estimated business value (₦)",
    type: "number",
    min: 0,
    placeholder: "Optional",
  },
];

const GUARANTOR_FIELD_CONFIG = [
  { key: "name", label: "Guarantor name", type: "text" },
  { key: "phone", label: "Guarantor phone", type: "tel" },
  { key: "address", label: "Guarantor address", type: "text", colSpan: 2 },
  { key: "relationship", label: "Relationship", type: "text" },
  { key: "yearsKnown", label: "Years known", type: "number", min: 0 },
];

const BANK_FIELD_CONFIG = [
  { key: "accountName", label: "Account name", type: "text" },
  { key: "bankName", label: "Bank name", type: "text" },
  {
    key: "accountNo",
    label: "Account number",
    type: "text",
    inputMode: "numeric",
    colSpan: 2,
  },
];

const CUSTOMER_SUMMARY_FIELDS = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "phoneOne", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "bvn", label: "BVN" },
  { key: "NextOfKin", label: "Next of kin" },
  { key: "NextOfKinNumber", label: "Next of kin phone" },
];

const REQUIRED_CUSTOMER_FIELDS = ["firstName", "lastName", "phoneOne", "address", "bvn", "NextOfKin", "NextOfKinNumber"];
const REQUIRED_BUSINESS_FIELDS = ["businessName", "natureOfBusiness", "address"];
const REQUIRED_BANK_FIELDS = ["accountName", "bankName", "accountNo"];
const REQUIRED_GUARANTOR_FIELDS = ["name", "address", "phone", "relationship", "yearsKnown"];

const mapSection = (template, source = {}) => {
  return Object.keys(template).reduce((acc, key) => {
    const value = source?.[key];

    if (value === null || value === undefined) {
      acc[key] = "";
      return acc;
    }

    if (typeof value === "number") {
      acc[key] = Number.isFinite(value) ? String(value) : "";
      return acc;
    }

    if (typeof value === "string") {
      acc[key] = value;
      return acc;
    }

    acc[key] = "";
    return acc;
  }, {});
};

const buildInitialForm = (previousLoan) => {
  const customerTemplate = createBlankCustomer();
  const businessTemplate = createBlankBusiness();
  const bankTemplate = createBlankBank();
  const guarantorTemplate = createBlankGuarantor();
  const loanTemplate = createBlankLoanDetails();
  const picturesTemplate = createBlankPictures();
  const groupTemplate = createBlankGroupDetails();

  if (!previousLoan) {
    return {
      customerDetails: customerTemplate,
      businessDetails: businessTemplate,
      bankDetails: bankTemplate,
      guarantorDetails: guarantorTemplate,
      loanDetails: loanTemplate,
      pictures: picturesTemplate,
      groupDetails: groupTemplate,
    };
  }

  return {
    customerDetails: mapSection(customerTemplate, previousLoan.customerDetails),
    businessDetails: mapSection(businessTemplate, previousLoan.businessDetails),
    bankDetails: mapSection(bankTemplate, previousLoan.bankDetails),
    guarantorDetails: mapSection(guarantorTemplate, previousLoan.guarantorDetails),
    loanDetails: {
      ...loanTemplate,
      loanType: previousLoan?.loanDetails?.loanType || loanTemplate.loanType,
    },
    pictures: mapSection(picturesTemplate, previousLoan.pictures),
    groupDetails: mapSection(groupTemplate, previousLoan.groupDetails || groupTemplate),
  };
};

const toNumberOrUndefined = (value) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const trimOrUndefined = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export default function MinimalLoanForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: loanId } = useParams();

  const previousLoan = location.state?.previousLoan;

  const { submitting, error } = useSelector((state) => state.loan);
  const { imageUploadLoading } = useSelector((state) => state.upload);
  const groupLeaders = useSelector((state) => state.groupLeader.items);
  const loadingGroupLeaders = useSelector((state) => state.groupLeader.loading);
  const { cso: csoAuth } = useSelector((state) => state.csoAuth);
  const { totalOutstanding } = useSelector((state) => state.loan);

  const [form, setForm] = useState(() => buildInitialForm(previousLoan));
  const [activeUploadTarget, setActiveUploadTarget] = useState(null);

  const customerSignatureRef = useRef(null);
  const guarantorSignatureRef = useRef(null);

  useEffect(() => {
    if (!previousLoan) {
      toast.error("Loan information missing. Please start from a fully paid loan card.");
      navigate("/cso/home", { replace: true });
    }
  }, [previousLoan, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearLoanError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (previousLoan) {
      setForm(buildInitialForm(previousLoan));
    }
  }, [previousLoan]);

  // Fetch approved group leaders and outstanding loans
  useEffect(() => {
    dispatch(fetchMyApprovedGroupLeaders());
    dispatch(fetchCsoOutstandingLoans());
  }, [dispatch]);

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

  const customerName = useMemo(() => {
    const customer = previousLoan?.customerDetails || {};
    return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer";
  }, [previousLoan]);

  const handleSectionChange = (section, field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
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

  const removeUploadedMedia = (key) => {
    setForm((prev) => ({
      ...prev,
      pictures: {
        ...prev.pictures,
        [key]: "",
      },
    }));
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

  const validateSection = (sectionData, requiredKeys, label) => {
    const missing = requiredKeys.filter((key) => {
      const candidate = sectionData?.[key];
      return !(typeof candidate === "string" ? candidate.trim().length > 0 : Boolean(candidate));
    });

    if (missing.length) {
      return `${label}: ${missing.join(", ")}`;
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const missingMessages = [
      validateSection(form.businessDetails, REQUIRED_BUSINESS_FIELDS, "Business details"),
      validateSection(form.bankDetails, REQUIRED_BANK_FIELDS, "Bank details"),
      validateSection(form.guarantorDetails, REQUIRED_GUARANTOR_FIELDS, "Guarantor details"),
    ].filter(Boolean);

    const amountRequested = toNumberOrUndefined(form.loanDetails.amountRequested);
    const yearsKnown = toNumberOrUndefined(form.guarantorDetails.yearsKnown);

    if (!amountRequested || amountRequested <= 0) {
      missingMessages.push("Enter a valid amount requested");
    }

    if (yearsKnown === undefined || yearsKnown < 0) {
      missingMessages.push("Guarantor years known must be zero or more");
    }

    const uploadIssues = REQUIRED_UPLOAD_KEYS.filter((key) => !form.pictures[key] || !form.pictures[key]?.trim());
    if (uploadIssues.length) {
      missingMessages.push(`Uploads required for: ${uploadIssues.join(", ")}`);
    }

    if (!form.pictures.signature?.trim()) {
      missingMessages.push("Customer signature is required");
    }

    if (!form.guarantorDetails.signature?.trim()) {
      missingMessages.push("Guarantor signature is required");
    }

    if (missingMessages.length) {
      toast.error(missingMessages.join(". "));
      return;
    }

    // Check if CSO has exceeded defaulting target
    const defaultingTarget = csoAuth?.defaultingTarget || 0;
    if (defaultingTarget > 0 && totalOutstanding > defaultingTarget) {
      toast.error(
        `Cannot create loan: Your outstanding defaults (₦${totalOutstanding.toFixed(2)}) exceed your limit (₦${defaultingTarget.toFixed(2)})`,
        { duration: 5000 }
      );
      return;
    }

    const businessYears = toNumberOrUndefined(form.businessDetails.yearsHere);
    const estimatedValue = toNumberOrUndefined(form.businessDetails.estimatedValue);
    const amountToBePaid = toNumberOrUndefined(form.loanDetails.amountToBePaid);
    const dailyAmount = toNumberOrUndefined(form.loanDetails.dailyAmount);

    const sanitizedPictures = Object.entries(form.pictures).reduce((acc, [key, value]) => {
      if (typeof value === "string" && value.trim()) {
        acc[key] = value.trim();
      }

      return acc;
    }, {});

    const payload = {
      customerDetails: {
        firstName: form.customerDetails.firstName.trim(),
        lastName: form.customerDetails.lastName.trim(),
        dateOfBirth: trimOrUndefined(form.customerDetails.dateOfBirth),
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
        signature: form.guarantorDetails.signature.trim(),
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

    try {
      await dispatch(submitLoan(payload)).unwrap();
      toast.success("New loan submitted successfully");
      navigate(`/cso/loans/${loanId}`);
    } catch (submissionError) {
      const message = typeof submissionError === "string" ? submissionError : "Unable to submit loan";
      toast.error(message);
    }
  };

  const isUploading = imageUploadLoading || Boolean(activeUploadTarget);
  const isSubmitDisabled = submitting || isUploading;

  if (!previousLoan) {
    return null;
  }

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
          Re-loan for:
          <span>{customerName}</span>
        </span>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Issue another loan</h1>
            <p className="text-sm text-slate-500">Borrower information is read-only. Update business, guarantor, bank, and loan details before submitting.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            <Sparkles className="h-3.5 w-3.5" /> Repeat borrower
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {CUSTOMER_SUMMARY_FIELDS.map(({ key, label }) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {form.customerDetails[key] && form.customerDetails[key].toString().trim() ? form.customerDetails[key] : "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Business details</h2>
              <p className="text-sm text-slate-500">Update the borrower's business information if anything has changed.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {BUSINESS_FIELD_CONFIG.map((field) => (
                <label
                  key={field.key}
                  className={`flex flex-col gap-2 text-sm font-medium text-slate-700 ${field.colSpan ? "sm:col-span-2" : ""}`}
                  htmlFor={`business-${field.key}`}
                >
                  {field.label}
                  <input
                    id={`business-${field.key}`}
                    type={field.type}
                    min={field.min}
                    placeholder={field.placeholder}
                    value={form.businessDetails[field.key]}
                    onChange={handleSectionChange("businessDetails", field.key)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Guarantor details</h2>
              <p className="text-sm text-slate-500">Verify the guarantor's information and relationship to the borrower.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {GUARANTOR_FIELD_CONFIG.map((field) => (
                <label
                  key={field.key}
                  className={`flex flex-col gap-2 text-sm font-medium text-slate-700 ${field.colSpan ? "sm:col-span-2" : ""}`}
                  htmlFor={`guarantor-${field.key}`}
                >
                  {field.label}
                  <input
                    id={`guarantor-${field.key}`}
                    type={field.type}
                    min={field.min}
                    value={form.guarantorDetails[field.key]}
                    onChange={handleSectionChange("guarantorDetails", field.key)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
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

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Bank details</h2>
              <p className="text-sm text-slate-500">Provide the account that will receive disbursement.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {BANK_FIELD_CONFIG.map((field) => (
                <label
                  key={field.key}
                  className={`flex flex-col gap-2 text-sm font-medium text-slate-700 ${field.colSpan ? "sm:col-span-2" : ""}`}
                  htmlFor={`bank-${field.key}`}
                >
                  {field.label}
                  <input
                    id={`bank-${field.key}`}
                    type={field.type}
                    inputMode={field.inputMode}
                    value={form.bankDetails[field.key]}
                    onChange={handleSectionChange("bankDetails", field.key)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Loan details</h2>
              <p className="text-sm text-slate-500">Capture the requested amount and repayment structure for the new loan.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="loan-amountRequested">
                Amount requested (₦)
                <input
                  id="loan-amountRequested"
                  type="number"
                  min="0"
                  value={form.loanDetails.amountRequested}
                  onChange={handleSectionChange("loanDetails", "amountRequested")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="loan-loanType">
                Loan type
                <select
                  id="loan-loanType"
                  value={form.loanDetails.loanType}
                  onChange={handleSectionChange("loanDetails", "loanType")}
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
                Total amount to be paid (₦)
                <input
                  id="loan-amountToBePaid"
                  type="number"
                  min="0"
                  value={form.loanDetails.amountToBePaid}
                  onChange={handleSectionChange("loanDetails", "amountToBePaid")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="loan-dailyAmount">
                Daily/weekly installment (₦)
                <input
                  id="loan-dailyAmount"
                  type="number"
                  min="0"
                  value={form.loanDetails.dailyAmount}
                  onChange={handleSectionChange("loanDetails", "dailyAmount")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label> */}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Required uploads</h2>
                <p className="text-sm text-slate-500">Provide supporting photos and documents for this follow-up loan.</p>
              </div>
              {isUploading && (
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {MEDIA_UPLOAD_KEYS.map((key) => {
                const config = MEDIA_UPLOAD_CONFIG[key];
                const currentUrl = form.pictures[key];
                const isProcessing = activeUploadTarget === key;
                const resolvedUrl = resolveAssetUrl(currentUrl);

                return (
                  <div key={key} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-800">{config.label}</p>
                    <p className="mb-3 text-xs text-slate-500">{config.description}</p>

                    {resolvedUrl ? (
                      <div className="space-y-3">
                        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <img src={resolvedUrl} alt={`${config.label} upload`} className="h-32 w-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUploadedMedia(key)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                          disabled={isUploading || submitting}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove & re-upload
                        </button>
                      </div>
                    ) : (
                      <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50">
                        <Upload className="h-4 w-4 text-indigo-500" />
                        <span className="text-xs font-semibold text-indigo-600">Click to upload</span>
                        <span className="text-[11px] text-slate-500">JPG, PNG, or PDF</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(event) => handleUpload(event, key, config.folder)}
                          disabled={isUploading || submitting}
                        />
                      </label>
                    )}

                    {isProcessing && (
                      <p className="mt-2 text-xs text-indigo-600">Processing upload...</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Signatures</h2>
              <p className="text-sm text-slate-500">Capture fresh signatures for the customer and guarantor to authorize the new loan.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenLine className="h-4 w-4 text-indigo-500" />
                    <p className="text-sm font-semibold text-slate-800">Customer signature</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => clearSignaturePad(customerSignatureRef)}
                    className="text-xs font-semibold text-slate-500 transition hover:text-slate-700"
                    disabled={isUploading || submitting}
                  >
                    Clear pad
                  </button>
                </div>

                <SignatureCanvas
                  ref={customerSignatureRef}
                  penColor="#111827"
                  canvasProps={{ className: "h-40 w-full rounded-xl border border-slate-200 bg-white" }}
                />

                <div className="flex flex-wrap items-center gap-2">
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
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                    disabled={isUploading || submitting}
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload signature
                  </button>

                  {form.pictures.signature && (
                    <button
                      type="button"
                      onClick={() => removeSignature("customer")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                      disabled={isUploading || submitting}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove uploaded
                    </button>
                  )}
                </div>

                {form.pictures.signature && (
                  <p className="text-[11px] text-slate-500">Stored at: {form.pictures.signature}</p>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenLine className="h-4 w-4 text-indigo-500" />
                    <p className="text-sm font-semibold text-slate-800">Guarantor signature</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => clearSignaturePad(guarantorSignatureRef)}
                    className="text-xs font-semibold text-slate-500 transition hover:text-slate-700"
                    disabled={isUploading || submitting}
                  >
                    Clear pad
                  </button>
                </div>

                <SignatureCanvas
                  ref={guarantorSignatureRef}
                  penColor="#111827"
                  canvasProps={{ className: "h-40 w-full rounded-xl border border-slate-200 bg-white" }}
                />

                <div className="flex flex-wrap items-center gap-2">
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
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                    disabled={isUploading || submitting}
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload signature
                  </button>

                  {form.guarantorDetails.signature && (
                    <button
                      type="button"
                      onClick={() => removeSignature("guarantor")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                      disabled={isUploading || submitting}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove uploaded
                    </button>
                  )}
                </div>

                {form.guarantorDetails.signature && (
                  <p className="text-[11px] text-slate-500">Stored at: {form.guarantorDetails.signature}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
              disabled={isSubmitDisabled}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {submitting ? "Submitting..." : "Submit new loan"}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/cso/loans/${loanId}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              disabled={submitting || isUploading}
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
