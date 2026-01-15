import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminLoans,
  clearAdminLoanErrors,
} from "../../../redux/slices/adminLoanSlice";
import {
  AlertCircle,
  BarChart2,
  BadgeCheck,
  Ban,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const PAGE_LIMIT = 10;

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "₦0";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (status) => {
  if (!status) {
    return "—";
  }

  return status
    .split(/\s|_/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const addDays = (value, days) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + days);
  return date;
};

const getCustomerName = (loan) => {
  const first = loan?.customerDetails?.firstName ?? "";
  const last = loan?.customerDetails?.lastName ?? "";
  const fullName = `${first} ${last}`.trim();
  return fullName.length > 0 ? fullName : "Unknown";
};

const getLoanStartDate = (loan) => loan?.disbursedAt || loan?.createdAt || null;

const computeLoanBalance = (loan) => {
  const amountToBePaid = Number(loan?.loanDetails?.amountToBePaid);
  const amountPaid = Number(loan?.loanDetails?.amountPaidSoFar);

  if (!Number.isFinite(amountToBePaid)) {
    return 0;
  }

  if (!Number.isFinite(amountPaid)) {
    return Math.max(amountToBePaid, 0);
  }

  return Math.max(amountToBePaid - amountPaid, 0);
};

const getCompletionDate = (loan) => {
  const payments = Array.isArray(loan?.loanDetails?.dailyPayment)
    ? loan.loanDetails.dailyPayment
    : [];

  const paymentDates = payments
    .map((item) => (item?.date ? new Date(item.date) : null))
    .filter((date) => date && !Number.isNaN(date.getTime()));

  if (paymentDates.length > 0) {
    const latest = paymentDates.reduce((latestDate, current) =>
      current > latestDate ? current : latestDate
    );
    return latest;
  }

  if (loan?.updatedAt) {
    const updated = new Date(loan.updatedAt);
    if (!Number.isNaN(updated.getTime())) {
      return updated;
    }
  }

  return null;
};

const statusStyles = {
  "active loan": "bg-emerald-100 text-emerald-700",
  "waiting for approval": "bg-amber-100 text-amber-700",
  approved: "bg-sky-100 text-sky-700",
  "fully paid": "bg-indigo-100 text-indigo-700",
  rejected: "bg-rose-100 text-rose-700",
};

const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase();
  const style = statusStyles[normalized] ?? "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {formatStatus(status)}
    </span>
  );
};

const tableConfigurations = {
  all: {
    columns: [
      { key: "customer", label: "Customer", align: "left", className: "min-w-[180px]" },
      { key: "amountRequested", label: "Amount Requested", align: "right" },
      { key: "createdAt", label: "Date Created", align: "left" },
      { key: "amountApproved", label: "Amount Approved", align: "right" },
      { key: "csoName", label: "CSO Name", align: "left" },
      { key: "status", label: "Status", align: "center" },
    ],
    mapLoan: (loan) => ({
      id: loan?._id || loan?.loanId,
      customer: (
        <div>
          <div className="font-semibold text-slate-800">{getCustomerName(loan)}</div>
          <div className="text-xs text-slate-400">{loan?.loanId || "—"}</div>
        </div>
      ),
      amountRequested: formatCurrency(loan?.loanDetails?.amountRequested),
      createdAt: formatDate(loan?.createdAt),
      amountApproved: formatCurrency(loan?.loanDetails?.amountApproved),
      csoName: loan?.csoName || "—",
      status: <StatusBadge status={loan?.status} />,
    }),
  },
  active: {
    columns: [
      { key: "customer", label: "Customer", align: "left", className: "min-w-[180px]" },
      { key: "csoName", label: "CSO Name", align: "left" },
      { key: "amountToBePaid", label: "Amount To Be Paid", align: "right" },
      { key: "amountPaid", label: "Amount Paid So Far", align: "right" },
      { key: "startDate", label: "Start Date", align: "left" },
      { key: "endDate", label: "End Date", align: "left" },
      { key: "loanBalance", label: "Loan Balance", align: "right" },
    ],
    mapLoan: (loan) => {
      const startDate = getLoanStartDate(loan);
      const endDate = addDays(startDate, 30);
      const balance = computeLoanBalance(loan);

      return {
        id: loan?._id || loan?.loanId,
        customer: (
          <div>
            <div className="font-semibold text-slate-800">{getCustomerName(loan)}</div>
            <div className="text-xs text-slate-400">{loan?.loanId || "—"}</div>
          </div>
        ),
        csoName: loan?.csoName || "—",
        amountToBePaid: formatCurrency(loan?.loanDetails?.amountToBePaid),
        amountPaid: formatCurrency(loan?.loanDetails?.amountPaidSoFar),
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        loanBalance: formatCurrency(balance),
      };
    },
  },
  pending: {
    columns: [
      { key: "customer", label: "Customer", align: "left", className: "min-w-[180px]" },
      { key: "amountRequested", label: "Amount Requested", align: "right" },
      { key: "createdAt", label: "Date Submitted", align: "left" },
      { key: "csoName", label: "CSO Name", align: "left" },
      { key: "status", label: "Status", align: "center" },
    ],
    mapLoan: (loan) => ({
      id: loan?._id || loan?.loanId,
      customer: (
        <div>
          <div className="font-semibold text-slate-800">{getCustomerName(loan)}</div>
          <div className="text-xs text-slate-400">{loan?.loanId || "—"}</div>
        </div>
      ),
      amountRequested: formatCurrency(loan?.loanDetails?.amountRequested),
      createdAt: formatDate(loan?.createdAt),
      csoName: loan?.csoName || "—",
      status: <StatusBadge status={loan?.status} />,
    }),
  },
  rejected: {
    columns: [
      { key: "customer", label: "Customer", align: "left", className: "min-w-[200px]" },
      { key: "csoName", label: "CSO Name", align: "left" },
      { key: "amountRequested", label: "Amount Requested", align: "right" },
      { key: "createdAt", label: "Date Submitted", align: "left" },
      { key: "reason", label: "Reason for Rejection", align: "left", className: "min-w-[220px]" },
    ],
    mapLoan: (loan) => ({
      id: loan?._id || loan?.loanId,
      customer: (
        <div>
          <div className="font-semibold text-slate-800">{getCustomerName(loan)}</div>
          <div className="text-xs text-slate-400">{loan?.loanId || "—"}</div>
        </div>
      ),
      csoName: loan?.csoName || "—",
      amountRequested: formatCurrency(loan?.loanDetails?.amountRequested),
      createdAt: formatDate(loan?.createdAt),
      reason: loan?.rejectionReason?.trim() || "—",
    }),
  },
  fullyPaid: {
    columns: [
      { key: "customer", label: "Customer", align: "left", className: "min-w-[180px]" },
      { key: "csoName", label: "CSO Name", align: "left" },
      { key: "amountToBePaid", label: "Amount To Be Paid", align: "right" },
      { key: "amountPaid", label: "Amount Paid", align: "right" },
      { key: "startDate", label: "Start Date", align: "left" },
      { key: "completionDate", label: "Completion Date", align: "left" },
      { key: "status", label: "Status", align: "center" },
    ],
    mapLoan: (loan) => {
      const startDate = getLoanStartDate(loan);
      const completion = getCompletionDate(loan);

      return {
        id: loan?._id || loan?.loanId,
        customer: (
          <div>
            <div className="font-semibold text-slate-800">{getCustomerName(loan)}</div>
            <div className="text-xs text-slate-400">{loan?.loanId || "—"}</div>
          </div>
        ),
        csoName: loan?.csoName || "—",
        amountToBePaid: formatCurrency(loan?.loanDetails?.amountToBePaid),
        amountPaid: formatCurrency(loan?.loanDetails?.amountPaidSoFar),
        startDate: formatDate(startDate),
        completionDate: formatDate(completion),
        status: <StatusBadge status={loan?.status} />,
      };
    },
  },
};

const tabDefinitions = [
  {
    id: "all",
    label: "All Loans",
    status: "all",
    countKey: "total",
    configKey: "all",
  },
  {
    id: "active",
    label: "Active Loans",
    status: "active loan",
    countKey: "active",
    configKey: "active",
  },
  {
    id: "pending",
    label: "Pending Loans",
    status: "waiting for approval",
    countKey: "pending",
    configKey: "pending",
  },
  {
    id: "rejected",
    label: "Rejected Loans",
    status: "rejected",
    countKey: "rejected",
    configKey: "rejected",
  },
  {
    id: "fullyPaid",
    label: "Fully Paid",
    status: "fully paid",
    countKey: "fullyPaid",
    configKey: "fullyPaid",
  },
];

const summaryCards = (rawCounts) => {
  const counts = {
    total: 0,
    active: 0,
    fullyPaid: 0,
    pending: 0,
    rejected: 0,
    ...(rawCounts || {}),
  };

  return [
    {
      title: "Total Loans Submitted",
      value: counts.total,
      icon: BarChart2,
      accent: "bg-indigo-100 text-indigo-600",
    },
    {
      title: "Number of Active Loans",
      value: counts.active,
      icon: ShieldCheck,
      accent: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Number of Fully Paid Loans",
      value: counts.fullyPaid,
      icon: BadgeCheck,
      accent: "bg-blue-100 text-blue-600",
    },
    {
      title: "Number of Pending Loans",
      value: counts.pending,
      icon: Clock3,
      accent: "bg-amber-100 text-amber-600",
    },
    {
      title: "Number of Rejected Loans",
      value: counts.rejected,
      icon: Ban,
      accent: "bg-rose-100 text-rose-600",
    },
  ];
};

export default function TransLoan() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(tabDefinitions[0].id);
  const [tabPages, setTabPages] = useState(() =>
    tabDefinitions.reduce((acc, tab) => {
      acc[tab.id] = 1;
      return acc;
    }, {})
  );

  const {
    adminLoans,
    adminLoansLoading,
    adminLoansError,
    adminLoansCounts,
    adminLoansPagination,
  } = useSelector((state) => state.adminLoans);

  const activeTabConfig = useMemo(
    () => tabDefinitions.find((tab) => tab.id === activeTab) ?? tabDefinitions[0],
    [activeTab]
  );

  const currentPage = tabPages[activeTabConfig.id] ?? 1;

  useEffect(() => {
    dispatch(
      fetchAdminLoans({
        status: activeTabConfig.status,
        page: currentPage,
        limit: PAGE_LIMIT,
      })
    );
  }, [dispatch, activeTabConfig.status, currentPage]);

  const counts = useMemo(
    () => ({
      total: 0,
      active: 0,
      fullyPaid: 0,
      pending: 0,
      rejected: 0,
      ...(adminLoansCounts || {}),
    }),
    [adminLoansCounts]
  );

  const tabs = useMemo(
    () =>
      tabDefinitions.map((tab) => ({
        ...tab,
        count: counts[tab.countKey] ?? 0,
      })),
    [counts]
  );

  const handleRefresh = useCallback(() => {
    dispatch(
      fetchAdminLoans({
        status: activeTabConfig.status,
        page: currentPage,
        limit: PAGE_LIMIT,
      })
    );
  }, [dispatch, activeTabConfig.status, currentPage]);

  useEffect(() => {
    if (adminLoansError) {
      // reset error after showing it once to avoid persistent banners
      const timer = setTimeout(() => dispatch(clearAdminLoanErrors()), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [adminLoansError, dispatch]);

  const currentConfig =
    tableConfigurations[activeTabConfig.configKey] ?? tableConfigurations.all;
  const currentLoans = Array.isArray(adminLoans) ? adminLoans : [];

  const pagination = useMemo(
    () => ({
      page: adminLoansPagination?.page || 1,
      limit: adminLoansPagination?.limit || PAGE_LIMIT,
      totalItems: adminLoansPagination?.totalItems || 0,
      totalPages: adminLoansPagination?.totalPages || 1,
    }),
    [adminLoansPagination]
  );

  const startItem = pagination.totalItems > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem = pagination.totalItems > 0 ? startItem + currentLoans.length - 1 : 0;

  const updateTabPage = useCallback((tabId, newPage) => {
    setTabPages((prev) => {
      const currentValue = prev[tabId] ?? 1;
      if (currentValue === newPage) {
        return prev;
      }

      return {
        ...prev,
        [tabId]: newPage,
      };
    });
  }, []);

  const handlePrevPage = useCallback(() => {
    if (pagination.page > 1) {
      updateTabPage(activeTabConfig.id, pagination.page - 1);
    }
  }, [pagination.page, activeTabConfig.id, updateTabPage]);

  const handleNextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages && pagination.totalItems > 0) {
      updateTabPage(activeTabConfig.id, pagination.page + 1);
    }
  }, [pagination.page, pagination.totalPages, pagination.totalItems, activeTabConfig.id, updateTabPage]);

  return (
    <div className="space-y-8">
      <section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards(counts).map(({ title, value, icon: Icon, accent }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-2 ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {title}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Loan Overview</h2>
            <p className="text-sm text-slate-500">
              Review all submitted loans and switch between status-specific views.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={adminLoansLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adminLoansLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {adminLoansLoading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <div className="border-b border-slate-200 px-6">
          <nav className="-mb-px flex flex-wrap gap-4">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id !== activeTab) {
                      setActiveTab(tab.id);
                      updateTabPage(tab.id, 1);
                    }
                  }}
                  className={`whitespace-nowrap border-b-2 pb-3 pt-4 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1 text-xs font-semibold text-slate-600">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {adminLoansError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{adminLoansError}</span>
              </div>
            </div>
          )}

          {adminLoansLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : currentLoans.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
              <BarChart2 className="h-10 w-10 text-slate-300" />
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  No loans found for this view
                </p>
                <p className="text-sm text-slate-500">
                  Try refreshing or switching to another status tab.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {currentConfig.columns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-4 py-3 text-left text-sm font-semibold text-slate-600 ${
                          column.align === "right"
                            ? "text-right"
                            : column.align === "center"
                            ? "text-center"
                            : "text-left"
                        } ${column.className ?? ""}`.trim()}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {currentLoans.map((loan) => {
                    const row = currentConfig.mapLoan(loan);

                    return (
                      <tr key={row.id || loan?._id || loan?.loanId} className="hover:bg-slate-50/70">
                        {currentConfig.columns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-4 py-3 text-slate-700 ${
                              column.align === "right"
                                ? "text-right"
                                : column.align === "center"
                                ? "text-center"
                                : "text-left"
                            }`}
                          >
                            {row[column.key] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                <p>
                  {pagination.totalItems > 0
                    ? `Showing ${startItem}-${endItem} of ${pagination.totalItems}`
                    : "No records to display"}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={pagination.page <= 1 || adminLoansLoading}
                    className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={
                      pagination.page >= pagination.totalPages ||
                      pagination.totalItems === 0 ||
                      adminLoansLoading
                    }
                    className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
