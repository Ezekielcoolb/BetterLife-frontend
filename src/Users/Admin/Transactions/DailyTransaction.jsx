import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowDownWideNarrow,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coins,
  HandCoins,
  Loader2,
  PiggyBank,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import {
  fetchAdminDisbursements,
  fetchAdminCollections,
  clearDisbursementError,
  clearCollectionError,
} from "../../../redux/slices/adminDailyTransactionSlice";
import { fetchCsos } from "../../../redux/slices/csoSlice";

const RANGE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom Range" },
];

const PAGE_LIMIT = 20;

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
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

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const dateValue = new Date(value);

  if (Number.isNaN(dateValue.valueOf())) {
    return "—";
  }

  return dateValue.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatShortDate = (value) => {
  if (!value) {
    return "—";
  }

  const dateValue = new Date(value);

  if (Number.isNaN(dateValue.valueOf())) {
    return "—";
  }

  return dateValue.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const addMonths = (date, delta) => {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
};

const computeInitialMonth = (filter, lastQuery) => {
  if (lastQuery?.year && lastQuery?.month) {
    return new Date(lastQuery.year, lastQuery.month - 1, 1);
  }

  if (filter?.startDate) {
    const parsed = new Date(filter.startDate);
    if (!Number.isNaN(parsed.valueOf())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
  }

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

function RangePresetButton({ id, label, active, onSelect }) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  const activeClasses = "bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-lg";
  const inactiveClasses =
    "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-indigo-500";

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
    >
      {label}
    </button>
  );
}

function SummaryCard({ icon: Icon, title, value, meta, accent }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="flex items-center gap-4">
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${accent} text-white shadow-sm`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          {meta ? (
            <p className="mt-1 text-xs font-medium text-slate-500">{meta}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

const STATUS_STYLES = {
  approved: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  "active loan": "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "fully paid": "bg-slate-100 text-slate-700 border border-slate-200",
};

export default function DailyTransaction() {
  const dispatch = useDispatch();

  const { disbursement, collection } = useSelector(
    (state) => state.adminDailyTransactions
  );
  const { items: csos, listLoading: csosLoading } = useSelector(
    (state) => state.cso
  );

  const [activeTab, setActiveTab] = useState("disbursement");

  const [disbMonth, setDisbMonth] = useState(() =>
    computeInitialMonth(disbursement.filter, disbursement.lastQuery)
  );
  const [disbRange, setDisbRange] = useState(disbursement.filter.range || "month");
  const [disbSearchInput, setDisbSearchInput] = useState(
    disbursement.filter.search || ""
  );
  const [disbCso, setDisbCso] = useState(disbursement.filter.csoId || "");
  const [disbFrom, setDisbFrom] = useState(disbursement.lastQuery?.from || "");
  const [disbTo, setDisbTo] = useState(disbursement.lastQuery?.to || "");
  const [disbDate, setDisbDate] = useState(disbursement.lastQuery?.date || "");
  const [disbPage, setDisbPage] = useState(disbursement.pagination.page || 1);

  const [collectionMonth, setCollectionMonth] = useState(() =>
    computeInitialMonth(collection.filter, collection.lastQuery)
  );
  const [collectionRange, setCollectionRange] = useState(
    collection.filter.range || "month"
  );
  const [collectionSearchInput, setCollectionSearchInput] = useState(
    collection.filter.search || ""
  );
  const [collectionCso, setCollectionCso] = useState(collection.filter.csoId || "");
  const [collectionFrom, setCollectionFrom] = useState(
    collection.lastQuery?.from || ""
  );
  const [collectionTo, setCollectionTo] = useState(collection.lastQuery?.to || "");
  const [collectionDate, setCollectionDate] = useState(
    collection.lastQuery?.date || ""
  );
  const [collectionPage, setCollectionPage] = useState(
    collection.pagination.page || 1
  );

  const collectionLoadedRef = useRef(
    Boolean(collection.lastQuery || collection.items.length > 0)
  );

  const disbursementCount = disbursement.pagination.totalItems || 0;
  const collectionCount = collection.pagination.totalItems || 0;

  const disbursementSummaryCards = useMemo(() => {
    return [
      {
        icon: HandCoins,
        title: "Total Amount Disbursed",
        value: formatCurrency(disbursement.summary.totalDisbursed),
        meta: `${disbursementCount} disbursement${
          disbursementCount === 1 ? "" : "s"
        } recorded`,
        accent: "from-indigo-500 via-indigo-500 to-sky-500",
      },
      {
        icon: Coins,
        title: "Outstanding To Be Paid",
        value: formatCurrency(disbursement.summary.totalAmountToBePaid),
        meta: "Projected repayment total",
        accent: "from-emerald-500 to-teal-500",
      },
      {
        icon: PiggyBank,
        title: "Admin & Application Fees",
        value: formatCurrency(disbursement.summary.totalAdminFees),
        meta: "Aggregated form fees",
        accent: "from-amber-500 to-orange-500",
      },
    ];
  }, [disbursement.summary, disbursementCount]);

  const collectionSummaryCards = useMemo(() => {
    return [
      {
        icon: Coins,
        title: "Amount Collected",
        value: formatCurrency(collection.summary.totalAmountPaid),
        meta: `${collectionCount} payment${collectionCount === 1 ? "" : "s"} logged`,
        accent: "from-emerald-500 to-emerald-600",
      },
      {
        icon: Users,
        title: "CSO Coverage",
        value: collection.items
          .reduce((acc, item) => acc.add(item.csoId || item.csoName || ""), new Set())
          .size,
        meta: "Unique CSOs represented",
        accent: "from-sky-500 to-blue-500",
      },
    ];
  }, [collection.summary.totalAmountPaid, collection.items, collectionCount]);

  useEffect(() => {
    if (!csos || csos.length === 0) {
      dispatch(fetchCsos({ page: 1, limit: 200 }));
    }
  }, [dispatch, csos]);

  useEffect(() => {
    if (disbursement.error) {
      toast.error(disbursement.error);
      dispatch(clearDisbursementError());
    }
  }, [disbursement.error, dispatch]);

  useEffect(() => {
    if (collection.error) {
      toast.error(collection.error);
      dispatch(clearCollectionError());
    }
  }, [collection.error, dispatch]);

  useEffect(() => {
    const nextSearch = disbursement.filter.search || "";
    if (nextSearch !== disbSearchInput) {
      setDisbSearchInput(nextSearch);
    }
    const nextRange = disbursement.filter.range || "month";
    if (nextRange !== disbRange) {
      setDisbRange(nextRange);
    }
    const nextCso = disbursement.filter.csoId || "";
    if (nextCso !== disbCso) {
      setDisbCso(nextCso);
    }
  }, [disbursement.filter, disbSearchInput, disbRange, disbCso]);

  useEffect(() => {
    if (disbursement.lastQuery?.range === "custom") {
      setDisbFrom(disbursement.lastQuery.from || "");
      setDisbTo(disbursement.lastQuery.to || "");
      setDisbDate(disbursement.lastQuery.date || "");
    } else if (disbursement.lastQuery) {
      setDisbFrom("");
      setDisbTo("");
      setDisbDate("");
    }
  }, [disbursement.lastQuery]);

  useEffect(() => {
    const nextPage = disbursement.pagination.page || 1;
    if (nextPage !== disbPage) {
      setDisbPage(nextPage);
    }
  }, [disbursement.pagination.page, disbPage]);

  useEffect(() => {
    const nextSearch = collection.filter.search || "";
    if (nextSearch !== collectionSearchInput) {
      setCollectionSearchInput(nextSearch);
    }
    const nextRange = collection.filter.range || "month";
    if (nextRange !== collectionRange) {
      setCollectionRange(nextRange);
    }
    const nextCso = collection.filter.csoId || "";
    if (nextCso !== collectionCso) {
      setCollectionCso(nextCso);
    }
  }, [collection.filter, collectionSearchInput, collectionRange, collectionCso]);

  useEffect(() => {
    if (collection.lastQuery?.range === "custom") {
      setCollectionFrom(collection.lastQuery.from || "");
      setCollectionTo(collection.lastQuery.to || "");
      setCollectionDate(collection.lastQuery.date || "");
    } else if (collection.lastQuery) {
      setCollectionFrom("");
      setCollectionTo("");
      setCollectionDate("");
    }
  }, [collection.lastQuery]);

  useEffect(() => {
    const nextPage = collection.pagination.page || 1;
    if (nextPage !== collectionPage) {
      setCollectionPage(nextPage);
    }
  }, [collection.pagination.page, collectionPage]);

  const initialDisbQueryRef = useRef(null);

  if (initialDisbQueryRef.current === null) {
    if (disbursement.lastQuery) {
      initialDisbQueryRef.current = { ...disbursement.lastQuery };
    } else {
      const baseQuery = {
        year: disbMonth.getFullYear(),
        month: disbMonth.getMonth() + 1,
        range: disbRange,
        page: disbPage,
        limit: PAGE_LIMIT,
      };

      if (disbSearchInput.trim()) {
        baseQuery.search = disbSearchInput.trim();
      }

      if (disbCso) {
        baseQuery.csoId = disbCso;
      }

      if (disbRange === "custom") {
        if (disbFrom) baseQuery.from = disbFrom;
        if (disbTo) baseQuery.to = disbTo;
        if (!disbFrom && !disbTo && disbDate) baseQuery.date = disbDate;
      }

      initialDisbQueryRef.current = baseQuery;
    }
  }

  useEffect(() => {
    dispatch(fetchAdminDisbursements(initialDisbQueryRef.current));
  }, [dispatch]);

  const loadDisbursements = useCallback(
    (overrides = {}) => {
      const nextMonth = overrides.month ?? disbMonth;
      const nextRange = overrides.range ?? disbRange;
      const nextSearch = overrides.search ?? disbSearchInput;
      const nextCso = overrides.csoId ?? disbCso;
      const nextFrom = overrides.from ?? disbFrom;
      const nextTo = overrides.to ?? disbTo;
      const nextDate = overrides.date ?? disbDate;
      const nextPage = overrides.page ?? (overrides.resetPage ? 1 : disbPage);

      if (overrides.month) {
        setDisbMonth(overrides.month);
      }
      if (overrides.range) {
        setDisbRange(overrides.range);
      }
      if (overrides.search !== undefined) {
        setDisbSearchInput(overrides.search);
      }
      if (overrides.csoId !== undefined) {
        setDisbCso(overrides.csoId);
      }
      if (overrides.from !== undefined) {
        setDisbFrom(overrides.from);
      }
      if (overrides.to !== undefined) {
        setDisbTo(overrides.to);
      }
      if (overrides.date !== undefined) {
        setDisbDate(overrides.date);
      }
      if (overrides.page !== undefined || overrides.resetPage) {
        setDisbPage(nextPage);
      }

      const query = {
        year: nextMonth.getFullYear(),
        month: nextMonth.getMonth() + 1,
        range: nextRange,
        page: nextPage,
        limit: PAGE_LIMIT,
      };

      if (nextSearch.trim()) {
        query.search = nextSearch.trim();
      }

      if (nextCso) {
        query.csoId = nextCso;
      }

      if (nextRange === "custom") {
        if (nextFrom) {
          query.from = nextFrom;
        }
        if (nextTo) {
          query.to = nextTo;
        }
        if (!nextFrom && !nextTo && nextDate) {
          query.date = nextDate;
        }
      }

      dispatch(fetchAdminDisbursements(query));
    },
    [
      dispatch,
      disbMonth,
      disbRange,
      disbSearchInput,
      disbCso,
      disbFrom,
      disbTo,
      disbDate,
      disbPage,
    ]
  );

  const initialCollectionQueryRef = useRef(null);

  if (initialCollectionQueryRef.current === null) {
    if (collection.lastQuery) {
      initialCollectionQueryRef.current = { ...collection.lastQuery };
    } else {
      const baseQuery = {
        year: collectionMonth.getFullYear(),
        month: collectionMonth.getMonth() + 1,
        range: collectionRange,
        page: collectionPage,
        limit: PAGE_LIMIT,
      };

      if (collectionSearchInput.trim()) {
        baseQuery.search = collectionSearchInput.trim();
      }

      if (collectionCso) {
        baseQuery.csoId = collectionCso;
      }

      if (collectionRange === "custom") {
        if (collectionFrom) baseQuery.from = collectionFrom;
        if (collectionTo) baseQuery.to = collectionTo;
        if (!collectionFrom && !collectionTo && collectionDate)
          baseQuery.date = collectionDate;
      }

      initialCollectionQueryRef.current = baseQuery;
    }
  }

  const loadCollections = useCallback(
    (overrides = {}) => {
      const nextMonth = overrides.month ?? collectionMonth;
      const nextRange = overrides.range ?? collectionRange;
      const nextSearch = overrides.search ?? collectionSearchInput;
      const nextCso = overrides.csoId ?? collectionCso;
      const nextFrom = overrides.from ?? collectionFrom;
      const nextTo = overrides.to ?? collectionTo;
      const nextDate = overrides.date ?? collectionDate;
      const nextPage =
        overrides.page ?? (overrides.resetPage ? 1 : collectionPage);

      if (overrides.month) {
        setCollectionMonth(overrides.month);
      }
      if (overrides.range) {
        setCollectionRange(overrides.range);
      }
      if (overrides.search !== undefined) {
        setCollectionSearchInput(overrides.search);
      }
      if (overrides.csoId !== undefined) {
        setCollectionCso(overrides.csoId);
      }
      if (overrides.from !== undefined) {
        setCollectionFrom(overrides.from);
      }
      if (overrides.to !== undefined) {
        setCollectionTo(overrides.to);
      }
      if (overrides.date !== undefined) {
        setCollectionDate(overrides.date);
      }
      if (overrides.page !== undefined || overrides.resetPage) {
        setCollectionPage(nextPage);
      }

      const query = {
        year: nextMonth.getFullYear(),
        month: nextMonth.getMonth() + 1,
        range: nextRange,
        page: nextPage,
        limit: PAGE_LIMIT,
      };

      if (nextSearch.trim()) {
        query.search = nextSearch.trim();
      }

      if (nextCso) {
        query.csoId = nextCso;
      }

      if (nextRange === "custom") {
        if (nextFrom) {
          query.from = nextFrom;
        }
        if (nextTo) {
          query.to = nextTo;
        }
        if (!nextFrom && !nextTo && nextDate) {
          query.date = nextDate;
        }
      }

      collectionLoadedRef.current = true;
      dispatch(fetchAdminCollections(query));
    },
    [
      dispatch,
      collectionMonth,
      collectionRange,
      collectionSearchInput,
      collectionCso,
      collectionFrom,
      collectionTo,
      collectionDate,
      collectionPage,
    ]
  );

  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);

      if (tabId === "collection" && !collectionLoadedRef.current) {
        dispatch(fetchAdminCollections(initialCollectionQueryRef.current));
        collectionLoadedRef.current = true;
      }
    },
    [dispatch]
  );

  const disbursementMonthLabel = useMemo(() => {
    return disbMonth.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [disbMonth]);

  const collectionMonthLabel = useMemo(() => {
    return collectionMonth.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [collectionMonth]);

  const renderDisbursementContent = () => {
    const isCustomRange = disbRange === "custom";
    const monthNavDisabled = disbRange !== "month";
    const paginatedItems = disbursement.items || [];
    const totalPages = Math.max(disbursement.pagination.totalPages || 1, 1);
    const showingStart = disbursement.pagination.totalItems
      ? (disbursement.pagination.page - 1) * disbursement.pagination.limit + 1
      : 0;
    const showingEnd = disbursement.pagination.totalItems
      ? Math.min(
          disbursement.pagination.page * disbursement.pagination.limit,
          disbursement.pagination.totalItems
        )
      : 0;

    return (
      <div className="space-y-8">
        <section>
          <div className="grid gap-4 md:grid-cols-3">
            {disbursementSummaryCards.map((card) => (
              <SummaryCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Daily Disbursements</h2>
              <p className="text-sm text-slate-500">
                Track every loan released by CSOs and monitor outstanding balances.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadDisbursements({})}
              disabled={disbursement.loading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {disbursement.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {disbursement.loading ? "Refreshing" : "Refresh"}
            </button>
          </header>

          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/60 px-4 py-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  <span className="font-semibold text-slate-600">{disbursementMonthLabel}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        !monthNavDisabled &&
                        loadDisbursements({ month: addMonths(disbMonth, -1), page: 1 })
                      }
                      disabled={monthNavDisabled}
                      className="inline-flex items-center justify-center rounded-full bg-white p-1 text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        !monthNavDisabled && loadDisbursements({ month: addMonths(disbMonth, 1), page: 1 })
                      }
                      disabled={monthNavDisabled}
                      className="inline-flex items-center justify-center rounded-full bg-white p-1 text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {RANGE_PRESETS.map((preset) => (
                    <RangePresetButton
                      key={preset.id}
                      id={preset.id}
                      label={preset.label}
                      active={disbRange === preset.id}
                      onSelect={(id) => {
                        if (id === "custom") {
                          setDisbRange("custom");
                        } else {
                          loadDisbursements({
                            range: id,
                            page: 1,
                            from: "",
                            to: "",
                            date: "",
                          });
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    loadDisbursements({ search: disbSearchInput, page: 1 });
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    value={disbSearchInput}
                    onChange={(event) => setDisbSearchInput(event.target.value)}
                    placeholder="Search by customer or loan ID"
                    className="w-48 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                  {disbSearchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setDisbSearchInput("");
                        loadDisbursements({ search: "", page: 1 });
                      }}
                      className="text-xs font-semibold text-slate-500 transition hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </form>

                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                  <ArrowDownWideNarrow className="h-4 w-4 text-slate-400" />
                  <select
                    value={disbCso}
                    onChange={(event) =>
                      loadDisbursements({ csoId: event.target.value, page: 1 })
                    }
                    className="border-none bg-transparent text-sm text-slate-700 focus:outline-none"
                  >
                    <option value="">All CSOs</option>
                    {csos.map((cso) => (
                      <option key={cso._id} value={cso._id}>
                        {cso.fullName || cso.name || cso.email}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {isCustomRange && (
              <div className="grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 md:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    From
                  </label>
                  <input
                    type="date"
                    value={disbFrom}
                    onChange={(event) => setDisbFrom(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    To
                  </label>
                  <input
                    type="date"
                    value={disbTo}
                    onChange={(event) => setDisbTo(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Single Day (optional)
                  </label>
                  <input
                    type="date"
                    value={disbDate}
                    onChange={(event) => setDisbDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500">
                    Leave "From" and "To" empty, then pick a single day to focus on that date.
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      loadDisbursements({
                        range: "custom",
                        from: disbFrom,
                        to: disbTo,
                        date: disbDate,
                        page: 1,
                      })
                    }
                    className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-md"
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200">
              {disbursement.loading ? (
                <div className="flex min-h-[260px] items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                </div>
              ) : paginatedItems.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-10 text-center">
                  <AlertCircle className="h-12 w-12 text-slate-300" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      No disbursements match the current filters
                    </p>
                    <p className="text-sm text-slate-500">
                      Adjust your date range, search keywords, or CSO filter to explore more records.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Loan ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">CSO</th>
                        <th className="px-4 py-3 text-right">Amount Disbursed</th>
                        <th className="px-4 py-3 text-right">To Be Paid</th>
                        <th className="px-4 py-3 text-right">Admin Fees</th>
                        <th className="px-4 py-3">Loan Type</th>
                        <th className="px-4 py-3">Disbursed</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedItems.map((item) => {
                        const statusKey = (item.status || "").toLowerCase();
                        const badgeClass = STATUS_STYLES[statusKey] ||
                          "bg-amber-100 text-amber-700 border border-amber-200";

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {item.loanId || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {item.customerName || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {item.csoName || "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {formatCurrency(item.amountDisbursed)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatCurrency(item.amountToBePaid)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatCurrency(item.adminFee)}
                            </td>
                            <td className="px-4 py-3 capitalize text-slate-600">
                              {item.loanType || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatDateTime(item.disbursedAt)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                                {item.status || "Unknown"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <footer className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
              <p>
                {disbursement.pagination.totalItems > 0
                  ? `Showing ${showingStart}-${showingEnd} of ${disbursement.pagination.totalItems}`
                  : "No records to display"}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    disbursement.pagination.page > 1 &&
                    loadDisbursements({ page: disbursement.pagination.page - 1 })
                  }
                  disabled={
                    disbursement.pagination.page <= 1 || disbursement.loading
                  }
                  className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Page {disbursement.pagination.page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    disbursement.pagination.page < totalPages &&
                    loadDisbursements({ page: disbursement.pagination.page + 1 })
                  }
                  disabled={
                    disbursement.pagination.page >= totalPages ||
                    disbursement.loading
                  }
                  className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </footer>
          </div>
        </section>
      </div>
    );
  };

  const renderCollectionContent = () => {
    const isCustomRange = collectionRange === "custom";
    const monthNavDisabled = collectionRange !== "month";
    const paginatedItems = collection.items || [];
    const totalPages = Math.max(collection.pagination.totalPages || 1, 1);
    const showingStart = collection.pagination.totalItems
      ? (collection.pagination.page - 1) * collection.pagination.limit + 1
      : 0;
    const showingEnd = collection.pagination.totalItems
      ? Math.min(
          collection.pagination.page * collection.pagination.limit,
          collection.pagination.totalItems
        )
      : 0;

    return (
      <div className="space-y-8">
        <section>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {collectionSummaryCards.map((card) => (
              <SummaryCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Daily Collections</h2>
              <p className="text-sm text-slate-500">
                Review repayment inflows and keep tabs on CSO performance in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadCollections({})}
              disabled={collection.loading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {collection.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {collection.loading ? "Refreshing" : "Refresh"}
            </button>
          </header>

          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/60 px-4 py-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  <span className="font-semibold text-slate-600">
                    {collectionMonthLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        !monthNavDisabled &&
                        loadCollections({
                          month: addMonths(collectionMonth, -1),
                          page: 1,
                        })
                      }
                      disabled={monthNavDisabled}
                      className="inline-flex items-center justify-center rounded-full bg-white p-1 text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        !monthNavDisabled &&
                        loadCollections({
                          month: addMonths(collectionMonth, 1),
                          page: 1,
                        })
                      }
                      disabled={monthNavDisabled}
                      className="inline-flex items-center justify-center rounded-full bg-white p-1 text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {RANGE_PRESETS.map((preset) => (
                    <RangePresetButton
                      key={preset.id}
                      id={preset.id}
                      label={preset.label}
                      active={collectionRange === preset.id}
                      onSelect={(id) => {
                        if (id === "custom") {
                          setCollectionRange("custom");
                        } else {
                          loadCollections({
                            range: id,
                            page: 1,
                            from: "",
                            to: "",
                            date: "",
                          });
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    loadCollections({ search: collectionSearchInput, page: 1 });
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    value={collectionSearchInput}
                    onChange={(event) => setCollectionSearchInput(event.target.value)}
                    placeholder="Search by customer or loan ID"
                    className="w-48 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                  {collectionSearchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCollectionSearchInput("");
                        loadCollections({ search: "", page: 1 });
                      }}
                      className="text-xs font-semibold text-slate-500 transition hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </form>

                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                  <ArrowDownWideNarrow className="h-4 w-4 text-slate-400" />
                  <select
                    value={collectionCso}
                    onChange={(event) =>
                      loadCollections({ csoId: event.target.value, page: 1 })
                    }
                    className="border-none bg-transparent text-sm text-slate-700 focus:outline-none"
                  >
                    <option value="">All CSOs</option>
                    {csos.map((cso) => (
                      <option key={cso._id} value={cso._id}>
                        {cso.fullName || cso.name || cso.email}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {isCustomRange && (
              <div className="grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 md:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    From
                  </label>
                  <input
                    type="date"
                    value={collectionFrom}
                    onChange={(event) => setCollectionFrom(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    To
                  </label>
                  <input
                    type="date"
                    value={collectionTo}
                    onChange={(event) => setCollectionTo(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Single Day (optional)
                  </label>
                  <input
                    type="date"
                    value={collectionDate}
                    onChange={(event) => setCollectionDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500">
                    Leave both range fields empty to filter by the chosen day only.
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      loadCollections({
                        range: "custom",
                        from: collectionFrom,
                        to: collectionTo,
                        date: collectionDate,
                        page: 1,
                      })
                    }
                    className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-md"
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200">
              {collection.loading ? (
                <div className="flex min-h-[260px] items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                </div>
              ) : paginatedItems.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-10 text-center">
                  <AlertCircle className="h-12 w-12 text-slate-300" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      No collection records for the selected filters
                    </p>
                    <p className="text-sm text-slate-500">
                      Switch presets or clear filters to broaden the view.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Payment Date</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">CSO</th>
                        <th className="px-4 py-3 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedItems.map((item) => (
                        <tr key={`${item.id}-${item.paymentDate}`} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 text-slate-600">
                            {formatShortDate(item.paymentDate)}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {item.customerName || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.csoName || "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatCurrency(item.amountPaid)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <footer className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
              <p>
                {collection.pagination.totalItems > 0
                  ? `Showing ${showingStart}-${showingEnd} of ${collection.pagination.totalItems}`
                  : "No records to display"}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    collection.pagination.page > 1 &&
                    loadCollections({ page: collection.pagination.page - 1 })
                  }
                  disabled={
                    collection.pagination.page <= 1 || collection.loading
                  }
                  className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Page {collection.pagination.page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    collection.pagination.page < totalPages &&
                    loadCollections({ page: collection.pagination.page + 1 })
                  }
                  disabled={
                    collection.pagination.page >= totalPages ||
                    collection.loading
                  }
                  className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </footer>
          </div>
        </section>
      </div>
    );
  };

  const currentTabContent =
    activeTab === "disbursement"
      ? renderDisbursementContent()
      : renderCollectionContent();

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-lg">
        <div className="absolute right-8 top-8 h-20 w-20 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute bottom-6 right-16 h-24 w-24 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-200">
              Admin Daily Operations
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Daily Transaction Monitor</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Navigate between disbursement and collection activity, apply precise filters, and stay ahead of repayment trends across your CSO network.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
            <div className="rounded-full bg-white/10 p-3">
              <HandCoins className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-200">
                Current Focus
              </p>
              <p className="text-lg font-semibold capitalize">
                {activeTab === "disbursement" ? "Disbursement" : "Collection"} Tab
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <nav className="flex flex-wrap gap-4 border-b border-slate-200 px-6 pt-6">
          <button
            type="button"
            onClick={() => handleTabChange("disbursement")}
            className={`whitespace-nowrap rounded-full border-b-2 px-4 pb-3 text-sm font-semibold transition ${
              activeTab === "disbursement"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            Disbursement
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("collection")}
            className={`whitespace-nowrap rounded-full border-b-2 px-4 pb-3 text-sm font-semibold transition ${
              activeTab === "collection"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            Collection
          </button>
        </nav>

        <div className="p-6">
          {csosLoading && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading CSO roster
            </div>
          )}
          {currentTabContent}
        </div>
      </section>
    </div>
  );
}
