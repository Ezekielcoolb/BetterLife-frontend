import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchInterest,
  saveInterest,
  clearInterestError,
} from "../../../redux/slices/interestSlice";

export default function InterestManager() {
  const dispatch = useDispatch();
  const { current, loading, saving, error, hasLoaded } = useSelector((state) => state.interest);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const formattedUpdatedAt = useMemo(() => {
    if (!current?.createdAt) {
      return null;
    }

    const date = new Date(current.createdAt);
    return Number.isNaN(date.valueOf()) ? null : date.toLocaleString();
  }, [current]);

  useEffect(() => {
    if (!hasLoaded && !loading) {
      dispatch(fetchInterest());
    }
  }, [hasLoaded, loading, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearInterestError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (current) {
      setAmount(current.amount ?? "");
      setDescription(current.description ?? "");
    }
  }, [current]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const numericAmount = amount === "" ? null : Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      toast.error("Enter a valid non-negative amount");
      return;
    }

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    try {
      await dispatch(
        saveInterest({
          amount: Number(numericAmount.toFixed(2)),
          description: description.trim(),
        })
      ).unwrap();
      toast.success("Interest saved");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to save interest");
    }
  };

  const handleReset = () => {
    if (current) {
      setAmount(current.amount ?? "");
      setDescription(current.description ?? "");
    } else {
      setAmount("");
      setDescription("");
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Interest Configuration</h2>
        <p className="text-sm text-slate-500">
          Update the global interest amount used during loan approval. Saving a new value replaces the
          previous record automatically.
        </p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="interestAmount">
              Interest Amount
            </label>
            <input
              id="interestAmount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="e.g. 0.1"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="interestDescription"
            >
              Description
            </label>
            <input
              id="interestDescription"
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Describe this interest (e.g. 'Standard 10% rate')"
            />
          </div>
        </div>

        {formattedUpdatedAt && (
          <p className="text-xs text-slate-500">
            Last updated: <span className="font-medium">{formattedUpdatedAt}</span>
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            onClick={handleReset}
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Interest"}
          </button>
        </div>
      </form>
    </section>
  );
}
