import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Users,
} from "lucide-react";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

const PAGE_SIZE = 15;

const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return "₦0.00";
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "₦0.00";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return "0";
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return "0";
  }

  return numeric.toLocaleString();
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const SummaryCard = ({ icon: Icon, title, value, subtitle, accent }) => {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-center gap-4">
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${accent.replace("bg-", "bg-gradient-to-tr from-")} text-white`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          {subtitle ? <p className="text-xs font-medium text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
    </article>
  );
};

export default function BranchCustomer({ branchId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCso, setSelectedCso] = useState("");

  const filtersRef = useRef({ search: "", cso: "", branchId: "" });

  const fetchMetrics = useCallback(
    async ({ searchTerm = "", pageParam = 1, csoIdParam = "" } = {}) => {
      if (!branchId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = {
          page: pageParam,
          limit: PAGE_SIZE,
        };

        if (searchTerm) {
          params.search = searchTerm;
        }

        if (csoIdParam) {
          params.csoId = csoIdParam;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/branches/${branchId}/customer-metrics`,
          {
            params,
          }
        );

        setMetrics(response.data);

        const nextPage = response.data?.pagination?.page;
        if (Number.isFinite(nextPage) && nextPage !== pageParam) {
          setPage(nextPage);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Unable to load customer metrics");
      } finally {
        setLoading(false);
      }
    },
    [branchId]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setSelectedCso("");
    setSearch("");
    filtersRef.current = { search: "", cso: "", branchId: branchId || "" };
  }, [branchId]);

  useEffect(() => {
    if (!branchId) {
      return;
    }

    const filtersChanged =
      filtersRef.current.search !== debouncedSearch ||
      filtersRef.current.cso !== selectedCso ||
      filtersRef.current.branchId !== branchId;

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    filtersRef.current = { search: debouncedSearch, cso: selectedCso, branchId };

    fetchMetrics({
      searchTerm: debouncedSearch,
      pageParam: page,
      csoIdParam: selectedCso,
    });
  }, [branchId, debouncedSearch, page, selectedCso, fetchMetrics]);

  const summaryCards = useMemo(() => {
    const summary = metrics?.summary;

    if (!summary) {
      return [];
    }

    return [
      {
        icon: Users,
        title: "Customers",
        value: formatNumber(summary.totalCustomers),
        subtitle: `${formatNumber(summary.activeCustomers)} active loans`,
        accent: "bg-indigo-500",
      },
      {
        icon: Activity,
        title: "Total Loans",
        value: formatNumber(summary.totalLoans),
        subtitle: "All time within branch",
        accent: "bg-emerald-500",
      },
      {
        icon: AlertTriangle,
        title: "Defaults",
        value: formatNumber(summary.totalDefaults),
        subtitle: "Overall default count",
        accent: "bg-amber-500",
      },
    ];
  }, [metrics]);

  const performanceTone = (score) => {
    if (score >= 90) {
      return "text-emerald-600 bg-emerald-50";
    }
    if (score >= 70) {
      return "text-amber-600 bg-amber-50";
    }
    return "text-rose-600 bg-rose-50";
  };

  const csoOptions = useMemo(() => metrics?.csos || [], [metrics]);
  const pagination = metrics?.pagination;
  const currentPage = pagination?.page ?? page;
  const totalPages = pagination?.totalPages ?? 0;
  const pageSize = pagination?.limit ?? PAGE_SIZE;
  const totalRecords = pagination?.total ?? 0;
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = totalRecords === 0 ? 0 : startIndex + (metrics?.data?.length || 0) - 1;
  const canGoPrev = currentPage > 1;
  const canGoNext = totalPages > 0 && currentPage < totalPages;

  const handleRefresh = () => {
    fetchMetrics({
      searchTerm: debouncedSearch,
      pageParam: currentPage,
      csoIdParam: selectedCso,
    });
  };

  const handleCsoChange = (event) => {
    setSelectedCso(event.target.value);
  };

  const handlePrevPage = () => {
    if (canGoPrev) {
      setPage((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleNextPage = () => {
    if (canGoNext) {
      setPage((prev) => prev + 1);
    }
  };

  if (!branchId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Provide a valid branch identifier to view customers.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          Loading customer metrics…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Customer Portfolio</p>
          <h2 className="text-2xl font-bold text-slate-900">Branch Customers</h2>
          <p className="text-sm text-slate-500">
            Unique customers within the branch, their active obligations, and repayment behaviour.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or BVN"
              className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="relative">
            <select
              value={selectedCso}
              onChange={handleCsoChange}
              className="w-52 appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All CSOs</option>
              {csoOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <CalendarDays className="h-4 w-4" />
            {metrics.branch?.name || "Branch"}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
            onClick={handleRefresh}
            disabled={loading}
          >
            <ChevronLeft className="h-4 w-4 rotate-90" /> Refresh
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Customer</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Loans</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Defaults</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Performance</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount To Be Paid</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount Paid</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Loan Balance</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Start Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">End Date</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {metrics.data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    No customer loans found for this branch.
                  </td>
                </tr>
              ) : (
                metrics.data.map((customer) => (
                  <tr key={customer.bvn} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{customer.customerName || "Unknown Customer"}</div>
                      <div className="text-xs font-mono text-slate-500">{customer.bvn}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatNumber(customer.loansCount)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${customer.defaultsCount > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {formatNumber(customer.defaultsCount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(() => {
                        const score = Number.isFinite(customer.performanceScore)
                          ? customer.performanceScore
                          : 0;
                        const label = customer.performanceLabel ||
                          (score >= 90 ? "Excellent" : score >= 70 ? "Fair" : "Poor");
                        return (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${performanceTone(
                              score
                            )}`}
                          >
                            {score.toFixed(1)}%
                            <span className="uppercase tracking-wide">{label}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(customer.amountToBePaid)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{formatCurrency(customer.amountPaid)}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600">{formatCurrency(customer.loanBalance)}</td>
                    <td className="px-4 py-3 text-left text-slate-600">{formatDate(customer.startDate)}</td>
                    <td className="px-4 py-3 text-left text-slate-600">{formatDate(customer.endDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-700">
                        {customer.status || "No open loan"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {totalRecords === 0
                ? "No records to display"
                : `Showing ${startIndex} - ${endIndex} of ${formatNumber(totalRecords)} customers`}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={!canGoPrev || loading}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1">Previous</span>
              </button>
              <span className="font-semibold text-slate-700">
                Page {formatNumber(currentPage)} of {formatNumber(Math.max(totalPages, 1))}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={!canGoNext || loading}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
