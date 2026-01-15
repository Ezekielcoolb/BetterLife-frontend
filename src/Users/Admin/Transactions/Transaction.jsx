import { useState } from "react";
import { FolderKanban } from "lucide-react";
import TransLoan from "./TransLoan";
import DailyTransaction from "./DailyTransaction";
import Remittance from "./Remittance";

const tabs = [
  {
    id: "loan-applications",
    label: "Loan Applications",
    component: <TransLoan />,
  },
  {
    id: "daily-transactions",
    label: "Daily Transactions",
    component: <DailyTransaction />,
  },
  {
    id: "remittances",
    label: "Remittances",
    component: <Remittance />,
  },
];

export default function Transaction() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <FolderKanban className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
            <p className="text-sm text-slate-500">
              Monitor loan activities, approvals, and repayment progress.
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <nav className="flex flex-wrap gap-4 border-b border-slate-200 px-6 pt-6">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-6">{currentTab.component}</div>
      </div>
    </div>
  );
}
