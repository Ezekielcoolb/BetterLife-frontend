import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  createBranch,
  deleteBranch,
  fetchBranches,
  clearBranchError,
} from "../../redux/slices/branchSlice";

const emptyBranchForm = {
  name: "",
  supervisorName: "",
  supervisorEmail: "",
  supervisorPhone: "",
  address: "",
  city: "",
  state: "",
  country: "",
};

export default function Branch() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: branches, loading, error } = useSelector((state) => state.branch);
  const [branchForm, setBranchForm] = useState(emptyBranchForm);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatTarget = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return "—";
    }
    return numeric.toLocaleString();
  };

  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearBranchError());
    }
  }, [error, dispatch]);
  const isFormValid = useMemo(() => Object.values(branchForm).every((value) => value.trim() !== ""), [branchForm]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setBranchForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitBranch = async (event) => {
    event.preventDefault();
    if (!isFormValid) {
      toast.error("All fields are required");
      return;
    }

    try {
      await dispatch(createBranch(branchForm)).unwrap();
      toast.success("Branch created");
      setBranchForm(emptyBranchForm);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err);
    }
  };

  const handleDelete = async (branchId) => {
    const confirmed = window.confirm("Delete this branch permanently?");
    if (!confirmed) return;

    try {
      await dispatch(deleteBranch(branchId)).unwrap();
      toast.success("Branch deleted");
    } catch (err) {
      toast.error(err);
    }
  };
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Branches</h2>
            <p className="text-sm text-slate-500">
              Monitor your active branches, adjust performance targets, or remove obsolete entries.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            onClick={() => {
              setBranchForm(emptyBranchForm);
              setIsModalOpen(true);
            }}
          >
            Add Branch
          </button>
        </header>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Existing Branches</h2>
            <p className="text-sm text-slate-500">Manage active branches, update targets, or remove obsolete entries.</p>
          </div>
        </header>

        {branches.length === 0 ? (
          <p className="text-sm text-slate-500">No branches yet. Create your first branch to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Branch</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Supervisor</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Location</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Loan Target</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Disbursement Target</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.map((branch) => (
                  <tr key={branch._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{branch.name}</div>
                      <div className="text-xs text-slate-500">
                        Created {new Date(branch.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{branch.supervisorName}</div>
                      <div className="text-xs text-slate-500">{branch.supervisorEmail}</div>
                      <div className="text-xs text-slate-500">{branch.supervisorPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{branch.address}</div>
                      <div className="text-xs text-slate-500">
                        {branch.city}, {branch.state}, {branch.country}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">{formatTarget(branch.loanTarget)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">{formatTarget(branch.disbursementTarget)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-500 hover:text-indigo-600"
                          onClick={() => navigate(`/admin/branch/${branch._id}`)}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                          onClick={() => handleDelete(branch._id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Create Branch</h3>
                <p className="text-sm text-slate-500">
                  Define a new branch and assign the responsible supervisor details.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>

            <form className="grid flex-1 overflow-y-auto gap-4 px-6 py-6 md:grid-cols-2" onSubmit={submitBranch}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
                  Branch Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={branchForm.name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g. Lagos Mainland"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="supervisorName">
                  Supervisor Name
                </label>
                <input
                  id="supervisorName"
                  name="supervisorName"
                  value={branchForm.supervisorName}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Supervisor full name"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="supervisorEmail">
                  Supervisor Email
                </label>
                <input
                  id="supervisorEmail"
                  name="supervisorEmail"
                  type="email"
                  value={branchForm.supervisorEmail}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="example@company.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="supervisorPhone">
                  Supervisor Phone
                </label>
                <input
                  id="supervisorPhone"
                  name="supervisorPhone"
                  value={branchForm.supervisorPhone}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Phone number"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  value={branchForm.address}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Street address"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  value={branchForm.city}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="state">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  value={branchForm.state}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="State"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="country">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  value={branchForm.country}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Country"
                  required
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={() => setBranchForm(emptyBranchForm)}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!isFormValid || loading}
                >
                  {loading ? "Saving..." : "Save Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
