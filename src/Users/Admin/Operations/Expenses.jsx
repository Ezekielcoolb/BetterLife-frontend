import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  CalendarDays,
  UploadCloud,
  Loader2,
  RefreshCw,
  Wallet,
  Users,
  ShieldCheck,
  ReceiptText,
  ArrowRight,
  MoveRight,
  AlertCircle,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  fetchExpenseEntries,
  fetchExpensesByDate,
  createExpense,
  moveExpense,
  clearExpenseError,
} from "../../../redux/slices/expenseSlice";
import { fetchAdminMembers } from "../../../redux/slices/adminPanelSlice";
import { fetchCsos } from "../../../redux/slices/csoSlice";
import { uploadImages, resetUpload } from "../../../redux/slices/uploadSlice";

const LAGOS_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Lagos",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const HUMAN_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Lagos",
  weekday: "short",
  month: "short",
  day: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Lagos",
  hour: "numeric",
  minute: "numeric",
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Lagos",
  weekday: "short",
});

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
});

const initialFormState = {
  amount: "",
  purpose: "",
  date: getInputDate(new Date()),
  spenderType: "super_admin",
  spenderId: "",
  receiptImg: "",
};

function getInputDate(value) {
  try {
    return LAGOS_DATE_FORMATTER.format(value ? new Date(value) : new Date());
  } catch {
    return "";
  }
}

function isWeekend(dateValue) {
  try {
    const date = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
    const lagosDate = getInputDate(date);
    if (!lagosDate) {
      return true;
    }
    const weekday = WEEKDAY_FORMATTER.format(new Date(`${lagosDate}T00:00:00+01:00`));
    return weekday === "Sat" || weekday === "Sun";
  } catch {
    return true;
  }
}

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return CURRENCY_FORMATTER.format(amount);
}

function formatDisplayDate(dateKey) {
  if (!dateKey) {
    return "—";
  }
  try {
    return HUMAN_DATE_FORMATTER.format(new Date(`${dateKey}T00:00:00+01:00`));
  } catch {
    return dateKey;
  }
}

function getMonthRange(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return {
    start: LAGOS_DATE_FORMATTER.format(firstDay),
    end: LAGOS_DATE_FORMATTER.format(lastDay),
    display: new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Lagos",
      month: "long",
      year: "numeric",
    }).format(date),
  };
}

function filterEntriesByMonth(entries, monthStart, monthEnd) {
  return entries.filter((entry) => {
    return entry.date >= monthStart && entry.date <= monthEnd;
  });
}

export default function Expenses() {
  const dispatch = useDispatch();

  const {
    entries,
    totalAmount,
    entriesLoading,
    daily,
    dailyLoading,
    creating,
    movingId,
    error: expenseError,
  } = useSelector((state) => state.expenses);

  console.log(entries);
  

  const { items: adminMembers } = useSelector((state) => state.adminPanel);
  const { items: csos } = useSelector((state) => state.cso);
  const { imageUploadLoading, error: uploadError } = useSelector((state) => state.upload);

  const [form, setForm] = useState(initialFormState);
  const [selectedDate, setSelectedDate] = useState(initialFormState.date);
  const [moveState, setMoveState] = useState({
    open: false,
    expense: null,
    targetDate: initialFormState.date,
  });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    dispatch(fetchExpenseEntries());
    dispatch(fetchAdminMembers());
    dispatch(fetchCsos());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDate) {
      dispatch(fetchExpensesByDate(selectedDate));
    }
  }, [selectedDate, dispatch]);

  useEffect(() => {
    if (!selectedDate && entries.length) {
      setSelectedDate(entries[0].date);
    }
  }, [entries, selectedDate]);

  useEffect(() => {
    if (expenseError) {
      toast.error(expenseError);
      dispatch(clearExpenseError());
    }
  }, [expenseError, dispatch]);

  useEffect(() => {
    if (uploadError) {
      toast.error(uploadError);
      dispatch(resetUpload());
    }
  }, [uploadError, dispatch]);

  const adminOptions = useMemo(
    () =>
      adminMembers.map((member) => ({
        value: member._id,
        label: `${member.firstName} ${member.lastName}`,
      })),
    [adminMembers]
  );

  const csoOptions = useMemo(
    () =>
      csos.map((cso) => ({
        value: cso._id,
        label: `${cso.firstName || ""} ${cso.lastName || ""}`.trim() || cso.email,
      })),
    [csos]
  );

  const sortedEntries = useMemo(() => {
    const monthRange = getMonthRange(currentMonth);
    const filtered = filterEntriesByMonth(entries || [], monthRange.start, monthRange.end);
    return filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [entries, currentMonth]);

  const monthRange = useMemo(() => getMonthRange(currentMonth), [currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpenderTypeChange = (event) => {
    const { value } = event.target;
    setForm((prev) => ({
      ...prev,
      spenderType: value,
      spenderId: value === "super_admin" ? "" : prev.spenderId,
    }));
  };

  const handleReceiptUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const { urls } = await dispatch(
        uploadImages({ files: [file], folderName: "expenses", target: "receipt" })
      ).unwrap();
      const uploadedUrl = urls?.[0];
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, receiptImg: uploadedUrl }));
        toast.success("Receipt uploaded");
      }
      dispatch(resetUpload());
    } catch (error) {
      toast.error(error || "Unable to upload receipt");
    }
  };

  const handleCreateExpense = async (event) => {
    event.preventDefault();

    if (Number(form.amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    if (!form.purpose.trim()) {
      toast.error("Purpose is required");
      return;
    }

    if (!form.date) {
      toast.error("Please pick a date");
      return;
    }

    if (isWeekend(form.date)) {
      toast.error("Expenses cannot be recorded on Saturdays or Sundays");
      return;
    }

    if (!form.receiptImg) {
      toast.error("Upload a receipt image before submitting");
      return;
    }

    if (form.spenderType !== "super_admin" && !form.spenderId) {
      toast.error("Select a spender for this expense");
      return;
    }

    try {
      const payload = {
        amount: Number(form.amount),
        purpose: form.purpose.trim(),
        date: form.date,
        receiptImg: form.receiptImg,
        spenderType: form.spenderType,
      };

      if (form.spenderType !== "super_admin") {
        payload.spenderId = form.spenderId;
      }

      const response = await dispatch(createExpense(payload)).unwrap();
      toast.success("Expense recorded");
      dispatch(fetchExpenseEntries());

      if (response?.date) {
        setSelectedDate(response.date);
        dispatch(fetchExpensesByDate(response.date));
      }

      setForm({
        ...initialFormState,
        date: form.date,
      });
      setIsExpenseModalOpen(false);
    } catch (error) {
      toast.error(error || "Unable to save expense");
    }
  };

  const handleMoveSubmit = async (event) => {
    event.preventDefault();
    if (!moveState.expense) {
      return;
    }

    if (!moveState.targetDate) {
      toast.error("Select a new date");
      return;
    }

    if (isWeekend(moveState.targetDate)) {
      toast.error("Cannot move an expense to a weekend");
      return;
    }

    try {
      const result = await dispatch(
        moveExpense({
          expenseId: moveState.expense._id,
          targetDate: moveState.targetDate,
        })
      ).unwrap();

      toast.success("Expense moved");
      setMoveState({ open: false, expense: null, targetDate: form.date });
      dispatch(fetchExpenseEntries());

      const nextDate = result?.targetDate || selectedDate;
      if (nextDate) {
        setSelectedDate(nextDate);
        dispatch(fetchExpensesByDate(nextDate));
      }
    } catch (error) {
      toast.error(error || "Unable to move expense");
    }
  };

  const openMoveModal = (expense, originDate) => {
    setMoveState({
      open: true,
      expense: { ...expense, originDate },
      targetDate: originDate,
    });
  };

  const closeMoveModal = () => {
    setMoveState({ open: false, expense: null, targetDate: form.date });
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expense Ledger</h1>
          <p className="text-sm text-slate-500">
            Record internal spending, assign accountability, and keep receipts organized.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(fetchExpenseEntries());
              if (selectedDate) {
                dispatch(fetchExpensesByDate(selectedDate));
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            <RefreshCw className={`h-4 w-4 ${entriesLoading ? "animate-spin" : ""}`} />
            Refresh data
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-1">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-800">
                <Wallet className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-semibold">Expense overview</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousMonth}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-sm font-semibold text-slate-700">{monthRange.display}</span>
                </div>
                
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                
                {new Date().getMonth() !== currentMonth.getMonth() || new Date().getFullYear() !== currentMonth.getFullYear() ? (
                  <button
                    type="button"
                    onClick={handleCurrentMonth}
                    className="text-xs font-semibold text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50"
                  >
                    Current
                  </button>
                ) : null}
              </div>
            </div>
            
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">Monthly total</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(sortedEntries.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0))}</p>
                <p className="text-xs text-slate-500">Total expenses for {monthRange.display}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(getInputDate(new Date()))}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Jump to today
              </button>
            </div>

            {entriesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : sortedEntries.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                <AlertCircle className="h-4 w-4" />
                No expenses recorded for {monthRange.display}.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Entries</th>
                      <th className="py-3 pr-4">Total</th>
                      <th className="py-3 pr-4 text-right">Open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedEntries.map((entry) => (
                      <tr key={entry.date} className="text-slate-700">
                        <td className="py-3 pr-4 font-semibold text-slate-900">
                          {formatDisplayDate(entry.date)}
                        </td>
                        <td className="py-3 pr-4">{entry.count} item(s)</td>
                        <td className="py-3 pr-4">{formatCurrency(entry.totalAmount)}</td>
                        <td className="py-3 pr-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedDate(entry.date)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                              selectedDate === entry.date
                                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                            }`}
                          >
                            View
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">Details for</p>
                <p className="text-lg font-bold text-slate-900">{formatDisplayDate(daily.date)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-slate-400">Total</p>
                <p className="text-xl font-semibold text-emerald-600">
                  {formatCurrency(daily.totalAmount)}
                </p>
              </div>
            </div>

            {dailyLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              </div>
            ) : daily.items.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                <AlertCircle className="h-4 w-4" />
                No expenses logged for this day.
              </div>
            ) : (
              <div className="space-y-4">
                {daily.items.map((item) => (
                  <article
                    key={item._id}
                    className="rounded-xl border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.purpose}</p>
                        <p className="text-xs text-slate-500">
                          {item.submittedAt
                            ? `${formatDisplayDate(item.submittedAt?.slice(0, 10))} • ${TIME_FORMATTER.format(
                                new Date(item.submittedAt)
                              )}`
                            : "Submitted"}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(item.amount)}</p>
                    </div>

                    <div className="mt-3 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-500" />
                        <div>
                          <p className="font-semibold text-slate-700">Spent by</p>
                          <p className="text-slate-500">
                            {item.spenderName}{" "}
                            <span className="uppercase text-slate-400">({item.spenderType})</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ReceiptText className="h-4 w-4 text-indigo-500" />
                        <div>
                          <p className="font-semibold text-slate-700">Receipt</p>
                          <a
                            href={item.receiptImg}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 underline"
                          >
                            View file
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-indigo-500" />
                        <div>
                          <p className="font-semibold text-slate-700">Status</p>
                          <p className="text-slate-500">
                            {item.movedAt ? "Moved" : "Logged"}{" "}
                            {item.movedAt && (
                              <span className="text-slate-400">
                                on {formatDisplayDate(item.movedAt.slice(0, 10))}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openMoveModal(item, daily.date)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        <MoveRight className="h-4 w-4" />
                        Move to another day
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      {moveState.open && moveState.expense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeMoveModal}
              className="absolute right-4 top-4 text-sm font-semibold text-slate-400 transition hover:text-slate-600"
            >
              Close
            </button>
            <div className="mb-4">
              <p className="text-xs uppercase text-slate-400">Move expense</p>
              <p className="text-lg font-semibold text-slate-900">{moveState.expense.purpose}</p>
              <p className="text-sm text-slate-500">
                Current date: {formatDisplayDate(moveState.expense.originDate)}
              </p>
            </div>
            <form onSubmit={handleMoveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">New date</label>
                <input
                  type="date"
                  value={moveState.targetDate}
                  onChange={(event) =>
                    setMoveState((prev) => ({ ...prev, targetDate: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={movingId === moveState.expense._id}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {movingId === moveState.expense._id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Moving expense...
                  </>
                ) : (
                  "Move expense"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div className="flex items-center gap-2 text-slate-800">
                <Wallet className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-semibold">Log a new expense</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Amount (NGN)</label>
                  <input
                    type="number"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Purpose</label>
                  <textarea
                    name="purpose"
                    value={form.purpose}
                    onChange={handleFormChange}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Describe what this expense covers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Date</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <CalendarDays className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Submissions on Saturdays or Sundays are blocked automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Spender</label>
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">
                    <select
                      name="spenderType"
                      value={form.spenderType}
                      onChange={handleSpenderTypeChange}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin member</option>
                      <option value="cso">CSO</option>
                    </select>

                    {form.spenderType !== "super_admin" && (
                      <select
                        name="spenderId"
                        value={form.spenderId}
                        onChange={handleFormChange}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Select {form.spenderType === "admin" ? "admin" : "CSO"}</option>
                        {(form.spenderType === "admin" ? adminOptions : csoOptions).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Receipt image</label>
                  <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                    {form.receiptImg ? (
                      <div className="space-y-3">
                        <img
                          src={`https://api.betterlifeloan.com${form.receiptImg}`}
                          alt="Receipt preview"
                          className="mx-auto h-40 w-full rounded-lg object-cover"
                        />
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, receiptImg: "" }))}
                            className="text-xs font-semibold text-rose-600"
                          >
                            Remove receipt
                          </button>
                          <span className="text-xs text-slate-400">or</span>
                          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-indigo-600">
                            Replace
                            <input type="file" className="hidden" onChange={handleReceiptUpload} accept="image/*" />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center gap-3 text-slate-500">
                        <UploadCloud className="h-8 w-8 text-indigo-500" />
                        <p className="text-sm font-semibold">Upload receipt photo</p>
                        <p className="text-xs">PNG, JPG up to 5MB</p>
                        <input type="file" className="hidden" onChange={handleReceiptUpload} accept="image/*" />
                      </label>
                    )}
                  </div>
                  {imageUploadLoading && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading receipt...
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving expense...
                    </>
                  ) : (
                    "Save expense"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
