import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Building2 } from "lucide-react";
import AnnualTransaction from "./AnnualTransaction";
import BranchCso from "./BranchCso";
import BranchCustomer from "./BranchCustomer";
import { fetchBranches } from "../../../redux/slices/branchSlice";

const tabs = [
  {
    id: "annual-transactions",
    label: "Annual Transactions",
  },
  {
    id: "branch-csos",
    label: "CSO Performance",
  },
  {
    id: "branch-customers",
    label: "Customers",
  },
];

export default function BranchDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items: branches, loading } = useSelector((state) => state.branch);
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  useEffect(() => {
    if (!branches || branches.length === 0) {
      dispatch(fetchBranches());
    }
  }, [dispatch, branches?.length]);

  const branch = useMemo(() => {
    return branches?.find((entry) => entry._id === id) || null;
  }, [branches, id]);

  const branchName = branch?.name || "Branch";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Building2 className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
              Branch Details
            </p>
            <h1 className="text-2xl font-bold text-slate-900">{branchName}</h1>
            <p className="text-sm text-slate-500">
              Dive into this branch&rsquo;s performance, targets, and transactional history.
            </p>
          </div>
        </div>
        <Link
          to="/admin/branch"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to branches
        </Link>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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

        <div className="p-6">
          {activeTab === "annual-transactions" ? (
            <AnnualTransaction branchId={id} />
          ) : null}
          {activeTab === "branch-csos" ? <BranchCso branchId={id} /> : null}
          {activeTab === "branch-customers" ? <BranchCustomer branchId={id} /> : null}
        </div>
      </section>

      {!branch && !loading ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          This branch is no longer available. It may have been removed or the link is invalid.
        </div>
      ) : null}
    </div>
  );
}
