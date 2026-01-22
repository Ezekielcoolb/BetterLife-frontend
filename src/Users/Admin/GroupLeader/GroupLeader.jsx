import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MoreVertical, CheckCircle, Edit, Trash2, Users, User, Phone, Calendar, Shield, Eye, ArrowRightLeft, Filter } from "lucide-react";
import { fetchGroupLeaders, approveGroupLeader, updateGroupLeader, deleteGroupLeader, clearGroupLeaderError, transferGroupToCso } from "../../../redux/slices/groupLeaderSlice";
import { fetchCsos } from "../../../redux/slices/csoSlice";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = "https://api.betterlifeloan.com"

const STATUS_BADGE_STYLES = {
  "waiting for approval": "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
};

function getStatusBadgeClass(status) {
  return STATUS_BADGE_STYLES[status] || "bg-slate-100 text-slate-700 border-slate-200";
}

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function GroupLeader() {
  const dispatch = useDispatch();
  const { items, loading, updatingId, deletingId, transferringId, error } = useSelector((state) => state.groupLeader);
  const { items: csos } = useSelector((state) => state.cso);

  const [filterCsoId, setFilterCsoId] = useState("");
  const [updateModal, setUpdateModal] = useState({ open: false, groupLeader: null });
  const [viewModal, setViewModal] = useState({ open: false, groupLeader: null });
  const [transferModal, setTransferModal] = useState({ open: false, groupLeader: null });
  const [targetCsoId, setTargetCsoId] = useState("");
  const [actionMenu, setActionMenu] = useState({ open: false, groupLeaderId: null });
  const [updateForm, setUpdateForm] = useState({
    groupName: "",
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    dispatch(fetchCsos());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchGroupLeaders(filterCsoId || null));
  }, [dispatch, filterCsoId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenu.open && !event.target.closest('.action-menu-container')) {
        setActionMenu({ open: false, groupLeaderId: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenu.open]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearGroupLeaderError());
    }
  }, [error, dispatch]);

  const handleApprove = async (id) => {
    try {
      await dispatch(approveGroupLeader(id)).unwrap();
      toast.success("Group leader approved");
    } catch (error) {
      toast.error(error || "Unable to approve group leader");
    }
  };

  const handleUpdate = (groupLeader) => {
    setUpdateForm({
      groupName: groupLeader.groupName,
      firstName: groupLeader.firstName,
      lastName: groupLeader.lastName,
      address: groupLeader.address,
      phone: groupLeader.phone,
    });
    setUpdateModal({ open: true, groupLeader });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(updateGroupLeader({ 
        id: updateModal.groupLeader._id, 
        ...updateForm 
      })).unwrap();
      toast.success("Group leader updated successfully");
      setUpdateModal({ open: false, groupLeader: null });
    } catch (error) {
      toast.error(error || "Unable to update group leader");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group leader?")) {
      return;
    }

    try {
      await dispatch(deleteGroupLeader(id)).unwrap();
      toast.success("Group leader deleted");
    } catch (error) {
      toast.error(error || "Unable to delete group leader");
    }
  };

  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!targetCsoId) return;

    try {
      const result = await dispatch(transferGroupToCso({ 
        groupLeaderId: transferModal.groupLeader._id, 
        newCsoId: targetCsoId 
      })).unwrap();
      toast.success(`Group transferred successfully. ${result.loansTransferred} loan(s) updated.`);
      setTransferModal({ open: false, groupLeader: null });
      setTargetCsoId("");
    } catch (error) {
      toast.error(error || "Unable to transfer group");
    }
  };

  const handleView = (groupLeader) => {
    setViewModal({ open: true, groupLeader });
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Group Leaders</h1>
          <p className="text-sm text-slate-500">
            Manage group leaders and their approval status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={filterCsoId}
              onChange={(e) => setFilterCsoId(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All CSOs</option>
              {csos.map(cso => (
                <option key={cso._id} value={cso._id}>{cso.firstName} {cso.lastName}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => dispatch(fetchGroupLeaders(filterCsoId || null))}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16M4 4l16 0M4 4l0 16" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <Users className="h-8 w-8 text-slate-400" />
          <div>
            <h3 className="text-lg font-semibold text-slate-700">No group leaders yet</h3>
            <p className="text-sm text-slate-500">Group leaders will appear here once CSOs add them.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Group Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Group Leader Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  CSO Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((groupLeader) => (
                <tr key={groupLeader._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {groupLeader.groupName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {groupLeader.firstName} {groupLeader.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {groupLeader.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {groupLeader.csoName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${getStatusBadgeClass(groupLeader.status)}`}>
                      <Shield className="h-3 w-3" />
                      {groupLeader.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(groupLeader)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      
                      <div className="relative action-menu-container">
                        <button
                          onClick={() => setActionMenu({ open: true, groupLeaderId: groupLeader._id })}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {actionMenu.open && actionMenu.groupLeaderId === groupLeader._id && (
                          <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                            <div className="py-1">
                              {groupLeader.status === "waiting for approval" && (
                                <button
                                  onClick={() => {
                                    handleApprove(groupLeader._id);
                                    setActionMenu({ open: false, groupLeaderId: null });
                                  }}
                                  disabled={updatingId === groupLeader._id}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {updatingId === groupLeader._id ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-600 border-t-transparent"></div>
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                  )}
                                  Approve
                                </button>
                              )}

                                {groupLeader.status === "approved" && (
                                  <button
                                    onClick={() => {
                                      handleUpdate(groupLeader);
                                      setActionMenu({ open: false, groupLeaderId: null });
                                    }}
                                    disabled={updatingId === groupLeader._id}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {updatingId === groupLeader._id ? (
                                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-600 border-t-transparent"></div>
                                    ) : (
                                      <Edit className="h-4 w-4 text-indigo-600" />
                                    )}
                                    Update
                                  </button>
                                )}

                                {groupLeader.status === "approved" && (
                                  <button
                                    onClick={() => {
                                      setTransferModal({ open: true, groupLeader });
                                      setActionMenu({ open: false, groupLeaderId: null });
                                    }}
                                    disabled={transferringId === groupLeader._id}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {transferringId === groupLeader._id ? (
                                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-600 border-t-transparent"></div>
                                    ) : (
                                      <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
                                    )}
                                    Transfer to CSO
                                  </button>
                                )}

                              {groupLeader.status !== "rejected" && (
                                <button
                                  onClick={() => {
                                    handleDelete(groupLeader._id);
                                    setActionMenu({ open: false, groupLeaderId: null });
                                  }}
                                  disabled={deletingId === groupLeader._id}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {deletingId === groupLeader._id ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-rose-600 border-t-transparent"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-rose-600" />
                                  )}
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div className="flex items-center gap-2 text-slate-800">
                <Eye className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Group Leader Details</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewModal({ open: false, groupLeader: null })}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Group Name</label>
                    <p className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50">
                      {viewModal.groupLeader.groupName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Status</label>
                    <div className="mt-1">
                      <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${getStatusBadgeClass(viewModal.groupLeader.status)}`}>
                        <Shield className="h-3 w-3" />
                        {viewModal.groupLeader.status}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">First Name</label>
                    <p className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50">
                      {viewModal.groupLeader.firstName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Last Name</label>
                    <p className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50">
                      {viewModal.groupLeader.lastName}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Address</label>
                  <p className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 min-h-[80px]">
                    {viewModal.groupLeader.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                    <p className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50">
                      {viewModal.groupLeader.phone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">CSO Name</label>
                    <p className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50">
                      {viewModal.groupLeader.csoName}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Created Date</label>
                  <p className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50">
                    {formatDate(viewModal.groupLeader.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewModal({ open: false, groupLeader: null })}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {updateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div className="flex items-center gap-2 text-slate-800">
                <Edit className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Update Group Leader</h2>
              </div>
              <button
                type="button"
                onClick={() => setUpdateModal({ open: false, groupLeader: null })}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-5">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Group Name</label>
                  <input
                    type="text"
                    name="groupName"
                    value={updateForm.groupName}
                    onChange={handleUpdateFormChange}
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={updateForm.firstName}
                      onChange={handleUpdateFormChange}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={updateForm.lastName}
                      onChange={handleUpdateFormChange}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Address</label>
                  <textarea
                    name="address"
                    value={updateForm.address}
                    onChange={handleUpdateFormChange}
                    rows={3}
                    className="mt-1 block w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={updateForm.phone}
                    onChange={handleUpdateFormChange}
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUpdateModal({ open: false, groupLeader: null })}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId === updateModal.groupLeader?._id}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingId === updateModal.groupLeader?._id ? "Updating..." : "Update Group Leader"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Transfer Modal */}
      {transferModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div className="flex items-center gap-2 text-slate-800">
                <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Transfer Group to CSO</h2>
              </div>
              <button
                type="button"
                onClick={() => setTransferModal({ open: false, groupLeader: null })}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleTransfer} className="p-6 space-y-5">
              <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                <div className="flex gap-3">
                  <ArrowRightLeft className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800">Important Note</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Transferring this group will automatically move all associated loans to the new CSO. 
                      Loan details like CSO Name, CSO ID, Signature, and Branch will be updated to match the new CSO.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Select Destination CSO</label>
                <select
                  value={targetCsoId}
                  onChange={(e) => setTargetCsoId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Choose a CSO --</option>
                  {csos
                    .filter(cso => cso._id !== transferModal.groupLeader.csoId)
                    .map(cso => (
                      <option key={cso._id} value={cso._id}>
                        {cso.firstName} {cso.lastName} ({cso.branch})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModal({ open: false, groupLeader: null })}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferringId === transferModal.groupLeader._id || !targetCsoId}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {transferringId === transferModal.groupLeader._id ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}