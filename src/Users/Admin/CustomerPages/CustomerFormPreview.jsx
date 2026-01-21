import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";
import {
  ArrowLeft,
  Loader2,
  Download,
} from "lucide-react";
import {
  fetchCustomerDetailsByBvn,
  clearAdminLoanErrors,
} from "../../../redux/slices/adminLoanSlice";

export default function CustomerFormPreview() {
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

  const formatDateTime = (value) => {
    if (!value) return "—";
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

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(numeric);
  };

  const ensureImagesLoaded = async (node) => {
    if (!node) return;
    const images = Array.from(node.querySelectorAll("img"));
    if (!images.length) return;

    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) return resolve();
            const timer = setTimeout(() => {
              console.warn("Image load timeout:", img.src);
              cleanup();
              resolve();
            }, 3000);

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

  const handleDownload = async () => {
    if (isDownloading) return;
    if (!customerDetailsRecord || !downloadSectionRef.current) {
      toast.error("Customer details are not loaded yet.");
      return;
    }

    setIsDownloading(true);
    const loadingToast = toast.loading("Generating PDF...");
    const element = downloadSectionRef.current;
    
    try {
      await ensureImagesLoaded(element);
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `customer_${bvn}_form.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("Downloaded!", { id: loadingToast });
    } catch (error) {
      console.error("PDF Fail:", error);
      toast.error("Failed to generate PDF.", { id: loadingToast });
    } finally {
      setIsDownloading(false);
    }
  };

  if (customerDetailsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="mx-auto max-w-[210mm]">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate(`/admin/customers/${bvn}/details`)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to details
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || !customerDetailsRecord}
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-md transition ${
              isDownloading || !customerDetailsRecord
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
            }`}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF Form
              </>
            )}
          </button>
        </header>

        {customerDetailsError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            {customerDetailsError}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-2xl">
            <div 
              ref={downloadSectionRef}
              style={{
                width: "210mm",
                minHeight: "297mm",
                backgroundColor: "#ffffff",
                padding: "15mm",
                boxSizing: "border-box",
              }}
            >
              {customerDetailsRecord && (
                <DownloadTemplate
                  record={customerDetailsRecord}
                  formatDateTime={formatDateTime}
                  formatCurrency={formatCurrency}
                  assetBaseUrl={URL}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DownloadTemplate({ record, formatDateTime, formatCurrency, assetBaseUrl }) {
  const headerColor = "#8aa322";
  const headingStyle = {
    backgroundColor: headerColor,
    color: "#fff",
    padding: "6px 12px",
    fontSize: "12px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontWeight: 600,
  };

  const gridStyle = {
    display: "flex",
    flexWrap: "wrap",
    borderLeft: "1px solid #d1d5db",
    borderTop: "1px solid #d1d5db",
  };

  const fieldStyle = {
    padding: "8px 12px",
    borderRight: "1px solid #d1d5db",
    borderBottom: "1px solid #d1d5db",
    minHeight: "56px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#6b7280",
    marginBottom: "2px",
    fontWeight: 600,
  };

  const valueStyle = {
    fontSize: "13px",
    fontWeight: 600,
    color: "#111827",
  };

  const renderField = (label, value, span = 1) => (
    <div
      key={label}
      style={{
        ...fieldStyle,
        width: span === 1 ? "50%" : "100%",
      }}
    >
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value || "—"}</div>
    </div>
  );

  const customer = record.customerDetails || {};
  const business = record.businessDetails || {};
  const bank = record.bankDetails || {};
  const guarantor = record.guarantorDetails || {};
  const loan = record.loanDetails || {};
  const cso = record.csoDetails || {};
  const pictures = record.pictures || {};

  const customerFullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
  const computedLoanBalance = (() => {
    const total = Number(loan.amountToBePaid ?? loan.outstandingBalance ?? 0);
    const paid = Number(loan.amountPaidSoFar ?? 0);
    if (Number.isFinite(total) && Number.isFinite(paid)) {
      return Math.max(total - paid, 0);
    }
    return loan.outstandingBalance;
  })();

  const documentSections = [
    {
      title: "Personal data information",
      fields: [
        { label: "Full name", value: customerFullName, span: 1 },
        { label: "NIN", value: customer.bvn },
        { label: "Address", value: customer.address, span: 2 },
        { label: "Next of kin", value: customer.NextOfKin },
        { label: "Next of kin phone", value: customer.NextOfKinNumber },
        { label: "Mobile number", value: customer.phoneOne },
        { label: "Date of birth", value: customer.dateOfBirth },
      ],
    },
    {
      title: "Business details",
      fields: [
        { label: "Business name", value: business.businessName },
        { label: "Nature of business", value: business.natureOfBusiness },
        { label: "Business address", value: business.address, span: 2 },
        { label: "Years at location", value: business.yearsHere },
        { label: "Known as in area", value: business.nameKnown },
        { label: "Estimated worth", value: business.estimatedValue },
      ],
    },
    {
      title: "Loan details",
      fields: [
        { label: "Amount requested", value: formatCurrency(loan.amountRequested) },
        { label: "Amount Disbursed", value: formatCurrency(loan.amountDisbursed) },
        { label: "Principal + Interest", value: formatCurrency(loan.amountToBePaid) },
        { label: "Loan type", value: loan.loanType },
         { label: "Total Repayment", value: loan.amountPaidSoFar },
        // {
        //   label: "Daily payment",
        //   value: formatCurrency(loan.dailyPaymentAmount || loan.dailyPayment?.[0]?.amount),
        // },
        // { label: "Penalty", value: formatCurrency(loan.penalty) },
        { label: "Loan balance", value: formatCurrency(computedLoanBalance) },
      ],
    },
    {
      title: "Account details",
      fields: [
        { label: "Account name", value: bank.accountName },
        { label: "Account number", value: bank.accountNo },
        { label: "Bank name", value: bank.bankName },
      ],
    },
    {
      title: "Guarantor details",
      fields: [
        { label: "Guarantor name", value: guarantor.name },
        { label: "Relationship", value: guarantor.relationship },
        { label: "Address", value: guarantor.address, span: 2 },
        { label: "Phone number", value: guarantor.phone },
        { label: "Years known", value: guarantor.yearsKnown },
      ],
    },
    {
      title: "Group details",
      fields: [
        { label: "Group Name", value: (record.groupDetails || {}).groupName },
        { label: "Leader Name", value: (record.groupDetails || {}).leaderName },
        { label: "Leader Phone", value: (record.groupDetails || {}).mobileNo },
        { label: "Leader Address", value: (record.groupDetails || {}).address, span: 2 },
      ],
    },
    {
      title: "CSO details",
      fields: [
        { label: "CSO in charge", value: cso.name },
        { label: "CSO ID", value: cso.id },
        { label: "Branch", value: cso.branch },
        { label: "Date submitted", value: formatDateTime(record.createdAt) },
      ],
    },
  ];

  const signatureBlocks = [
    { label: "Customer signature", url: pictures.signature },
    { label: "CSO signature", url: cso.signature },
    { label: "Guarantor signature", url: guarantor.signature },
  ];

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <img
            src="/images/logo-2.jpeg"
            alt="BetterLife Loans"
            style={{ height: "70px", width: "180px", objectFit: "contain" }}
          />
        </div>
        <div style={{ textAlign: "right", marginRight: "40px" }}>
          <div style={{ fontWeight: 700 , fontSize: "30px", color: "#1a3a52"}}>Loan Application Form</div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            261, Old Abeokuta Rd, Tabon Tabon, Agege, Lagos State
          </div>
          <div
            style={{
              marginTop: "8px",
              display: "flex",
              gap: "16px",
              justifyContent: "flex-end",
              fontSize: "12px",
              color: "#6b7280",
            }}
          >
            <span>support@betterlifeloan.com</span>
            <span>+234 703 030 3224</span>
          </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>https://betterlifeloan.com/</div>

        </div>
      </header>

      <section style={{ border: "1px solid #d1d5db", marginBottom: "16px" }}>
        <div style={headingStyle}>Form details</div>
        <div style={{ padding: "12px" }}>
          <div style={{ display: "flex", gap: "24px", fontSize: "13px", fontWeight: 600 }}>
            <p>
              CSO in charge: <span style={{ fontWeight: 700 }}>{cso.name || "—"}</span>
            </p>
            <p>
              Date submitted: <span style={{ fontWeight: 700 }}>{formatDateTime(record.createdAt)}</span>
            </p>
          </div>
        </div>
      </section>

      {documentSections.map((section) => (
        <section key={section.title} style={{ marginBottom: "16px" }}>
          <div style={headingStyle}>{section.title}</div>
          <div style={gridStyle}>
            {section.fields.map((field) => renderField(field.label, field.value, field.span || 1))}
          </div>
        </section>
      ))}

      <section style={{ marginBottom: "16px" }}>
        <div style={headingStyle}>Pictures</div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              padding: "16px",
            }}
          >
            {[{ label: "Customer picture", url: pictures.customer }, { label: "Business picture", url: pictures.business }].map(
              (item) => (
                <div key={item.label} style={{ width: "calc(50% - 8px)" }}>
                  <div style={{ ...labelStyle, marginBottom: "8px" }}>{item.label}</div>
                  {item.url ? (
                    <img
                      src={`${assetBaseUrl}${item.url}`}
                      alt={item.label}
                      crossOrigin="anonymous"
                      style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "8px" }}
                    />
                  ) : (
                    <div style={{ border: "1px dashed #d1d5db", padding: "32px", textAlign: "center" }}>No image</div>
                  )}
                </div>
              )
            )}
          </div>
      </section>

      <section style={{ marginBottom: "16px" }}>
        <div style={headingStyle}>Terms and conditions</div>
        <div style={{ padding: "16px", fontSize: "12px", color: "#374151" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              1. By submitting this form, I hereby declare that all information provided is true, accurate, and complete to the best of my knowledge and belief. I expressly authorize JK Solutn Loan and Savings Limited to verify any and all information contained herein and to conduct background or reference checks as may be deemed necessary in furtherance of this application. I further acknowledge and agree to be bound by the company's operational policies, procedures, and terms of service, 
                    as may be revised from time to time.
            </div>
            <div>
              2. I understand and accept that in the event of a loan default, both I and the guarantor named in this application shall bear joint and several responsibility for the repayment of any and all outstanding amounts. Where I become unreachable, abscond, or fail to comply with repayment obligations, the guarantor shall be required to either produce me 
                    (the borrower) or discharge the full indebtedness without delay.
            </div>
            <div>
              3. In circumstances where I fail, refuse, or neglect to repay the loan as agreed, JK Solutn Loan and Savings Limited reserves the full right to take possession of any goods, mobile phones, electronic devices, or other items of commercial value found at my residence, business premises, or any known location associated with me, for the purpose of debt recovery. Such items 
                    shall be held as collateral and shall only be released upon full repayment of the outstanding debt.
            </div>
            <div>
              4. Should the debt remain unpaid for a period of seven (7) days following confiscation, the
                     company shall be entitled, without further notice, to sell the seized items at fair market value. Proceeds 
                     from such sale shall be applied to offset the outstanding loan, and no refund, return, or compensation shall 
                     thereafter be owed to me or my guarantor.
            </div>
            <div>
              5. Furthermore, I acknowledge and accept that the company reserves the right to pursue recovery of its funds through any lawful and appropriate enforcement 
                      method or means as it may deem fit, without limitation or obligation to notify me in advance.
            </div>
          </div>
        </div>
      </section>

      <section>
        <div style={headingStyle}>Signatures</div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              padding: "16px",
            }}
          >
            {signatureBlocks.map((sign) => (
              <div key={sign.label} style={{ textAlign: "center", width: "30%" }}>
                {sign.url ? (
                  <img
                    src={`${assetBaseUrl}${sign.url}`}
                    alt={sign.label}
                    crossOrigin="anonymous"
                    style={{ height: "60px", objectFit: "contain", margin: "0 auto" }}
                  />
                ) : (
                  <div
                    style={{
                      borderBottom: "1px solid #9ca3af",
                      height: "40px",
                      marginBottom: "12px",
                    }}
                  />
                )}
                <div style={{ fontSize: "11px", fontWeight: 600 }}>{sign.label}</div>
              </div>
            ))}
          </div>
      </section>
    </div>
  );
}
