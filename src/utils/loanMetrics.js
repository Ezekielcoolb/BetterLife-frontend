const DAILY_INSTALLMENT_COUNT = 22;

export const formatCurrency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(value);
  } catch (_error) {
    return `${value}`;
  }
};

export const formatDateWithTime = (value) => {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return `${value}`;
  }
};

const toDateOrNull = (value) => {
  if (!value) {
    return null;
  }

  try {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch (_error) {
    return null;
  }
};

export const isWeekend = (date) => {
  if (!(date instanceof Date)) {
    return false;
  }

  const day = date.getDay();
  return day === 0 || day === 6;
};

export const addDays = (date, days) => {
  if (!(date instanceof Date)) {
    return null;
  }

  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addBusinessDays = (startDate, businessDays) => {
  if (!(startDate instanceof Date) || !Number.isFinite(businessDays)) {
    return null;
  }

  const date = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < businessDays) {
    date.setDate(date.getDate() + 1);
    if (!isWeekend(date)) {
      daysAdded += 1;
    }
  }

  return date;
};

export const isHoliday = (date, holidays = []) => {
  if (!date || !Array.isArray(holidays)) return false;

  const d = new Date(date);
  const monthDay = `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;

  return holidays.some((h) => {
    if (h.isRecurring) {
      const hMonth = String(new Date(h.holiday).getUTCMonth() + 1).padStart(
        2,
        "0"
      );
      const hDay = String(new Date(h.holiday).getUTCDate()).padStart(2, "0");
      return `${hMonth}-${hDay}` === monthDay;
    }
    const hDate = new Date(h.holiday);
    return (
      hDate.getUTCFullYear() === d.getUTCFullYear() &&
      hDate.getUTCMonth() === d.getUTCMonth() &&
      hDate.getUTCDate() === d.getUTCDate()
    );
  });
};

export const countBusinessDays = (startDate, endDate, holidays = []) => {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    return 0;
  }

  const s = new Date(startDate);
  s.setHours(0, 0, 0, 0);
  const e = new Date(endDate);
  e.setHours(0, 0, 0, 0);

  if (s > e) {
    return 0;
  }

  let days = 0;
  const cursor = new Date(s);

  while (cursor <= e) {
    if (!isWeekend(cursor) && !isHoliday(cursor, holidays)) {
      days += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

export const computeLoanMetrics = (loan, holidays = []) => {
  if (!loan) {
    return {
      disbursedAt: null,
      projectedEndDate: null,
      amountDisbursed: 0,
      amountToBePaid: 0,
      amountPaidSoFar: 0,
      dailyAmount: 0,
      businessDaysSinceDisbursement: 0,
      expectedRepaymentsByNow: 0,
      outstandingDue: 0,
      balanceRemaining: 0,
    };
  }

  const disbursedAt = toDateOrNull(loan.disbursedAt);
  const amountDisbursed = Number(loan?.loanDetails?.amountDisbursed || 0);
  const amountToBePaid = Number(loan?.loanDetails?.amountToBePaid || 0);
  const amountPaidSoFar = Number(loan?.loanDetails?.amountPaidSoFar || 0);
  const dailyAmount = Number(loan?.loanDetails?.dailyAmount || 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizedDisbursedAt = disbursedAt ? new Date(disbursedAt) : null;
  if (normalizedDisbursedAt) {
    normalizedDisbursedAt.setHours(0, 0, 0, 0);
  }

  const projectedEndDate = normalizedDisbursedAt
    ? addBusinessDays(normalizedDisbursedAt, DAILY_INSTALLMENT_COUNT)
    : null;

  const businessDaysSinceDisbursement = normalizedDisbursedAt
    ? Math.max(
        countBusinessDays(addDays(normalizedDisbursedAt, 1), today, holidays),
        0
      )
    : 0;

  const expectedRepaymentsByNow = dailyAmount * businessDaysSinceDisbursement;
  const shouldClearOutstandingBalance =
    businessDaysSinceDisbursement >= DAILY_INSTALLMENT_COUNT;

  const outstandingDue = shouldClearOutstandingBalance
    ? Math.max(amountToBePaid - amountPaidSoFar, 0)
    : Math.max(expectedRepaymentsByNow - amountPaidSoFar, 0);
  const balanceRemaining = Math.max(amountToBePaid - amountPaidSoFar, 0);

  return {
    disbursedAt: normalizedDisbursedAt,
    projectedEndDate,
    amountDisbursed,
    amountToBePaid,
    amountPaidSoFar,
    dailyAmount,
    businessDaysSinceDisbursement,
    expectedRepaymentsByNow,
    outstandingDue: Number(outstandingDue.toFixed(2)),
    balanceRemaining: Number(balanceRemaining.toFixed(2)),
  };
};

export const generateRepaymentSchedule = (loan, holidays = []) => {
  if (!loan || !loan.loanDetails) return [];

  const dailyAmount = Number(loan.loanDetails.dailyAmount || 0);
  const amountToBePaid = Number(loan.loanDetails.amountToBePaid || 0);
  const disbursedAt = toDateOrNull(
    loan.disbursedAt || loan.loanDetails.disbursedAt
  );

  const payments = Array.isArray(loan.dailyPayment) ? loan.dailyPayment : [];
  let remainingTotalPaid = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  if (!disbursedAt || dailyAmount <= 0) return [];

  const schedule = [];
  let currentDate = new Date(disbursedAt);
  currentDate.setDate(currentDate.getDate() + 1);

  let scheduledAmount = 0;

  let safetyCounter = 0;
  const MAX_ITERATIONS = 365;

  while (
    scheduledAmount < amountToBePaid - 0.01 &&
    safetyCounter < MAX_ITERATIONS
  ) {
    if (isWeekend(currentDate)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    if (isHoliday(currentDate, holidays)) {
      schedule.push({
        date: new Date(currentDate).toISOString(),
        status: "holiday",
        amountPaid: 0,
        holidayReason: "Public Holiday",
      });
      currentDate.setDate(currentDate.getDate() + 1);
      safetyCounter++;
      continue;
    }

    const amountDue = Math.min(dailyAmount, amountToBePaid - scheduledAmount);
    const amountPaidForDay = Math.min(remainingTotalPaid, amountDue);

    remainingTotalPaid = Math.max(0, remainingTotalPaid - amountPaidForDay);
    scheduledAmount += amountDue;

    let status = "pending";
    if (amountPaidForDay >= amountDue - 0.01) {
      status = "paid";
    } else if (amountPaidForDay > 0) {
      status = "partial";
    }

    schedule.push({
      date: new Date(currentDate).toISOString(),
      status,
      amountPaid: amountPaidForDay,
    });

    currentDate.setDate(currentDate.getDate() + 1);
    safetyCounter++;
  }

  return schedule;
};
