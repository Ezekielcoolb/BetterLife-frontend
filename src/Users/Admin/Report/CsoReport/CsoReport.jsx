import { useMemo, useState } from "react";

import CsoWeeklyReport from "./CsoWeeklyReport";
import GeneralCsoReport from "./GeneralCsoReport";

const TAB_DEFINITIONS = [
  {
    key: "weekly",
    label: "Weekly Report",
    description: "Breakdown of CSO loan disbursements grouped by week.",
    component: CsoWeeklyReport,
  },
  {
    key: "general",
    label: "General Report",
    description: "Monthly portfolio, repayment, and overshoot metrics per CSO.",
    component: GeneralCsoReport,
  },
];

export default function CsoReport() {
  const [activeTab, setActiveTab] = useState(() => TAB_DEFINITIONS[0].key);

  const ActiveComponent = useMemo(() => {
    const current = TAB_DEFINITIONS.find((tab) => tab.key === activeTab);
    return current?.component ?? TAB_DEFINITIONS[0].component;
  }, [activeTab]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">CSO Reports</h1>
        <p className="max-w-3xl text-sm text-slate-500">
          Monitor CSO performance trends with weekly disbursement tracking and monthly portfolio insights.
        </p>

        <nav className="flex flex-wrap gap-2">
          {TAB_DEFINITIONS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isActive
                    ? "border-indigo-500 bg-indigo-500 text-white shadow"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <p className="text-xs text-slate-400">
          {TAB_DEFINITIONS.find((tab) => tab.key === activeTab)?.description}
        </p>
      </header>

      <section>
        <ActiveComponent />
      </section>
    </div>
  );
}
