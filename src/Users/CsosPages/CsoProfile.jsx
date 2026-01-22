import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Building2,
  CalendarDays,
  IdCard,
  Mail,
  MapPin,
  Phone as PhoneIcon,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { uploadImages } from "../../redux/slices/uploadSlice";
import { updateCsoProfile, updateCsoSignature } from "../../redux/slices/csoAuthSlice";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = "https://api.betterlifeloan.com"

const PROFILE_UPLOAD_FOLDER = "cso-profile";
const SIGNATURE_UPLOAD_FOLDER = "cso-signatures";

function dataURLToFile(dataUrl, filename) {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

function getCanvasCoordinates(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function resolveAssetUrl(url) {
  if (!url) {
    return "";
  }

  if (/^(data:|blob:|https?:)/i.test(url)) {
    return url;
  }

  const normalized = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${normalized}`;
}

function DetailField({ label, value }) {
  const displayValue = value ?? "—";
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {displayValue}
      </div>
    </div>
  );
}

export default function CsoProfile() {
  const dispatch = useDispatch();
  const { cso, savingProfile, savingSignature } = useSelector((state) => state.csoAuth);
  const [phone, setPhone] = useState(cso?.phone || "");
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(cso?.profileImg || "");
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [signatureDirty, setSignatureDirty] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);

  useEffect(() => {
    setPhone(cso?.phone || "");
    setProfilePreview(cso?.profileImg || "");
  }, [cso?.phone, cso?.profileImg]);

  useEffect(() => {
    if (!profileFile) {
      return;
    }

    const previewUrl = URL.createObjectURL(profileFile);
    setProfilePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [profileFile]);

  const initialiseCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 2.5;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.strokeStyle = "#0f172a";
    setSignatureDirty(false);
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  useEffect(() => {
    initialiseCanvas();
  }, [initialiseCanvas]);

  const handlePointerDown = useCallback((event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const { x, y } = getCanvasCoordinates(event, canvas);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 0.01, y + 0.01);
    context.stroke();

    isDrawingRef.current = true;
    lastPointRef.current = { x, y };
    setSignatureDirty(true);
  }, []);

  const handlePointerMove = useCallback((event) => {
    if (!isDrawingRef.current) {
      return;
    }

    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const { x, y } = getCanvasCoordinates(event, canvas);
    const lastPoint = lastPointRef.current;

    if (lastPoint) {
      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(x, y);
      context.stroke();
    }

    lastPointRef.current = { x, y };
  }, []);

  const handlePointerUp = useCallback((event) => {
    event.preventDefault();
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const clearSignatureCanvas = useCallback(() => {
    initialiseCanvas();
  }, [initialiseCanvas]);

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProfileFile(null);
      return;
    }
    setProfileFile(file);
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    const trimmedPhone = phone.trim();
    const payload = {};

    if (trimmedPhone && trimmedPhone !== cso?.phone) {
      payload.phone = trimmedPhone;
    }

    let uploadedProfileUrl;

    try {
      if (profileFile) {
        setIsUploadingProfileImage(true);
        const uploadResult = await dispatch(
          uploadImages({ files: [profileFile], folderName: PROFILE_UPLOAD_FOLDER, target: "profileImg" })
        ).unwrap();
        uploadedProfileUrl = uploadResult.urls?.[0];
        if (uploadedProfileUrl) {
          payload.profileImg = uploadedProfileUrl;
        }
      }

      if (Object.keys(payload).length === 0) {
        toast("No changes to update.");
        return;
      }

      await dispatch(updateCsoProfile(payload)).unwrap();
      toast.success("Profile updated successfully.");
      setProfileFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      const message = typeof error === "string" ? error : "Unable to update profile";
      toast.error(message);
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!signatureDirty) {
      toast.error("Please provide your signature before saving.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsUploadingSignature(true);
      const dataUrl = canvas.toDataURL("image/png");
      const signatureFile = dataURLToFile(dataUrl, `cso-signature-${Date.now()}.png`);
      const uploadResult = await dispatch(
        uploadImages({ files: [signatureFile], folderName: SIGNATURE_UPLOAD_FOLDER, target: "signature" })
      ).unwrap();
      const signatureUrl = uploadResult.urls?.[0];

      if (!signatureUrl) {
        toast.error("Unable to upload signature. Please try again.");
        return;
      }

      await dispatch(updateCsoSignature({ signature: signatureUrl })).unwrap();
      toast.success("Signature updated successfully.");
      setSignatureDirty(false);
    } catch (error) {
      const message = typeof error === "string" ? error : "Unable to update signature";
      toast.error(message);
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const csoFullName = useMemo(() => {
    return [cso?.firstName, cso?.lastName].filter(Boolean).join(" ") || "Customer Service Officer";
  }, [cso?.firstName, cso?.lastName]);

  const isProfileSubmitDisabled = savingProfile || isUploadingProfileImage;
  const isSignatureSubmitDisabled = savingSignature || isUploadingSignature;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-white" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-indigo-100" aria-hidden="true" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
                {profilePreview ? (
                  <img
                    src={resolveAssetUrl(profilePreview)}
                    alt={csoFullName}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-indigo-600">
                    {csoFullName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                CSO Portal
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{csoFullName}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {cso?.email}
                </span>
                {cso?.branch && (
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    {cso.branch}
                  </span>
                )}
                {cso?.city && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {cso.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-2 text-sm text-indigo-700">
              <p className="font-semibold">Account status</p>
              <p>{cso?.isActive ? "Active" : "Inactive"}</p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600"
            >
              <UserRound className="h-4 w-4" />
              Change photo
            </button>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
            />
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="relative border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)_auto]">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="phone">
              Phone number
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Enter phone number"
                />
              </div>
            </label>

            <div className="flex items-end gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Profile image</p>
                <p className="text-xs text-slate-500">Accepted formats: PNG, JPG. Maximum size 2MB.</p>
              </div>
            </div>

            <div className="flex items-end justify-start sm:justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                disabled={isProfileSubmitDisabled}
              >
                {isProfileSubmitDisabled ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Professional summary</h2>
              <p className="text-sm text-slate-500">Key identifying information curated by your administrator.</p>
            </div>
            <div className="rounded-full bg-indigo-50 p-3 text-indigo-600">
              <IdCard className="h-6 w-6" />
            </div>
          </header>

          <div className="grid gap-5 sm:grid-cols-2">
            <DetailField label="First name" value={cso?.firstName} icon={UserRound} />
            <DetailField label="Last name" value={cso?.lastName} icon={UserRound} />
            <DetailField label="Email" value={cso?.email} icon={Mail} />
            <DetailField label="Work ID" value={cso?.workId} icon={IdCard} />
            <DetailField label="Branch" value={cso?.branch} icon={Building2} />
            <DetailField label="Address" value={cso?.address} icon={MapPin} />
            <DetailField label="City" value={cso?.city} icon={MapPin} />
            <DetailField label="State" value={cso?.state} icon={MapPin} />
            <DetailField
              label="Date of birth"
              value={cso?.dateOfBirth ? new Date(cso.dateOfBirth).toLocaleDateString() : null}
              icon={CalendarDays}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-6 flex items-center gap-3">
            <div className="rounded-full bg-indigo-50 p-3 text-indigo-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Guarantor details</h2>
              <p className="text-sm text-slate-500">Contact your guarantor to verify sensitive updates.</p>
            </div>
          </header>

          <div className="space-y-4">
            <DetailField label="Name" value={cso?.guaratorName} icon={UserRound} />
            <DetailField label="Email" value={cso?.guaratorEmail} icon={Mail} />
            <DetailField label="Phone" value={cso?.guaratorPhone} icon={PhoneIcon} />
            <DetailField label="Address" value={cso?.guaratorAddress} icon={MapPin} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Signature</h2>
            <p className="text-sm text-slate-500">
              Review your stored signature or draw a new one using the canvas. Upload works with mouse, stylus, or touch input.
            </p>
          </div>
          <button
            type="button"
            onClick={clearSignatureCanvas}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-600"
          >
            Reset canvas
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
              <canvas
                ref={canvasRef}
                width={800}
                height={260}
                className="h-60 w-full rounded-xl bg-white shadow-sm"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onContextMenu={(event) => event.preventDefault()}
                style={{ touchAction: "none" }}
              />
            </div>
            <button
              type="button"
              onClick={handleSaveSignature}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
              disabled={isSignatureSubmitDisabled}
            >
              {isSignatureSubmitDisabled ? "Saving signature..." : "Save signature"}
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Current signature on file</p>
              <p className="text-xs text-slate-500">Stored securely and stamped on every processed loan document.</p>
            </div>
            {cso?.signature ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <img
                  src={resolveAssetUrl(cso.signature)}
                  alt="Current signature"
                  className="w-full rounded-lg bg-white object-contain"
                />
              </div>
            ) : (
              <div className="flex h-full min-h-[220px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                No signature on file yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
