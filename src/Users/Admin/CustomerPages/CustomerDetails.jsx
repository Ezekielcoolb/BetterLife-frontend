import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileUser,
  Building,
  CreditCard,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import {
  fetchCustomerDetailsByBvn,
  clearAdminLoanErrors,
} from "../../../redux/slices/adminLoanSlice";

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_error) {
    return value;
  }
};

export default function CustomerDetails() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bvn } = useParams();
  const downloadSectionRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    customerDetailsRecord,
    customerDetailsLoading,
    customerDetailsError,
  } = useSelector((state) => state.adminLoans);

  useEffect(() => {
    if (!bvn) {
      toast.error("Customer BVN is required");
      navigate("/admin/customers", { replace: true });
      return;
    }

    dispatch(fetchCustomerDetailsByBvn(bvn));
  }, [dispatch, bvn, navigate]);

  useEffect(() => {
    if (customerDetailsError) {
      toast.error(customerDetailsError);
      dispatch(clearAdminLoanErrors());
    }
  }, [customerDetailsError, dispatch]);

  const URL = "http://localhost:5000";
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return value;
    }
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(numeric);
  };

  const customerInfo = useMemo(() => {
    const details = customerDetailsRecord?.customerDetails || {};
    return [
      { label: "First name", value: details.firstName },
      { label: "Last name", value: details.lastName },
      { label: "Phone", value: details.phoneOne },
      { label: "Address", value: details.address },
      { label: "Date of birth", value: details.dateOfBirth },
      { label: "NIN", value: details.bvn },
      // { label: "NIN", value: details.nin },
      { label: "Next of kin", value: details.NextOfKin },
      { label: "Next of kin phone", value: details.NextOfKinNumber },
    ];
  }, [customerDetailsRecord]);

  const businessInfo = useMemo(() => {
    const details = customerDetailsRecord?.businessDetails || {};
    return [
      { label: "Business name", value: details.businessName },
      { label: "Nature of business", value: details.natureOfBusiness },
      { label: "Business address", value: details.address },
      { label: "Years at location", value: details.yearsHere },
      { label: "Name known", value: details.nameKnown },
      { label: "Estimated value", value: details.estimatedValue },
    ];
  }, [customerDetailsRecord]);

  const bankInfo = useMemo(() => {
    const details = customerDetailsRecord?.bankDetails || {};
    return [
      { label: "Account name", value: details.accountName },
      { label: "Bank name", value: details.bankName },
      { label: "Account number", value: details.accountNo },
    ];
  }, [customerDetailsRecord]);

  const guarantorInfo = useMemo(() => {
    const details = customerDetailsRecord?.guarantorDetails || {};
    return [
      { label: "Name", value: details.name },
      { label: "Relationship", value: details.relationship },
      { label: "Phone", value: details.phone },
      { label: "Address", value: details.address },
      { label: "Years known", value: details.yearsKnown },
    ];
  }, [customerDetailsRecord]);

  const groupInfo = useMemo(() => {
    const details = customerDetailsRecord?.groupDetails || {};
    return [
      { label: "Group Name", value: details.groupName },
      { label: "Leader Name", value: details.leaderName },
      { label: "Leader Phone", value: details.mobileNo },
      { label: "Leader Address", value: details.address },
    ];
  }, [customerDetailsRecord]);

  const csoInfo = useMemo(() => {
    const { csoDetails = {} } = customerDetailsRecord || {};
    return [
      { label: "CSO name", value: csoDetails.name },
      { label: "CSO ID", value: csoDetails.id },
      { label: "Branch", value: csoDetails.branch },
    ];
  }, [customerDetailsRecord]);

  const loanInfo = useMemo(() => {
    const details = customerDetailsRecord?.loanDetails || {};
    return [
      { label: "Amount requested", value: formatCurrency(details.amountRequested) },
      { label: "Loan type", value: details.loanType },
      { label: "Loan duration", value: details.loanDuration },
      { label: "Daily payment", value: formatCurrency(details.dailyPayment?.[0]?.amount || details.dailyPaymentAmount) },
    ];
  }, [customerDetailsRecord]);

  const pictures = customerDetailsRecord?.pictures || {};
  const mediaItems = [
    { label: "Customer photo", url: pictures.customer },
    { label: "Business photo", url: pictures.business },
    { label: "Disclosure photo", url: pictures.disclosure },
    { label: "Customer signature", url: pictures.signature },
    {
      label: "Guarantor signature",
      url: customerDetailsRecord?.guarantorDetails?.signature,
    },
    {
      label: "CSO signature",
      url: customerDetailsRecord?.csoDetails?.signature,
    },
  ].filter((item) => item.url);

  const ensureImagesLoaded = async (node) => {
    if (!node) return;

    const images = Array.from(node.querySelectorAll("img"));
    if (!images.length) return;

    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            // If already loaded
            if (img.complete && img.naturalWidth > 0) return resolve();

            const timer = setTimeout(() => {
              console.warn("Image load timeout:", img.src);
              cleanup();
              resolve();
            }, 3000); // 3 seconds per image

            const cleanup = () => {
              clearTimeout(timer);
              img.removeEventListener("load", handleResolve);
              img.removeEventListener("error", handleResolve);
            };

            const handleResolve = () => {
              cleanup();
              resolve();
            };

            img.addEventListener("load", handleResolve, { once: true });
            img.addEventListener("error", handleResolve, { once: true });
          })
      )
    );
  };

  const handleDownloadRedirect = () => {
    navigate(`/admin/customers/${bvn}/form-preview`);
  };

  const Section = ({ icon: Icon, title, items }) => (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex items-center gap-2 text-slate-800">
        <Icon className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </header>
      <dl className="grid gap-4 md:grid-cols-2">
        {items.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-800">
              {value ?? "—"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );

  const renderContent = () => {
    if (customerDetailsLoading) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      );
    }

    if (!customerDetailsRecord) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No customer details available for this BVN.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Customer NIN</p>
              <h1 className="text-2xl font-semibold text-slate-900">{bvn}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-400">Last updated</p>
              <p className="text-sm font-semibold text-slate-800">
                {formatDateTime(customerDetailsRecord.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        <Section icon={FileUser} title="Customer details" items={customerInfo} />
        <Section icon={Building} title="Business details" items={businessInfo} />
        <Section icon={CreditCard} title="Bank details" items={bankInfo} />
        <Section icon={ShieldCheck} title="Guarantor details" items={guarantorInfo} />
        <Section icon={Users} title="Group details" items={groupInfo} />
        <Section icon={UserCheck} title="CSO details" items={csoInfo} />
        <Section icon={UserCheck} title="Loan details" items={loanInfo} />

        {mediaItems.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4 text-lg font-semibold text-slate-900">
              Supporting media
            </header>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mediaItems.map(({ label, url }) => (
                <div key={label} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl border border-slate-200"
                  >
                    <img 
                      src={`${URL}${url}`} 
                      alt={label} 
                      className="h-48 w-full object-cover" 
                      crossOrigin="anonymous" 
                    />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/admin/customers")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to customers
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadRedirect}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Download customer form
            </button>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Latest submission
            </div>
          </div>
        </div>

        {customerDetailsError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>{customerDetailsError}</p>
            </div>
          </div>
        )}

        {renderContent()}
      </div>
    </>
  );
}