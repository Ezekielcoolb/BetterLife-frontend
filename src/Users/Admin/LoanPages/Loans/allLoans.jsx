import { useState } from "react";
import CsoLoans from "./csoLoans";
import CustomerLoans from "./customerLoans";
import OverdueLoans from "./overdueLoans";

const tabs = [
  { id: "cso", label: "CSO Loans" },
  { id: "customer", label: "Customer Loans" },
  { id: "overdue", label: "Overdue Loans" },
];

export default function AllLoans() {
  const [activeTab, setActiveTab] = useState("cso");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6 space-y-6">
        <div className={activeTab === "cso" ? "block" : "hidden"}>
          <CsoLoans />
        </div>
        <div className={activeTab === "customer" ? "block" : "hidden"}>
          <CustomerLoans />
        </div>
        <div className={activeTab === "overdue" ? "block" : "hidden"}>
          <OverdueLoans />
        </div>
      </div>
    </div>
  );
}
