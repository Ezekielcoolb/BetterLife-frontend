import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchCsos,
  updateDefaultingTarget,
  clearCsoError,
} from "../../../redux/slices/csoSlice";

export default function CsoDefaultingTarget() {
  const dispatch = useDispatch();
  const {
    items: csos,
    listLoading,
    saving,
    error,
  } = useSelector((state) => state.cso);

  const [targetSelection, setTargetSelection] = useState("");
  const [targetValue, setTargetValue] = useState("");

  const scope = targetSelection === "all" ? "all" : "single";

  useEffect(() => {
    if (!csos.length && !listLoading) {
      dispatch(fetchCsos({ limit: 100 }));
    }
  }, [csos.length, listLoading, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCsoError());
    }
  }, [error, dispatch]);

  const selectedCso = useMemo(() => {
    if (scope !== "single") {
      return null;
    }

    return csos.find((cso) => cso._id === targetSelection) || null;
  }, [csos, scope, targetSelection]);

  useEffect(() => {
    if (scope === "single" && selectedCso) {
      setTargetValue(selectedCso.defaultingTarget ?? 0);
      return;
    }

    if (scope === "all") {
      setTargetValue("");
    }
  }, [scope, selectedCso]);

  const handleSelectionChange = (event) => {
    setTargetSelection(event.target.value);
  };

  const handleTargetChange = (event) => {
    setTargetValue(event.target.value);
  };

  const resetForm = () => {
    if (scope === "single" && selectedCso) {
      setTargetValue(selectedCso.defaultingTarget ?? 0);
      return;
    }

    setTargetValue("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isSingleScope = scope === "single";

    if (isSingleScope && !targetSelection) {
      toast.error("Select a CSO first");
      return;
    }

    const numericTarget = targetValue === "" ? null : Number(targetValue);

    if (numericTarget === null || Number.isNaN(numericTarget) || numericTarget < 0) {
      toast.error("Provide a valid non-negative number");
      return;
    }

    try {
      await dispatch(
        updateDefaultingTarget({
          scope,
          csoId: isSingleScope ? targetSelection : undefined,
          defaultingTarget: numericTarget,
        })
      ).unwrap();
      toast.success("Defaulting target updated");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update defaulting target");
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">CSO Defaulting Targets</h2>
        <p className="text-sm text-slate-500">
          Assign defaulting targets to an individual CSO or roll the same target out to the entire
          team.
        </p>
      </header>

      {csos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">
            No CSOs available. Create CSO profiles before assigning defaulting targets.
          </p>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="targetScope">
                Apply Defaulting Target To
              </label>
              <select
                id="targetScope"
                value={targetSelection}
                onChange={handleSelectionChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              >
                <option value="" disabled>
                  Select CSO or choose all
                </option>
                <option value="all">All CSOs</option>
                {csos.map((cso) => (
                  <option key={cso._id} value={cso._id}>
                    {`${cso.firstName || ""} ${cso.lastName || ""}`.trim() || cso.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="defaultingTarget">
                Defaulting Target
              </label>
              <input
                id="defaultingTarget"
                type="number"
                value={targetValue}
                onChange={handleTargetChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="e.g. 15"
                min="0"
                step="1"
                disabled={scope === "single" && !targetSelection}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              onClick={resetForm}
              disabled={scope === "single" && !targetSelection}
            >
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={(scope === "single" && !targetSelection) || saving}
            >
              {saving ? "Saving..." : "Save Default"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
