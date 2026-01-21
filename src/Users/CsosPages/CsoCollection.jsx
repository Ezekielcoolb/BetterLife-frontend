import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Loader2, RefreshCw, Search, Upload, AlertTriangle, CheckCircle, X, Wallet, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";
import { clearLoanError, fetchCsoCollection, fetchCsoFormCollection } from "../../redux/slices/loanSlice";
import { fetchCsoProfile, postCsoRemittance, clearCsoError, resetRemittanceSuccess } from "../../redux/slices/csoSlice";
import { fetchMyApprovedGroupLeaders } from "../../redux/slices/groupLeaderSlice";
import { uploadImages, resetUpload } from "../../redux/slices/uploadSlice";

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

function resolveAssetUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

const formatCurrency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "₦0";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);
};

const STATUS_BADGES = {
  paid: "bg-emerald-100 text-emerald-700",
  defaulting: "bg-rose-100 text-rose-700",
  "not due yet": "bg-amber-100 text-amber-700",
};

const RemittanceTimer = ({ isComplete }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (isComplete) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow - now;

      if (diff <= 0) return 0;
      return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [isComplete]);

  if (isComplete || timeLeft === null) return null;

  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  const formatTime = (val) => val.toString().padStart(2, '0');
  const timeString = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;

  // Thresholds
  const totalSeconds = timeLeft / 1000;
  const twoHours = 2 * 60 * 60;
  const fiveHours = 5 * 60 * 60;

  let className = "flex items-center gap-2 text-sm font-mono font-bold px-3 py-1.5 rounded-xl border ";
  
  if (totalSeconds <= twoHours) {
    className += "border-rose-200 bg-rose-50 text-rose-600 animate-pulse";
  } else if (totalSeconds <= fiveHours) {
    className += "border-amber-200 bg-amber-50 text-amber-600";
  } else {
    className += "border-emerald-200 bg-emerald-50 text-emerald-600";
  }

  return (
    <div className={className}>
      <span>Time left:</span>
      <span>{timeString}</span>
    </div>
  );
};

export default function CsoCollection() {
  const dispatch = useDispatch();

  const {
    collectionDate,
    collectionRecords,
    collectionSummary,
    collectionLoading,
    collectionError,
    formCollectionRecords,
    formCollectionSummary,
    formCollectionLoading,
    formCollectionError,
  } = useSelector((state) => state.loan);

  const {
    profile: csoProfile,
    remittanceLoading,
    remittanceSuccess,
    error: csoError,
  } = useSelector((state) => state.cso);

  const {
    imageUploadLoading,
    urls: uploadedUrls,
    target: uploadTarget
  } = useSelector((state) => state.upload);

  const {
    items: groupLeaders,
    loading: groupLeadersLoading
  } = useSelector((state) => state.groupLeader);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupLeader, setSelectedGroupLeader] = useState("all");
  
  // Remittance State
  const [showRemittanceModal, setShowRemittanceModal] = useState(false);
  const [remittanceData, setRemittanceData] = useState({
    amountPaid: "",
    image: "",
    remark: "",
  });
  
  // Yesterday Modal State
  const [showYesterdayModal, setShowYesterdayModal] = useState(false);
  const [yesterdayModalType, setYesterdayModalType] = useState(null); // 'missing' | 'partial'
  const [yesterdayRemittanceData, setYesterdayRemittanceData] = useState({
    amountPaid: "",
    image: "",
    remark: "",
    amountCollected: 0,
    amountAlreadyPaid: 0,
  });
  const [pendingRemittanceDate, setPendingRemittanceDate] = useState(null);
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  const displayDate = collectionDate || selectedDate;
  const totalCollectionValue =
    (collectionSummary.totalPaidToday || 0) +
    (formCollectionSummary.totalLoanAppForm || 0);
  const totalCollectionForDay = formatCurrency(totalCollectionValue);

  const getTodayRemittanceStatus = () => {
    if (!csoProfile || !csoProfile.remittance) return { status: 'none', paid: 0 };
    
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRemittances = csoProfile.remittance.filter(r => {
        const rDate = new Date(r.date).toISOString().slice(0, 10);
        return rDate === todayStr;
    });

    if (todayRemittances.length === 0) return { status: 'none', paid: 0 };

    // Calculate total paid today
    const paid = todayRemittances.reduce((sum, r) => sum + (Number(r.amountPaid) || 0), 0);
    
    if (paid >= totalCollectionValue && totalCollectionValue > 0) return { status: 'full', paid };
    return { status: 'partial', paid };
  };

  const todayStatus = getTodayRemittanceStatus();

  useEffect(() => {
    dispatch(fetchCsoCollection(selectedDate));
    dispatch(fetchCsoFormCollection(selectedDate));
  }, [dispatch, selectedDate]);

  useEffect(() => {
    dispatch(fetchCsoProfile());
    dispatch(fetchMyApprovedGroupLeaders());
  }, [dispatch]);

  useEffect(() => {
    if (collectionError) {
      toast.error(collectionError);
      dispatch(clearLoanError());
    }
    if (formCollectionError) {
      toast.error(formCollectionError);
      dispatch(clearLoanError());
    }
    if (csoError) {
      toast.error(csoError);
      dispatch(clearCsoError());
    }
  }, [collectionError, formCollectionError, csoError, dispatch]);

  useEffect(() => {
    if (remittanceSuccess) {
      toast.success("Remittance submitted successfully");
      
      // We do NOT close the modal immediately if it's still partial.
      // The profile is updated in the reducer, so todayStatus/checkYesterdayRemittance will re-run.
      // However, we need to reset the form data for the NEXT chunk.
      
      setRemittanceData({ amountPaid: "", image: "", remark: "" });
      setYesterdayRemittanceData(prev => ({ ...prev, amountPaid: "", image: "", remark: "" }));
      
      dispatch(resetRemittanceSuccess());
      dispatch(fetchCsoProfile());
      
      // We rely on the other useEffects to decide whether to close or keep open.
      // But we should probably explicitly close IF it is now full.
      // Since we don't have the *new* status calculated here easily without waiting for render,
      // we can just let the status checks handle it.
      // But wait, if we don't close it, it stays open.
      // If the new status is 'full', the status check should close it?
      // No, the status check usually opens it.
      
      // Let's force a check or just close if we think it's done?
      // Better: The `todayStatus` will update.
      // We can add a useEffect for `todayStatus` to close it if full?
    }
  }, [remittanceSuccess, dispatch]);

  // Effect to manage Today's Modal visibility based on status
  useEffect(() => {
     if (todayStatus.status === 'full') {
         setShowRemittanceModal(false);
     } else if (todayStatus.status === 'partial') {
         setShowRemittanceModal(true);
     }
  }, [todayStatus.status]);

  // Auto-fill remaining amount for partial payments
  useEffect(() => {
    if (todayStatus.status === 'partial') {
        const remaining = totalCollectionValue - todayStatus.paid;
        setRemittanceData(prev => ({ ...prev, amountPaid: remaining }));
    }
  }, [todayStatus.status, todayStatus.paid, totalCollectionValue]);

  useEffect(() => {
    if (csoProfile) {
      checkOutstandingRemittance(csoProfile);
    }
  }, [csoProfile]);

  // Handle Upload Success
  useEffect(() => {
    if (uploadedUrls.length > 0 && uploadTarget) {
        if (uploadTarget === 'remittance') {
            setRemittanceData(prev => ({ ...prev, image: uploadedUrls[0] }));
        } else if (uploadTarget === 'yesterdayRemittance') {
            setYesterdayRemittanceData(prev => ({ ...prev, image: uploadedUrls[0] }));
        }
        dispatch(resetUpload());
    }
  }, [uploadedUrls, uploadTarget, dispatch]);

  const checkOutstandingRemittance = (profile) => {
    if (!profile || !profile.remittance) {
      setShowYesterdayModal(false);
      setPendingRemittanceDate(null);
      return;
    }

    const referenceDate = getRemittanceReferenceDate();
    const referenceDateStr = referenceDate.toISOString().slice(0, 10);

    const targetRemittances = profile.remittance.filter((record) => {
      const recordDate = new Date(record.date).toISOString().slice(0, 10);
      return recordDate === referenceDateStr;
    });

    // If no remittance at all, show blocking modal (missing)
    if (targetRemittances.length === 0) {
      setYesterdayModalType("missing");
      setPendingRemittanceDate(referenceDate);
      setShowYesterdayModal(true);
      return;
    }

    // Check if resolved
    const isResolved = targetRemittances.some((record) => record.resolvedIssue);
    if (isResolved) {
      setShowYesterdayModal(false);
      setPendingRemittanceDate(null);
      return;
    }

    // Calculate totals
    const amountCollected = Math.max(
      ...targetRemittances.map((record) => Number(record.amountCollected) || 0)
    );
    const totalPaid = targetRemittances.reduce(
      (sum, record) => sum + (Number(record.amountPaid) || 0),
      0
    );

    if (totalPaid < amountCollected) {
      setYesterdayModalType("partial");
      setPendingRemittanceDate(referenceDate);
      setYesterdayRemittanceData((prev) => ({
        ...prev,
        amountCollected,
        amountAlreadyPaid: totalPaid,
        amountPaid: "", // Reset for new input
        image: "",
        remark: "",
      }));
      setShowYesterdayModal(true);
    } else {
      setShowYesterdayModal(false);
      setPendingRemittanceDate(null);
    }
  };




  const navigate = useNavigate();

  const filteredRecords = useMemo(() => {
    let records = collectionRecords;

    // Filter by group leader first
    if (selectedGroupLeader !== "all") {
      records = records.filter((record) => {
        // We compare against the leaderName or groupName
        // Based on implementation plan, we want to filter using the group leader
        return record.leaderName === selectedGroupLeader;
      });
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return records;
    }

    return records.filter((record) => {
      const customerName = record.customerName?.toLowerCase() || "";
      const loanId = record.loanId?.toLowerCase() || "";
      const status = record.collectionStatus?.toLowerCase() || "";

      return customerName.includes(normalizedSearch) || loanId.includes(normalizedSearch) || status.includes(normalizedSearch);
    });
  }, [collectionRecords, searchTerm, selectedGroupLeader]);

  const filteredFormRecords = useMemo(() => {
    let records = formCollectionRecords;

    if (selectedGroupLeader !== "all") {
      records = records.filter((record) => record.leaderName === selectedGroupLeader);
    }

    return records;
  }, [formCollectionRecords, selectedGroupLeader]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleRefresh = () => {
    dispatch(fetchCsoCollection(selectedDate));
    dispatch(fetchCsoFormCollection(selectedDate));
    dispatch(fetchCsoProfile());
  };

  const getRecordLoanId = (record) => record?.loanMongoId || record?._id || record?.loanId;

  const handleRecordPayment = (record) => {
    const loanId = getRecordLoanId(record);

    if (!loanId) {
      toast.error("Loan identifier unavailable for this record.");
      return;
    }

    navigate(`/cso/loans/${loanId}/payment`);
    setActiveActionMenu(null);
  };

  const handleViewDetails = (record) => {
    const loanId = getRecordLoanId(record);

    if (!loanId) {
      toast.error("Loan identifier unavailable for this record.");
      return;
    }

    navigate(`/cso/loans/${loanId}`);
    setActiveActionMenu(null);
  };



  const handleRemittanceSubmit = (e) => {
    e.preventDefault();

    const amountToPay = Number(remittanceData.amountPaid);
    
    // We are submitting a NEW partial payment, not the cumulative total.
    // The backend now pushes a new record.
    
    if (todayStatus.paid + amountToPay > totalCollectionValue) {
        toast.error(`Total amount paid cannot exceed collected amount (${formatCurrency(totalCollectionValue)})`);
        return;
    }

    const payload = {
      amountCollected: totalCollectionValue,
      amountPaid: amountToPay, // Send only the incremental amount
      image: remittanceData.image,
      date: new Date().toISOString(),
      remark: remittanceData.remark
    };

    dispatch(postCsoRemittance(payload));
  };

  const handleYesterdayRemittanceSubmit = (e) => {
      e.preventDefault();
      
      const amountToPay = Number(yesterdayRemittanceData.amountPaid);
      const totalPaid = yesterdayRemittanceData.amountAlreadyPaid + amountToPay;
      
      if (totalPaid > yesterdayRemittanceData.amountCollected) {
           toast.error(`Total amount cannot exceed collected amount (${formatCurrency(yesterdayRemittanceData.amountCollected)})`);
           return;
      }
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const payload = {
        amountCollected: yesterdayRemittanceData.amountCollected,
        amountPaid: amountToPay, // Send only the incremental amount
        image: yesterdayRemittanceData.image, 
        date: pendingRemittanceDate ? pendingRemittanceDate.toISOString() : yesterday.toISOString(),
        remark: yesterdayRemittanceData.remark
      };

      dispatch(postCsoRemittance(payload));
  };

  const handleImageUpload = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(uploadImages({ 
          files: [file], 
          folderName: "remittance", 
          target: target 
      }));
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Yesterday's Modal */}
      {showYesterdayModal && (
        <div className="fixed inset-x-0 top-0 bottom-[5.5rem] z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8 sm:inset-0 sm:bottom-0 sm:p-6">
          <div className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 text-amber-600">
                <AlertTriangle className="h-8 w-8" />
                <h2 className="text-xl font-bold">Action Required</h2>
            </div>
            
            {yesterdayModalType === 'missing' ? (
                <div className="space-y-4">
                    <p className="text-slate-600">
                        You did not submit remittance for {formatRemittanceDateLabel(pendingRemittanceDate)}. Please contact the admin immediately to resolve this issue.
                    </p>
                    {/* Blocking modal - no close button */}
                </div>
            ) : (
                <form onSubmit={handleYesterdayRemittanceSubmit} className="space-y-4">
                    <p className="text-slate-600">
                        Your remittance for {formatRemittanceDateLabel(pendingRemittanceDate)} is incomplete.
                        <br />
                        Collected: <span className="font-semibold">{formatCurrency(yesterdayRemittanceData.amountCollected)}</span>
                        <br />
                        Paid: <span className="font-semibold text-emerald-600">{formatCurrency(yesterdayRemittanceData.amountAlreadyPaid)}</span>
                        <br />
                        Remaining: <span className="font-semibold text-rose-600">{formatCurrency(yesterdayRemittanceData.amountCollected - yesterdayRemittanceData.amountAlreadyPaid)}</span>
                    </p>
                    
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Amount to Pay</label>
                        <input 
                            type="number" 
                            required
                            min="1"
                            max={yesterdayRemittanceData.amountCollected - yesterdayRemittanceData.amountAlreadyPaid}
                            value={yesterdayRemittanceData.amountPaid}
                            onChange={(e) => setYesterdayRemittanceData({...yesterdayRemittanceData, amountPaid: e.target.value})}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                     <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Proof of Remittance</label>
                        <div className="flex items-center gap-2">
                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                                {imageUploadLoading && uploadTarget === 'yesterdayRemittance' ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                                <span>{imageUploadLoading && uploadTarget === 'yesterdayRemittance' ? "Uploading..." : "Upload Image"}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'yesterdayRemittance')} />
                            </label>
                            {yesterdayRemittanceData.image && <span className="text-xs text-emerald-600">Image selected</span>}
                        </div>
                        {yesterdayRemittanceData.image && (
                            <div className="mt-2 relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                                <img src={resolveAssetUrl(yesterdayRemittanceData.image)} alt="Preview" className="h-full w-full object-cover" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Remark</label>
                        <textarea 
                            value={yesterdayRemittanceData.remark}
                            onChange={(e) => setYesterdayRemittanceData({...yesterdayRemittanceData, remark: e.target.value})}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            rows="2"
                        ></textarea>
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={remittanceLoading || imageUploadLoading}
                        className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {remittanceLoading ? "Submitting..." : "Submit Remaining"}
                    </button>
                </form>
            )}
          </div>
        </div>
      )}

      {/* Today's Remittance Modal */}
      {showRemittanceModal && (
        <div className="fixed inset-x-0 top-0 bottom-[5.5rem] z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8 sm:inset-0 sm:bottom-0 sm:p-6">
          <div className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Remit Collection</h2>
                {todayStatus.status !== 'partial' && (
                    <button onClick={() => setShowRemittanceModal(false)} className="rounded-full p-2 hover:bg-slate-100">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                )}
            </div>
            
            <form onSubmit={handleRemittanceSubmit} className="space-y-4">
                <div className="rounded-xl bg-indigo-50 p-4 space-y-2">
                    <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                        <span className="text-sm text-indigo-700">Total Collection</span>
                        <span className="text-lg font-bold text-indigo-900">{totalCollectionForDay}</span>
                    </div>
                    {todayStatus.status === 'partial' && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-amber-600">Already Paid</span>
                                <span className="font-semibold text-amber-700">{formatCurrency(todayStatus.paid)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium pt-1">
                                <span className="text-indigo-600"> Remaining Collection</span>
                                <span className="text-rose-600 font-bold">{formatCurrency(totalCollectionValue - todayStatus.paid)}</span>
                            </div>
                        </>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        {todayStatus.status === 'partial' ? "Additional Amount to Remit" : "Amount to Remit"}
                    </label>
                    <input 
                        type="number" 
                        required
                        min="1"
                        max={totalCollectionValue - todayStatus.paid}
                        value={remittanceData.amountPaid}
                        onChange={(e) => setRemittanceData({...remittanceData, amountPaid: e.target.value})}
                        className={`w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none ${todayStatus.status === 'partial' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                        placeholder="Enter amount to pay now"
                        disabled={todayStatus.status === 'partial'}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Proof of Remittance</label>
                    <div className="flex items-center gap-2">
                        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                            {imageUploadLoading && uploadTarget === 'remittance' ? (
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            <span>{imageUploadLoading && uploadTarget === 'remittance' ? "Uploading..." : "Upload Image"}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'remittance')} />
                        </label>
                        {remittanceData.image && <span className="text-xs text-emerald-600">Image selected</span>}
                    </div>
                    {remittanceData.image && (
                        <div className="mt-2 relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                            <img src={resolveAssetUrl(remittanceData.image)} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Remark (Optional)</label>
                    <textarea 
                        value={remittanceData.remark}
                        onChange={(e) => setRemittanceData({...remittanceData, remark: e.target.value})}
                        className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                        rows="2"
                        placeholder="Any notes..."
                    ></textarea>
                </div>

                <button 
                    type="submit"
                    disabled={remittanceLoading || imageUploadLoading}
                    className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {remittanceLoading ? "Submitting..." : "Submit Remittance"}
                </button>
            </form>
          </div>
        </div>
      )}

      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">CSO Daily Collection</h1>
          <p className="text-sm text-slate-500">Track how much your customers remitted on a specific business day.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Remittance Timer */}
            <RemittanceTimer isComplete={todayStatus.status === 'full'} />

            {/* Remittance Button */}
            {todayStatus.status !== 'full' ? (
                 <button
                    type="button"
                    onClick={() => setShowRemittanceModal(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                 >
                    <Upload className="h-4 w-4" /> Remit Collection
                 </button>
            ) : (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle className="h-4 w-4" /> Remittance Complete
                </div>
            )}

          <div className="flex items-center gap-3">
            <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={handleDateChange}
                className="w-full border-none bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
              />
            </label>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={collectionLoading}
            >
              {collectionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Collection date</p>
            <p className="text-lg font-semibold text-slate-900">{displayDate}</p>
          </div>

          <dl className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customers</dt>
              <dd className="text-lg font-semibold text-slate-900">{collectionSummary.totalCustomers || 0}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Paid today</dt>
              <dd className="text-lg font-semibold text-emerald-600">{formatCurrency(collectionSummary.totalPaidToday || 0)}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outstanding</dt>
              <dd className="text-lg font-semibold text-rose-600">{formatCurrency(collectionSummary.totalDue || 0)}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Defaulting</dt>
              <dd className="text-lg font-semibold text-amber-600">{collectionSummary.defaultingCount || 0}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Forms collected</dt>
              <dd className="text-lg font-semibold text-indigo-600">{formatCurrency(formCollectionSummary.totalLoanAppForm || 0)}</dd>
            </div>
            <div className="rounded-2xl bg-indigo-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Total collection</dt>
              <dd className="text-lg font-semibold text-indigo-700">{totalCollectionForDay}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer, status or loan ID"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full border-none bg-transparent text-sm text-slate-600 focus:outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2">
               <span className="text-sm text-slate-400 whitespace-nowrap">Group Leader:</span>
               <select
                 value={selectedGroupLeader}
                 onChange={(e) => setSelectedGroupLeader(e.target.value)}
                 className="w-full border-none bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
               >
                 <option value="all">All Groups</option>
                 {groupLeaders.map((leader) => (
                   <option key={leader._id} value={`${leader.firstName} ${leader.lastName}`}>
                     {leader.firstName} {leader.lastName} ({leader.groupName})
                   </option>
                 ))}
               </select>
            </div>
          </div>
          <p className="text-xs text-slate-500">Showing {filteredRecords.length} of {collectionRecords.length} record(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Loan ID</th>
                <th className="px-4 py-3 text-right">Daily Amt</th>
                <th className="px-4 py-3 text-right">Paid today</th>
                <th className="px-4 py-3 text-right">Paid to date</th>
                <th className="px-4 py-3 text-right">Amount due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collectionLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Loading collection...
                    </div>
                  </td>
                </tr>
              )}

              {!collectionLoading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No collection records for this day.
                  </td>
                </tr>
              )}

              {!collectionLoading &&
                filteredRecords.map((record, index) => (
                  <tr key={`${record.loanId}-${index}`} className="text-slate-700">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{record.customerName || "Unnamed customer"}</div>
                      <p className="text-xs text-slate-500">{record.loanStatus}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{record.loanId}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(record.dailyAmount || 0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{formatCurrency(record.amountPaidToday || 0)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(record.amountPaidToDate || 0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600">{formatCurrency(record.amountDue || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGES[record.collectionStatus] || "bg-slate-100 text-slate-600"}`}>
                        {record.collectionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() => setActiveActionMenu(activeActionMenu === record.loanId ? null : record.loanId)}
                          className="inline-flex items-center rounded-full border border-slate-200 px-2 py-1 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {activeActionMenu === record.loanId && (
                          <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-lg">
                            <button
                              type="button"
                              onClick={() => handleRecordPayment(record)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
                            >
                              <Wallet className="h-4 w-4 text-indigo-600" />
                              Make payment
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewDetails(record)}
                              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
                            >
                              <Search className="h-4 w-4 text-slate-500" />
                              View details
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Daily Form Collections</h2>
            <p className="text-sm text-slate-500">Customers whose forms were collected on {displayDate}.</p>
          </div>
          <div className="text-sm text-slate-500">
            Total forms collected: <span className="font-semibold text-indigo-600">{formatCurrency(formCollectionSummary.totalLoanAppForm || 0)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Form amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formCollectionLoading && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Loading form collection...
                    </div>
                  </td>
                </tr>
              )}

              {!formCollectionLoading && filteredFormRecords.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                    No form collections recorded for this day.
                  </td>
                </tr>
              )}

              {!formCollectionLoading &&
                filteredFormRecords.map((record) => (
                  <tr key={record.loanId} className="text-slate-700">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{record.customerName || "Unnamed customer"}</div>
                      <p className="text-xs text-slate-500">{record.loanId}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900">{formatCurrency(record.loanAppForm || 0)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
