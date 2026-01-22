import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Loader2, UploadCloud, CheckCircle2, X } from "lucide-react";
import { fetchApprovedLoans, disburseLoan, clearAdminLoanErrors } from "../../../redux/slices/adminLoanSlice";
import { uploadImages } from "../../../redux/slices/uploadSlice";

const formatCurrency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(value);
};

export default function Disbursement() {
  const dispatch = useDispatch();

  const { approvedLoans, approvedLoansLoading, approvedLoansError, updating, updateError } = useSelector(
    (state) => state.adminLoans
  );

  const { imageUploadLoading } = useSelector((state) => state.upload);

  const [uploadingLoanId, setUploadingLoanId] = useState(null);
  const [pendingUploads, setPendingUploads] = useState({});
  const [previewModal, setPreviewModal] = useState(null);

  useEffect(() => {
    dispatch(fetchApprovedLoans());
  }, [dispatch]);

  useEffect(() => {
    if (approvedLoansError) {
      toast.error(approvedLoansError);
      dispatch(clearAdminLoanErrors());
    }
  }, [approvedLoansError, dispatch]);

  useEffect(() => {
    if (updateError) {
      toast.error(updateError);
      dispatch(clearAdminLoanErrors());
    }
  }, [updateError, dispatch]);

  const loans = useMemo(() => approvedLoans ?? [], [approvedLoans]);

  const handleUpload = async (event, loanId) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    try {
      setUploadingLoanId(loanId);
      const { urls } = await dispatch(
        uploadImages({ files, folderName: "disbursements", target: `loan-${loanId}` })
      ).unwrap();

      setPendingUploads((prev) => ({
        ...prev,
        [loanId]: urls[0],
      }));

      toast.success("Upload complete");
    } catch (error) {
      const message = typeof error === "string" ? error : "Unable to upload disbursement proof";
      toast.error(message);
    } finally {
      event.target.value = "";
      setUploadingLoanId(null);
    }
  };

  const handleDisburse = async (loanId) => {
    const disbursementPicture = pendingUploads[loanId];

    if (!disbursementPicture) {
      toast.error("Upload the disbursement proof before marking as disbursed");
      return;
    }

    try {
      await dispatch(disburseLoan({ loanId, disbursementPicture })).unwrap();
      toast.success("Loan disbursed successfully");

      setPendingUploads((prev) => {
        const next = { ...prev };
        delete next[loanId];
        return next;
      });
    } catch (error) {
      const message = typeof error === "string" ? error : "Unable to disburse loan";
      toast.error(message);
    }
  };

  if (approvedLoansLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          Loading approved loans...
        </div>
      </div>
    );
  }

  if (!approvedLoansLoading && loans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">No approved loans awaiting disbursement</h2>
        <p className="mt-2 text-sm text-slate-500">
          Approved loans will appear here once they are ready to be disbursed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Loan Disbursement</h1>
        <p className="text-sm text-slate-500">
          Manage disbursement for approved loans. Upload proof and mark them as active.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Loan ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount approved</th>
              <th className="px-4 py-3">Bank Name</th>
              <th className="px-4 py-3">Account Number</th>
              <th className="px-4 py-3">Account Name</th>
              <th className="px-4 py-3">CSO</th>
              <th className="px-4 py-3">Uploaded proof</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loans.map((loan) => {
              const loanId = loan._id;
              const uploadUrl = pendingUploads[loanId];
              const isUploading = uploadingLoanId === loanId || imageUploadLoading;

              return (
                <tr key={loanId}>
                  <td className="px-4 py-3 font-medium text-slate-800">{loan.loanId || loanId}</td>
                  <td className="px-4 py-3">
                    {loan.customerDetails?.firstName} {loan.customerDetails?.lastName}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(loan.loanDetails?.amountApproved)}</td>
                  <td className="px-4 py-3">{loan.bankDetails?.bankName ?? "—"}</td>
                  <td className="px-4 py-3">{loan.bankDetails?.accountNo ?? "—"}</td>
                  <td className="px-4 py-3">{loan.bankDetails?.accountName ?? "—"}</td>
                  <td className="px-4 py-3">{loan.csoName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {uploadUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewModal({ url: uploadUrl, loanReference: loan.loanId || loanId })}
                        className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
                      >
                        <UploadCloud className="h-3.5 w-3.5" /> View proof
                      </button>
                    ) : (
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600">
                        <UploadCloud className="h-3.5 w-3.5" />
                        {isUploading ? "Uploading..." : "Upload proof"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => handleUpload(event, loanId)}
                          disabled={isUploading || updating}
                        />
                      </label>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDisburse(loanId)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                      disabled={updating || !uploadUrl}
                    >
                      {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Disburse
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewModal(null)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>

            <header className="mb-4 pr-10">
              <h2 className="text-lg font-semibold text-slate-900">Disbursement proof</h2>
              <p className="text-sm text-slate-500">Loan reference: {previewModal.loanReference}</p>
            </header>

            <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200">
              <img src={`https://api.betterlifeloan.com${previewModal.url}`} alt="Disbursement proof" className="h-full w-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
