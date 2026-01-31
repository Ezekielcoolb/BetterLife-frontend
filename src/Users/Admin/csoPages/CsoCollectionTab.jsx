import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import {
  fetchAdminCsoCollection,
  fetchAdminCsoFormCollection,
  clearCsoCollectionError,
} from "../../../redux/slices/csoSlice";

const formatCurrency = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "₦0.00";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(number);
};

function SummaryCard({ title, value, description, accent = "from-indigo-500" }) {
  return (
    <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className={`mt-3 text-2xl font-bold text-slate-900`}>{value}</p>
      {description ? (
        <p className="mt-2 text-xs font-medium text-slate-500">{description}</p>
      ) : null}
      <div
        className={`mt-4 h-1.5 w-16 rounded-full bg-gradient-to-r ${accent} to-transparent`
          .trim()}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "defaulting") {
    return (
      <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
        Defaulting
      </span>
    );
  }

  if (normalized === "not due yet") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        Not Due
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      Paid
    </span>
  );
}

export default function CsoCollectionTab({ csoId }) {
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const { collection, formCollection } = useSelector((state) => state.cso);

  useEffect(() => {
    if (!csoId || !selectedDate) {
      return;
    }

    dispatch(fetchAdminCsoCollection({ csoId, date: selectedDate }));
    dispatch(fetchAdminCsoFormCollection({ csoId, date: selectedDate }));
  }, [dispatch, csoId, selectedDate]);

  useEffect(() => {
    const error = collection.error || formCollection.error;
    if (error) {
      toast.error(error);
      dispatch(clearCsoCollectionError());
    }
  }, [collection.error, formCollection.error, dispatch]);

  const totals = useMemo(() => {
    const totalPaidToday = Number(collection.summary.totalPaidToday || 0);
    const totalFormCollection = Number(
      formCollection.summary.totalLoanAppForm || 0
    );
    const totalInsuranceFee = Number(
      formCollection.summary.totalInsuranceFee || 0
    );
    const totalDue = Number(collection.summary.totalDue || 0);

    return {
      totalPaidToday,
      totalFormCollection,
      totalInsuranceFee,
      totalDue,
      combinedCollection: totalPaidToday + totalFormCollection + totalInsuranceFee,
      defaultingCount: Number(collection.summary.defaultingCount || 0),
    };
  }, [collection.summary, formCollection.summary]);

  const isLoading = collection.loading || formCollection.loading;
  const hasCollectionRecords = collection.records.length > 0;
  const hasFormRecords = formCollection.records.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Daily Collection Overview
          </h3>
          <p className="text-sm text-slate-500">
            Track the CSO's cash movement, outstanding amounts, and form revenue
            for the selected day.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            max={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Collected Today"
          value={formatCurrency(totals.totalPaidToday)}
          description={`${collection.summary.totalCustomers || 0} active customers`}
          accent="from-emerald-500"
        />
        <SummaryCard
          title="Form Collection"
          value={formatCurrency(totals.totalFormCollection)}
          description="Loan application forms remitted"
          accent="from-indigo-500"
        />
        <SummaryCard
          title="Insurance Fee"
          value={formatCurrency(totals.totalInsuranceFee)}
          description="Insurance premiums remitted"
          accent="from-violet-500"
        />
        <SummaryCard
          title="Outstanding"
          value={formatCurrency(totals.totalDue)}
          description="Expected but not yet remitted"
          accent="from-amber-500"
        />
        <SummaryCard
          title="Defaulting Accounts"
          value={totals.defaultingCount}
          description="Loans requiring follow-up"
          accent="from-rose-500"
        />
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-indigo-50 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Total Day Collection</p>
          <p className="text-2xl font-bold text-indigo-700">{formatCurrency(totals.combinedCollection)}</p>
        </div>
        <p className="text-sm text-indigo-600 font-medium">Sum of paid today, forms, and insurance.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-slate-900">
            Daily Loan Collections
          </h4>
          <span className="text-sm font-semibold text-indigo-600">
            {formatCurrency(totals.totalPaidToday)} collected today
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              Loading collection records...
            </span>
          </div>
        ) : hasCollectionRecords ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Loan ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3 text-right">Paid Today</th>
                  <th className="px-4 py-3 text-right">Paid to Date</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collection.records.map((record) => (
                  <tr key={record.loanMongoId || record.loanId}>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {record.loanId}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="font-medium text-slate-900">
                        {record.customerName || "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        Daily: {formatCurrency(record.dailyAmount || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{record.groupName || "—"}</div>
                      {record.leaderName ? (
                        <div className="text-xs text-slate-500">
                          Leader: {record.leaderName}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      {formatCurrency(record.amountPaidToday || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatCurrency(record.amountPaidToDate || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-600">
                      {formatCurrency(record.amountDue || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.collectionStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-slate-500">
            No collection records for the selected date.
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-slate-900">
            Form Collections
          </h4>
            <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-indigo-600">
                Forms: {formatCurrency(totals.totalFormCollection)}
                </span>
                <span className="text-sm font-semibold text-violet-600">
                Insurance: {formatCurrency(totals.totalInsuranceFee)}
                </span>
            </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              Loading form collection records...
            </span>
          </div>
        ) : hasFormRecords ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Loan ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Leader</th>
                   <th className="px-4 py-3 text-right">Form Fee</th>
                   <th className="px-4 py-3 text-right">Insurance</th>
                   <th className="px-4 py-3 text-right">Disbursed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formCollection.records.map((record) => (
                  <tr key={record.loanId}>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {record.loanId}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.customerName || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.groupName || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.leaderName || "—"}
                    </td>
                     <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                       {formatCurrency(record.loanAppForm || 0)}
                     </td>
                     <td className="px-4 py-3 text-right font-semibold text-violet-600">
                       {formatCurrency(record.insuranceFee || 0)}
                     </td>
                     <td className="px-4 py-3 text-right text-slate-600">
                      {record.disbursedAt
                        ? new Date(record.disbursedAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            No form collection records for the selected date.
          </div>
        )}
      </div>
    </section>
  );
}
