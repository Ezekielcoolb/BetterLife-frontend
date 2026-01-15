
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  Loader2,
  ArrowRightLeft,
  CheckSquare,
  Square,
  Filter,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchCsoCustomers,
  fetchCsoGroupLeaders,
  assignCustomersToGroup,
  assignCustomersToCso,
} from "../../../redux/slices/adminLoanSlice";

export default function CsoCustomersTab({ csoId }) {
  const dispatch = useDispatch();
  const {
    csoLoans: customers,
    csoLoansCso,
    csoLoansLoading: loading,
    csoLoansPagination,
    groupLeaders,
    groupLeadersLoading,
    updating,
  } = useSelector((state) => state.adminLoans);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("");
  const [selectedLoans, setSelectedLoans] = useState(new Set());
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetGroupLeaderId, setTargetGroupLeaderId] = useState("");
  const [isAssignCsoModalOpen, setIsAssignCsoModalOpen] = useState(false);
  const [targetCsoId, setTargetCsoId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const needsAssignmentCount = useMemo(
    () => customers.filter((customer) => customer.requiresCsoAssignment).length,
    [customers]
  );

  useEffect(() => {
    if (csoId) {
      dispatch(
        fetchCsoCustomers({
          csoId,
          search: searchQuery,
          groupId: filterGroupId,
          page,
          limit,
        })
      );
    }
  }, [dispatch, csoId, searchQuery, filterGroupId, page, limit, updating]);

  useEffect(() => {
    if (csoId) {
      dispatch(fetchCsoGroupLeaders(csoId));
    }
  }, [dispatch, csoId]);

  useEffect(() => {
    if (csoLoansPagination?.page && csoLoansPagination.page !== page) {
      setPage(csoLoansPagination.page);
    }
    if (csoLoansPagination?.limit && csoLoansPagination.limit !== limit) {
      setLimit(csoLoansPagination.limit);
    }
  }, [csoLoansPagination?.page, csoLoansPagination?.limit]);

  useEffect(() => {
    setSelectedLoans(new Set());
  }, [page, limit]);

  const toggleSelectAll = () => {
    if (selectedLoans.size === customers.length) {
      setSelectedLoans(new Set());
    } else {
      setSelectedLoans(new Set(customers.map((c) => c._id)));
    }
  };

  const toggleSelectOne = (id) => {
    const newSelected = new Set(selectedLoans);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLoans(newSelected);
  };

  const handleTransfer = async () => {
    if (!targetGroupLeaderId) return;

    try {
      await dispatch(
        assignCustomersToGroup({
          loanIds: Array.from(selectedLoans),
          groupLeaderId: targetGroupLeaderId,
        })
      ).unwrap();
      toast.success("Customers transferred successfully");
      setIsTransferModalOpen(false);
      setSelectedLoans(new Set());
      setTargetGroupLeaderId("");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Failed to transfer customers");
    }
  };

  const handleAssignCso = async () => {
    if (!targetCsoId) return;

    try {
      await dispatch(
        assignCustomersToCso({
          loanIds: Array.from(selectedLoans),
          csoId: targetCsoId,
        })
      ).unwrap();
      toast.success("Customers reassigned successfully");
      setIsAssignCsoModalOpen(false);
      setSelectedLoans(new Set());
      setTargetCsoId("");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Failed to reassign customers");
    }
  };

  const getGroupName = (customer) => {
    return customer.groupDetails?.groupName || "Ungrouped";
  };

  const getLeaderName = (customer) => {
    return customer.groupDetails?.leaderName || "-";
  };

  const highlightClass = (loan) =>
    loan.requiresCsoAssignment ? "bg-amber-50" : "";

  const totalPages = csoLoansPagination?.totalPages || 1;
  const totalCount = csoLoansPagination?.total || customers.length;
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = totalCount === 0 ? 0 : rangeStart + customers.length - 1;

  const handlePrev = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handleLimitChange = (event) => {
    const newLimit = Number(event.target.value);
    setLimit(newLimit);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handleFilterChange = (event) => {
    setFilterGroupId(event.target.value);
    setPage(1);
  };

  const handleGoToPage = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const inputPage = Number(formData.get("page"));
    if (Number.isFinite(inputPage) && inputPage >= 1 && inputPage <= totalPages) {
      setPage(inputPage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-10 rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={filterGroupId}
              onChange={handleFilterChange}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Groups</option>
              <option value="ungrouped">Ungrouped</option>
              {groupLeaders.map((gl) => (
                <option key={gl._id} value={gl._id}>
                  {gl.groupName}
                </option>
              ))}
            </select>
          </div>

            <select
              value={limit}
              onChange={handleLimitChange}
              className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {[10, 20, 30, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>

            {selectedLoans.size > 0 && (
            <button
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                disabled={updating}
            >
                <ArrowRightLeft className="h-4 w-4" />
                Transfer ({selectedLoans.size})
            </button>
            )}

            {selectedLoans.size > 0 && (
              <button
                onClick={() => setIsAssignCsoModalOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                disabled={updating}
              >
                <UserCheck className="h-4 w-4" />
                Update CSO ({selectedLoans.size})
              </button>
            )}
        </div>
      </div>

      {needsAssignmentCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {needsAssignmentCount} customer{needsAssignmentCount === 1 ? "" : "s"} require CSO reassignment.
            {" "}
            {csoLoansCso?.name ? `Expected CSO: ${csoLoansCso.name}` : ''}
          </span>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-500">Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No customers found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 text-left">
                            <button onClick={toggleSelectAll} className="flex items-center">
                                {selectedLoans.size === customers.length && customers.length > 0 ? (
                                    <CheckSquare className="h-4 w-4 text-indigo-600" />
                                ) : (
                                    <Square className="h-4 w-4 text-slate-400" />
                                )}
                            </button>
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Customer</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Phone</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Group</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Leader</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {customers.map((loan) => (
                        <tr key={loan._id} className={`hover:bg-slate-50/60 ${highlightClass(loan)}`}>
                            <td className="px-4 py-3">
                                <button onClick={() => toggleSelectOne(loan._id)}>
                                    {selectedLoans.has(loan._id) ? (
                                        <CheckSquare className="h-4 w-4 text-indigo-600" />
                                    ) : (
                                        <Square className="h-4 w-4 text-slate-300 hover:text-slate-400" />
                                    )}
                                </button>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">
                                {loan.customerDetails?.firstName} {loan.customerDetails?.lastName}
                                <div className="text-xs text-slate-500">{loan.loanId}</div>
                                {loan.requiresCsoAssignment && (
                                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                    <AlertTriangle className="h-3 w-3" />
                                    CSO mismatch
                                  </div>
                                )}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{loan.customerDetails?.telephone || "-"}</td>
                            <td className="px-4 py-3 text-slate-600">{getGroupName(loan)}</td>
                            <td className="px-4 py-3 text-slate-600">{getLeaderName(loan)}</td>
                             <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    loan.status === 'active loan' ? 'bg-emerald-100 text-emerald-700' : 
                                    loan.status === 'fully paid' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                    {loan.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{rangeStart}-{rangeEnd}</span> of {totalCount.toLocaleString("en-NG")}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
            <form className="flex items-center gap-2" onSubmit={handleGoToPage}>
              <label htmlFor="gotoPage" className="text-sm text-slate-500">
                Go to
              </label>
              <input
                id="gotoPage"
                name="page"
                type="number"
                min="1"
                max={totalPages}
                defaultValue={page}
                className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      )}

      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Transfer Customers</h3>
              <button
                type="button"
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTargetGroupLeaderId("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Move <strong>{selectedLoans.size}</strong> customer{selectedLoans.size === 1 ? "" : "s"} to a different group within this CSO.
            </p>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Select Target Group
              </label>
              {groupLeadersLoading ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading groups...
                </div>
              ) : groupLeaders.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  No groups found for this CSO. Create a group first to enable transfers.
                </div>
              ) : (
                <select
                  value={targetGroupLeaderId}
                  onChange={(event) => setTargetGroupLeaderId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select group...</option>
                  {groupLeaders.map((leader) => (
                    <option key={leader._id} value={leader._id}>
                      {leader.groupName || leader.leaderName || "Unnamed Group"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTargetGroupLeaderId("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={!targetGroupLeaderId || updating || groupLeadersLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                {updating ? "Transferring..." : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAssignCsoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-slate-900">Update CSO Assignment</h3>
            <p className="mb-4 text-sm text-slate-600">
              Reassign <strong>{selectedLoans.size}</strong> customer{selectedLoans.size === 1 ? "" : "s"} to a CSO.
            </p>

            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-slate-700">Select CSO</label>
              <input
                type="text"
                value={csoLoansCso?.name || ""}
                disabled
                className="mb-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                placeholder="Current CSO"
              />
              <select
                value={targetCsoId}
                onChange={(e) => setTargetCsoId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select CSO...</option>
                <option value={csoId}>Assign to current CSO</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAssignCsoModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCso}
                disabled={!targetCsoId || updating}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update CSO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
