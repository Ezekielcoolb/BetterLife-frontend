import { useMemo, useState } from "react";
import BranchTarget from "./Branch/BranchTarget";
import CsoDefaultingTarget from "./csoSettings/CsoDefaultingTarget";
import InterestManager from "./interestSettings/InterestManager";

const tabs = [
  { id: "security", label: "Security" },
  { id: "branch", label: "Branch Targets" },
  { id: "cso-defaulting", label: "CSO Defaults Limit" },
  { id: "interest", label: "Interest" },
];

const initialSecurityForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const Setting = () => {
  const [activeTab, setActiveTab] = useState("security");
  const [securityForm, setSecurityForm] = useState(initialSecurityForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSecurityFormValid = useMemo(
    () =>
      securityForm.currentPassword.trim() !== "" &&
      securityForm.newPassword.trim() !== "" &&
      securityForm.confirmPassword.trim() !== "" &&
      securityForm.newPassword === securityForm.confirmPassword,
    [securityForm]
  );

  const handleSecurityChange = (event) => {
    const { name, value } = event.target;
    setSecurityForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecuritySubmit = (event) => {
    event.preventDefault();
    if (!isSecurityFormValid) {
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSecurityForm(initialSecurityForm);
    }, 1000);
  };

  const renderSecurityTab = () => (
    <form className="space-y-6" onSubmit={handleSecuritySubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="currentPassword">
            Current Password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={securityForm.currentPassword}
            onChange={handleSecurityChange}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Enter current password"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="newPassword">
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            value={securityForm.newPassword}
            onChange={handleSecurityChange}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Enter new password"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={securityForm.confirmPassword}
            onChange={handleSecurityChange}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Confirm new password"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          onClick={() => setSecurityForm(initialSecurityForm)}
          disabled={isSubmitting}
        >
          Reset
        </button>
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isSecurityFormValid || isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">
            Manage account security and branch-wide targets from a single hub.
          </p>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-6">
          {activeTab === "security" && renderSecurityTab()}
          {activeTab === "branch" && <BranchTarget />}
          {activeTab === "cso-defaulting" && <CsoDefaultingTarget />}
          {activeTab === "interest" && <InterestManager />}
        </div>
      </section>
    </div>
  );
}



export default Setting;
