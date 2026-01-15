import { useMemo, useState } from "react";
import { formatCurrency } from "../../utils/loanMetrics";

const STATUS_COLORS = {
  paidPast: "bg-emerald-500",
  paidFuture: "bg-sky-500",
  partial: "bg-amber-500",
  late: "bg-rose-500",
  holiday: "bg-indigo-500",
};

const LEGEND = [
  { label: "Full payment made", color: STATUS_COLORS.paidPast },
  { label: "Full payment ahead", color: STATUS_COLORS.paidFuture },
  { label: "Partial payment", color: STATUS_COLORS.partial },
  { label: "Defaulting", color: STATUS_COLORS.late },
  { label: "Holiday (no collection)", color: STATUS_COLORS.holiday },
];

function formatDateLabel(value) {
  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  } catch (_error) {
    return "—";
  }
}

function normalizeDate(value) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatStatusLabel(status) {
  if (!status) {
    return "Not due";
  }

  return status
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "paid":
      return "border border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
    case "partial":
      return "border border-amber-400/40 bg-amber-400/15 text-amber-200";
    case "pending":
      return "border border-rose-400/40 bg-rose-500/15 text-rose-200";
    case "holiday":
      return "border border-indigo-400/40 bg-indigo-500/15 text-indigo-200";
    default:
      return "border border-slate-500/40 bg-slate-600/20 text-slate-100";
  }
}

function useScheduleEntries(schedule = [], dailyAmount = 0) {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return schedule
      .map((entry) => {
        const { status, date } = entry || {};
        const normalizedDate = normalizeDate(date);

        if (!normalizedDate) {
          return null;
        }

        const hasElapsed = normalizedDate <= today;
        let colorClass = null;

        if (status === "paid") {
          colorClass = hasElapsed ? STATUS_COLORS.paidPast : STATUS_COLORS.paidFuture;
        } else if (status === "partial") {
          colorClass = STATUS_COLORS.partial;
        } else if (status === "pending" && hasElapsed) {
          colorClass = STATUS_COLORS.late;
        } else if (status === "holiday") {
          colorClass = STATUS_COLORS.holiday;
        }

        const amountPaid = Number(entry?.amountPaid ?? 0);
        let amountDue = 0;

        if (status === "holiday") {
          // no payment is due or recorded on holidays
          amountDue = 0;
        } else if (status === "paid") {
          amountDue = Math.max(dailyAmount - amountPaid, 0);
        } else if (status === "partial" && hasElapsed) {
          amountDue = Math.max(dailyAmount - amountPaid, 0);
        } else if (status === "pending" && hasElapsed) {
          amountDue = dailyAmount;
        }

        return {
          label: formatDateLabel(normalizedDate),
          rawDate: normalizedDate,
          colorClass,
          status,
          hasElapsed,
          amountPaid,
          amountDue,
          statusLabel: formatStatusLabel(status),
          holidayReason: entry?.holidayReason,
        };
      })
      .filter(Boolean);
  }, [dailyAmount, schedule]);
}

export default function LoanCard({ loan }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const dailyAmount = loan?.loanDetails?.dailyAmount ?? 0;
  const scheduleEntries = useScheduleEntries(loan?.repaymentSchedule, dailyAmount);

  if (!loan) {
    return null;
  }

  const customerName = [loan?.customerDetails?.firstName, loan?.customerDetails?.lastName]
    .filter(Boolean)
    .join(" ") || "Customer";

  const amountToBePaid = loan?.loanDetails?.amountToBePaid ?? 0;
  const amountPaidSoFar = loan?.loanDetails?.amountPaidSoFar ?? 0;
  const balanceRemaining = Math.max(amountToBePaid - amountPaidSoFar, 0);

  const summaryItems = [
    { label: "Loan + interest", value: formatCurrency(amountToBePaid), accent: "text-amber-400" },
    { label: "Loan balance", value: formatCurrency(balanceRemaining), accent: "text-rose-300" },
    { label: "Total paid", value: formatCurrency(amountPaidSoFar), accent: "text-emerald-300" },
    { label: "Daily amount", value: formatCurrency(dailyAmount), accent: "text-sky-300" },
  ];
  const selectedEntry = typeof selectedIndex === "number" ? scheduleEntries[selectedIndex] : null;
  const outstandingForEntry = selectedEntry ? Math.max(selectedEntry.amountDue, 0) : 0;

  return (
    <section className="w-full max-w-full rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-lg">
      <header className="border-b border-slate-800 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">{customerName}</h2>
              <p className="text-sm text-slate-300">Loan card overview</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {summaryItems.map(({ label, value, accent }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-800 bg-slate-800/60 px-3 py-3 text-left"
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                  <dd className={`text-base font-semibold ${accent}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-3 text-xs sm:justify-end sm:text-sm">
            {LEGEND.map(({ label, color }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 font-semibold text-slate-100"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="px-2 py-4 sm:px-4">
        {scheduleEntries.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 p-6 text-sm text-slate-300">
            Repayment schedule unavailable.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[420px] grid-cols-4 gap-2 sm:min-w-0 sm:grid-cols-5 lg:grid-cols-6">
              {scheduleEntries.map((entry, index) => {
                const isFirst = index === 0;
                const isSelected = selectedIndex === index;
                const cardBase =
                  "flex flex-col items-center justify-between gap-1 rounded-xl border px-1.5 py-2 text-center transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500";
                const cardColor = isFirst
                  ? isSelected
                    ? "bg-blue-950 border-blue-400"
                    : "bg-blue-900 border-blue-700"
                  : isSelected
                  ? "bg-slate-800 border-slate-600"
                  : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/60";
                const indicatorClass = isFirst ? "bg-blue-300" : entry.colorClass;
                const labelClass = isFirst
                  ? "text-[10px] font-semibold uppercase tracking-wide text-blue-100"
                  : "text-[10px] uppercase tracking-wide text-slate-300";
                const statusClass = isFirst
                  ? "text-[10px] font-semibold uppercase tracking-wide text-blue-100"
                  : "text-[10px] uppercase tracking-wide text-slate-400";
                const statusLabel = isFirst ? "Start" : entry.statusLabel;

                return (
                  <div
                    key={entry.rawDate?.getTime() ?? `${entry.label}-${index}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedIndex(index);
                      }
                    }}
                    className={`${cardBase} ${cardColor}`}
                    style={{ minHeight: "66px" }}
                  >
                    <span className={labelClass}>{entry.label}</span>
                    <div className="flex items-center justify-center">
                      {indicatorClass ? (
                        <span
                          className={`h-4 w-4 rounded-full ${indicatorClass} sm:h-5 sm:w-5`}
                          aria-label={entry.status || (isFirst ? "start" : "")}
                        />
                      ) : (
                        <span className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                      )}
                    </div>
                    {indicatorClass ? (
                      <span className={`${statusClass} hidden sm:block`}>{statusLabel}</span>
                    ) : (
                      <span className="hidden text-[10px] uppercase tracking-wide text-transparent sm:block">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-slate-500 hover:text-white"
              aria-label="Close payment details"
            >
              <span className="text-lg leading-none">×</span>
            </button>

            <div className="space-y-4 pt-2">
              <div>
                <p className="text-sm font-semibold text-slate-200">Payment Details</p>
                <p className="text-xs text-slate-400">{selectedEntry.label}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClass(selectedEntry.status)}`}>
                  Status: {selectedEntry.statusLabel}
                </span>
              </div>

              {selectedEntry.status === "holiday" && (
                <div className="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 px-3 py-3 text-xs text-indigo-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-200">Holiday notice</p>
                  <p className="mt-1 text-sm leading-relaxed text-indigo-100">
                    {selectedEntry.holidayReason || "Repayment is paused for this holiday."}
                  </p>
                </div>
              )}

              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount Paid</dt>
                  <dd className="text-base font-semibold text-white">{formatCurrency(selectedEntry.amountPaid)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount Due</dt>
                  <dd className="text-base font-semibold text-white">{formatCurrency(outstandingForEntry)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
