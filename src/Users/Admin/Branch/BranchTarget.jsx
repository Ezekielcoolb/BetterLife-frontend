import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchBranches,
  updateBranchTargets,
  clearBranchError,
} from "../../../redux/slices/branchSlice";

export default function BranchTarget() {
  const dispatch = useDispatch();
  const { items: branches, loading, error } = useSelector((state) => state.branch);
  const [targetSelection, setTargetSelection] = useState("");
  const [targets, setTargets] = useState({ loanTarget: "", disbursementTarget: "" });
  const [saving, setSaving] = useState(false);

  const scope = targetSelection === "all" ? "all" : "single";

  useEffect(() => {
    if (!branches.length) {
      dispatch(fetchBranches());
    }
  }, [dispatch, branches.length]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearBranchError());
    }
  }, [error, dispatch]);

  const selectedBranch = useMemo(() => {
    if (scope !== "single") {
      return null;
    }

    return branches.find((branch) => branch._id === targetSelection) || null;
  }, [branches, scope, targetSelection]);

  useEffect(() => {
    if (scope === "single" && selectedBranch) {
      setTargets({
        loanTarget: selectedBranch.loanTarget ?? 0,
        disbursementTarget: selectedBranch.disbursementTarget ?? 0,
      });
      return;
    }

    if (scope === "all") {
      setTargets({ loanTarget: "", disbursementTarget: "" });
    }
  }, [scope, selectedBranch]);

  const handleTargetSelectionChange = (event) => {
    setTargetSelection(event.target.value);
  };

  const handleTargetChange = (field) => (event) => {
    setTargets((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const resetTargets = () => {
    if (scope === "single" && selectedBranch) {
      setTargets({
        loanTarget: selectedBranch.loanTarget ?? 0,
        disbursementTarget: selectedBranch.disbursementTarget ?? 0,
      });
      return;
    }

    setTargets({ loanTarget: "", disbursementTarget: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isSingleScope = scope === "single";

    if (isSingleScope && !targetSelection) {
      toast.error("Select a branch first");
      return;
    }

    const loanTargetNumber = targets.loanTarget === "" ? null : Number(targets.loanTarget);
    const disbursementTargetNumber =
      targets.disbursementTarget === "" ? null : Number(targets.disbursementTarget);

    if (
      (loanTargetNumber !== null && Number.isNaN(loanTargetNumber)) ||
      (disbursementTargetNumber !== null && Number.isNaN(disbursementTargetNumber))
    ) {
      toast.error("Provide valid numeric targets");
      return;
    }

    if (loanTargetNumber === null && disbursementTargetNumber === null) {
      toast.error("Provide at least one target value");
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        updateBranchTargets({
          scope,
          branchId: isSingleScope ? targetSelection : undefined,
          loanTarget: Number.isFinite(loanTargetNumber) ? loanTargetNumber : undefined,
          disbursementTarget: Number.isFinite(disbursementTargetNumber)
            ? disbursementTargetNumber
            : undefined,
        })
      ).unwrap();
      toast.success("Branch targets updated");
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Branch Targets</h2>
          <p className="text-sm text-slate-500">
            Select a branch, adjust its performance targets, and save the updates in one place.
          </p>
        </header>

        {branches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-500">
              No branches available. Create a branch first before configuring targets.
            </p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="targetScope">
                  Apply Targets To
                </label>
                <select
                  id="targetScope"
                  value={targetSelection}
                  onChange={handleTargetSelectionChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  required
                >
                  <option value="" disabled>
                    Select branch or choose all
                  </option>
                  <option value="all">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="loanTarget">
                  Loan Target
                </label>
                <input
                  id="loanTarget"
                  type="number"
                  value={targets.loanTarget}
                  onChange={handleTargetChange("loanTarget")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g. 2500000"
                  min="0"
                  step="0.01"
                  disabled={scope === "single" && !targetSelection}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="disbursementTarget">
                  Disbursement Target
                </label>
                <input
                  id="disbursementTarget"
                  type="number"
                  value={targets.disbursementTarget}
                  onChange={handleTargetChange("disbursementTarget")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g. 1500000"
                  min="0"
                  step="0.01"
                  disabled={scope === "single" && !targetSelection}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                onClick={resetTargets}
                disabled={scope === "single" && !targetSelection}
              >
                Reset
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={(scope === "single" && !targetSelection) || saving || loading}
              >
                {saving ? "Saving..." : "Save Targets"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
