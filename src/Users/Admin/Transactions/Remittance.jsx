import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminRemittances,
  updateAdminRemittance,
  clearAdminRemittanceError,
} from "../../../redux/slices/adminRemittanceSlice";
import { fetchCsos } from "../../../redux/slices/csoSlice";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wand2,
} from "lucide-react";

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "₦0.00";
  }
  const number = Number(value);
  if (Number.isNaN(number)) {
    return "₦0.00";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(number);
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.valueOf())) return "—";
  return dateValue.toLocaleString();
};

const STATUS_STYLES = {
  issue: "bg-rose-100 text-rose-700 border border-rose-200",
  resolved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  balanced: "bg-slate-100 text-slate-600 border border-slate-200",
};

const ZERO_THRESHOLD = 0.5; // treat differences within ₦0.50 as balanced

const RANGE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

const formatShortDate = (value) => {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.valueOf())) return "—";
  return dateValue.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getInitialMonth = (lastQuery) => {
  if (lastQuery?.year && lastQuery?.month) {
    return new Date(lastQuery.year, lastQuery.month - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export default function AdminRemittance() {
  const dispatch = useDispatch();
  const { items, meta, loading, error, updatingById, updateError, lastQuery } =
    useSelector((state) => state.adminRemittance);
  const { items: csos, listLoading: csosLoading } = useSelector(
    (state) => state.cso
  );

  const initialMonth = useMemo(() => getInitialMonth(lastQuery), [lastQuery]);

  const [page, setPage] = useState(lastQuery?.page || 1);
  const limit = lastQuery?.limit || 20;

  const [editingRows, setEditingRows] = useState({});

  const [selectedCso, setSelectedCso] = useState(lastQuery?.csoId || "");
  const [rangePreset, setRangePreset] = useState(lastQuery?.range || "month");
  const [customFrom, setCustomFrom] = useState(lastQuery?.from || "");
  const [customTo, setCustomTo] = useState(lastQuery?.to || "");
  const [customDate, setCustomDate] = useState(lastQuery?.date || "");
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const appliedQueryRef = useRef(lastQuery);

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth() + 1;

  useEffect(() => {
    if (!csos || csos.length === 0) {
      dispatch(fetchCsos({ page: 1, limit: 200 }));
    }
  }, [dispatch, csos]);

  const loadRemittances = useCallback(
    (overrides = {}) => {
      const baseRange = overrides.range ?? rangePreset;
      const nextPage = overrides.page ?? page;
      const nextCso = overrides.csoId ?? selectedCso;
      const nextFrom = overrides.from ?? customFrom;
      const nextTo = overrides.to ?? customTo;
      const nextDate = overrides.date ?? customDate;

      const query = {
        year: currentYear,
        month: currentMonthIndex,
        range: baseRange,
        page: nextPage,
        limit,
      };

      if (nextCso) {
        query.csoId = nextCso;
      }

      if (baseRange === "custom") {
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

      dispatch(fetchAdminRemittances(query));
      appliedQueryRef.current = query;
    },
    [
      dispatch,
      currentYear,
      currentMonthIndex,
      page,
      limit,
      rangePreset,
      selectedCso,
      customFrom,
      customTo,
      customDate,
    ]
  );

  useEffect(() => {
    loadRemittances();
  }, [loadRemittances]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAdminRemittanceError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (updateError) {
      toast.error(updateError);
      dispatch(clearAdminRemittanceError());
    }
  }, [updateError, dispatch]);

  useEffect(() => {
    const nextEditingState = {};
    items.forEach((record) => {
      nextEditingState[record.id] = {
        amountRemitted: record.amountRemitted?.toString() ?? "",
        amountOnTeller: record.amountOnTeller?.toString() ?? "",
        resolutionNote: record.resolvedIssue || record.issueResolution || "",
      };
    });
    setEditingRows(nextEditingState);
  }, [items]);

  const monthLabel = useMemo(() => {
    return currentMonth.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [currentMonth]);

  const summaryCards = useMemo(() => {
    const summary = meta?.summary || {};
    return [
      {
        label: "Total Remittances",
        value: summary.totalRemittances ?? items.length,
        icon: CalendarDays,
        accent: "bg-indigo-100 text-indigo-600",
      },
      {
        label: "Open Issues",
        value: summary.unresolvedIssues ?? 0,
        icon: AlertTriangle,
        accent: "bg-rose-100 text-rose-600",
      },
      {
        label: "Resolved",
        value: summary.resolvedCount ?? 0,
        icon: ShieldCheck,
        accent: "bg-emerald-100 text-emerald-600",
      },
      {
        label: "Balanced",
        value: summary.balancedCount ?? 0,
        icon: CheckCircle,
        accent: "bg-slate-100 text-slate-600",
      },
    ];
  }, [meta?.summary, items.length]);

  const applyFilters = (overrides = {}) => {
    const nextRange = overrides.range ?? rangePreset;
    const nextCso = overrides.csoId ?? selectedCso;
    const nextPage = overrides.page ?? 1;
    setPage(nextPage);
    setRangePreset(nextRange);
    if (overrides.csoId !== undefined) {
      setSelectedCso(overrides.csoId);
    }
    const resolvedCsoId = nextCso ? nextCso : undefined;
    loadRemittances({
      range: nextRange,
      csoId: resolvedCsoId,
    });
  };

  const handlePresetChange = (preset) => {
    setRangePreset(preset);
    if (preset !== "custom") {
      setCustomFrom("");
      setCustomTo("");
      setCustomDate("");
      const resolvedCsoId = selectedCso ? selectedCso : undefined;
      setPage(1);
      loadRemittances({ range: preset, csoId: resolvedCsoId, page: 1 });
    }
  };

  const handleMonthChange = (direction) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + direction, 1);
      return next;
    });
    const resolvedCsoId = selectedCso ? selectedCso : undefined;
    setPage(1);
    loadRemittances({ range: rangePreset, csoId: resolvedCsoId, page: 1 });
  };

  const handleRefresh = () => {
    loadRemittances(appliedQueryRef.current || {});
  };

  const handleFieldChange = (id, field, value) => {
    setEditingRows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const parseAmount = (value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return undefined;
    }
    return Number(numeric.toFixed(2));
  };

  const handleSaveRow = async (record) => {
    const edits = editingRows[record.id] || {};
    const amountRemitted = parseAmount(edits.amountRemitted);
    const amountOnTeller = parseAmount(edits.amountOnTeller);
    const payload = {};

    if (amountRemitted !== undefined) {
      payload.amountRemitted = amountRemitted;
    }

    if (amountOnTeller !== undefined) {
      payload.amountOnTeller = amountOnTeller;
    }

    if (edits.resolutionNote !== undefined) {
      payload.issueResolution = edits.resolutionNote;
    }

    try {
      await dispatch(
        updateAdminRemittance({
          remittanceId: record.id,
          data: payload,
        })
      ).unwrap();
      toast.success("Remittance updated");
      dispatch(
        fetchAdminRemittances({
          year: lastQuery.year || currentYear,
          month: lastQuery.month || currentMonthIndex,
          page: lastQuery.page || page,
          limit: lastQuery.limit || limit,
          csoId: lastQuery.csoId,
        })
      );
    } catch (err) {
      if (typeof err === "string") {
        toast.error(err);
      }
    }
  };

  const handleResolveRow = async (record) => {
    const edits = editingRows[record.id] || {};
    const note = edits.resolutionNote?.trim() || "Resolved";
    try {
      await dispatch(
        updateAdminRemittance({
          remittanceId: record.id,
          data: {
            markResolved: true,
            resolvedNote: note,
          },
        })
      ).unwrap();
      toast.success("Issue marked as resolved");
      handleRefresh();
    } catch (err) {
      if (typeof err === "string") {
        toast.error(err);
      }
    }
  };

  const handleClearResolution = async (record) => {
    try {
      await dispatch(
        updateAdminRemittance({
          remittanceId: record.id,
          data: {
            clearResolved: true,
          },
        })
      ).unwrap();
      toast.success("Resolution cleared");
      handleRefresh();
    } catch (err) {
      if (typeof err === "string") {
        toast.error(err);
      }
    }
  };

  const isRowUpdating = (id) => Boolean(updatingById?.[id]);

  const filteredCsos = useMemo(() => {
    if (!Array.isArray(csos)) return [];
    return csos
      .slice()
      .sort((a, b) => {
        const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
        const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim();
        return nameA.localeCompare(nameB);
      });
  }, [csos]);

  const customSummaryLabel = useMemo(() => {
    if (rangePreset !== "custom") return null;
    if (customFrom && customTo) {
      return `${formatShortDate(customFrom)} → ${formatShortDate(customTo)}`;
    }
    if (customFrom) {
      return `From ${formatShortDate(customFrom)}`;
    }
    if (customTo) {
      return `Until ${formatShortDate(customTo)}`;
    }
    if (customDate) {
      return formatShortDate(customDate);
    }
    return "Custom Range";
  }, [rangePreset, customFrom, customTo, customDate]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Wand2 className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              CSO Remittances
            </h1>
            <p className="text-sm text-slate-500">
              Track submissions, reconcile teller balances, and resolve pending issues.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-600"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
            </div>
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
              <Icon className="h-5 w-5" />
            </span>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleMonthChange(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Viewing
              </p>
              <p className="text-lg font-semibold text-slate-900">{monthLabel}</p>
              {rangePreset === "custom" && customSummaryLabel && (
                <p className="text-xs text-slate-400">{customSummaryLabel}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleMonthChange(1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="hidden text-sm text-slate-500 sm:block">Filter:</div>
              <div className="flex items-center gap-2">
                {RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetChange(preset.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      rangePreset === preset.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRangePreset("custom")}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                    rangePreset === "custom"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" /> Custom
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">
                CSO
              </label>
              <select
                value={selectedCso}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedCso(value);
                  setPage(1);
                  loadRemittances({
                    range: rangePreset,
                    csoId: value || undefined,
                    page: 1,
                  });
                }}
                className="min-w-[180px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-indigo-400 focus:outline-none"
              >
                <option value="">All CSOs</option>
                {filteredCsos.map((cso) => {
                  const name = `${cso.firstName || ""} ${cso.lastName || ""}`.trim();
                  return (
                    <option key={cso._id} value={cso._id}>
                      {name || cso.email || cso.workId}
                    </option>
                  );
                })}
              </select>
            </div>
            {rangePreset === "custom" && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col text-xs text-slate-500">
                  <label className="mb-1 font-semibold text-slate-600">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col text-xs text-slate-500">
                  <label className="mb-1 font-semibold text-slate-600">To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col text-xs text-slate-500">
                  <label className="mb-1 font-semibold text-slate-600">Specific Date</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(event) => setCustomDate(event.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFrom("");
                      setCustomTo("");
                      setCustomDate("");
                    }}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      loadRemittances({
                        range: "custom",
                        csoId: selectedCso || undefined,
                        page: 1,
                      });
                      setPage(1);
                    }}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>
              Updated {formatDateTime(meta?.updatedAt || new Date())}
            </span>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          )}

          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  CSO
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date Submitted
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount Collected
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount Paid
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount Remitted
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount on Teller
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Difference
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Evidence
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Resolution Note
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No remittances recorded for this month.
                  </td>
                </tr>
              ) : (
                items.map((record) => {
                  const edits = editingRows[record.id] || {};
                  const difference =
                    Number(record.amountRemitted || 0) -
                    Number(record.amountOnTeller || 0);
                  const differenceLabel = formatCurrency(difference);
                  const hasIssue = Math.abs(difference) > ZERO_THRESHOLD;
                  const status = hasIssue
                    ? record.resolvedIssue
                      ? "resolved"
                      : "issue"
                    : record.resolvedIssue
                    ? "resolved"
                    : "balanced";
                  const statusClass = STATUS_STYLES[status] || STATUS_STYLES.balanced;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{record.csoName}</div>
                        <div className="text-xs text-slate-500">{record.branch}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div>{formatDateTime(record.date)}</div>
                        <div className="text-xs text-slate-400">
                          Submitted {formatDateTime(record.submittedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(record.amountCollected)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(record.amountPaid)}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-right text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
                          value={edits.amountRemitted ?? ""}
                          onChange={(event) =>
                            handleFieldChange(
                              record.id,
                              "amountRemitted",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-right text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
                          value={edits.amountOnTeller ?? ""}
                          onChange={(event) =>
                            handleFieldChange(
                              record.id,
                              "amountOnTeller",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${hasIssue ? "text-rose-600" : "text-emerald-600"}`}>
                        {differenceLabel}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.image ? (
                          <a
                            href={record.image}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
                          >
                            <ImageIcon className="h-3.5 w-3.5" /> View
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                        >
                          {status === "issue" && <TriangleAlert className="h-3.5 w-3.5" />}
                          {status === "resolved" && <CheckCircle className="h-3.5 w-3.5" />}
                          {status === "balanced" && <ShieldCheck className="h-3.5 w-3.5" />}
                          {status === "issue" ? "Issue" : status === "resolved" ? "Resolved" : "Balanced"}
                        </span>
                        {record.resolvedIssue && (
                          <p className="mt-1 text-xs text-slate-400">
                            {record.resolvedIssue}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          rows={2}
                          className="w-48 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-indigo-400 focus:outline-none"
                          placeholder="Add resolution note"
                          value={edits.resolutionNote ?? ""}
                          onChange={(event) =>
                            handleFieldChange(
                              record.id,
                              "resolutionNote",
                              event.target.value
                            )
                          }
                        ></textarea>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleSaveRow(record)}
                            disabled={isRowUpdating(record.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                          >
                            {isRowUpdating(record.id) && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            Update
                          </button>
                          {status === "issue" ? (
                            <button
                              type="button"
                              onClick={() => handleResolveRow(record)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-600 transition hover:bg-emerald-100"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Mark Resolved
                            </button>
                          ) : record.resolvedIssue ? (
                            <button
                              type="button"
                              onClick={() => handleClearResolution(record)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                            >
                              Clear Resolution
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Showing page {meta?.page ?? page} of {meta?.totalPages ?? 1} ·
            <span className="ml-1 font-medium text-slate-700">
              {meta?.total ?? items.length} total remittances
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if ((meta?.page ?? page) <= 1) return;
                const nextPage = Math.max(1, (meta?.page ?? page) - 1);
                setPage(nextPage);
                loadRemittances({
                  ...appliedQueryRef.current,
                  page: nextPage,
                });
              }}
              disabled={(meta?.page ?? page) <= 1}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              type="button"
              onClick={() => {
                const totalPages = meta?.totalPages ?? 1;
                if ((meta?.page ?? page) >= totalPages) return;
                const nextPage = (meta?.page ?? page) + 1;
                setPage(nextPage);
                loadRemittances({
                  ...appliedQueryRef.current,
                  page: nextPage,
                });
              }}
              disabled={(meta?.page ?? page) >= (meta?.totalPages ?? 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
