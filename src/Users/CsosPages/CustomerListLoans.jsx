import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Sparkles, Wallet, CalendarDays, Building2 } from "lucide-react";

import {
  fetchLoansByCustomerBvn,
  clearLoanError,
  resetCustomerLoans,
} from "../../redux/slices/loanSlice";
import { formatCurrency, formatDateWithTime } from "../../utils/loanMetrics";

export default function CustomerListLoans() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bvn } = useParams();

  const {
    customerLoans,
    customerLoansLoading,
    customerLoansError,
    customerLoansBvn,
  } = useSelector((state) => state.loan);

  useEffect(() => {
    if (!bvn) {
      toast.error("Customer BVN missing");
      navigate(-1);
      return () => {};
    }

    dispatch(fetchLoansByCustomerBvn(bvn));

    return () => {
      dispatch(resetCustomerLoans());
    };
  }, [dispatch, bvn, navigate]);

  useEffect(() => {
    if (customerLoansError) {
      toast.error(customerLoansError);
      dispatch(clearLoanError());
    }
  }, [customerLoansError, dispatch]);

  const latestLoan = useMemo(() => {
    return Array.isArray(customerLoans) && customerLoans.length > 0 ? customerLoans[0] : null;
  }, [customerLoans]);

  const customerName = useMemo(() => {
    if (!latestLoan?.customerDetails) {
      return "Customer";
    }

    const { firstName, lastName } = latestLoan.customerDetails;
    return [firstName, lastName].filter(Boolean).join(" ") || "Customer";
  }, [latestLoan]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          BVN:
          <span>{customerLoansBvn || bvn}</span>
        </span> */}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Loan history</h1>
            <p className="text-sm text-slate-500">Showing every loan submitted for {customerName}.</p>
          </div>
          {latestLoan && (
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" /> Latest status: {latestLoan.status}
            </div>
          )}
        </header>

        {customerLoansLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              Loading customer loans...
            </div>
          </div>
        ) : customerLoans?.length ? (
          <div className="max-h-[60vh] w-full overflow-x-auto overflow-y-auto overscroll-x-contain rounded-2xl border border-slate-200">
            <table className="min-w-[860px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3 text-left">Customer Name</th>
                  
                  {/* <th scope="col" className="px-4 py-3 text-left">Business</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount requested</th> */}
                  <th scope="col" className="px-4 py-3 text-right">Total to be paid</th>
                  <th scope="col" className="px-4 py-3 text-right">Paid so far</th>
                  <th scope="col" className="px-4 py-3 text-left">Start Date</th>
                  <th scope="col" className="px-4 py-3 text-left">End Date</th>
                  <th scope="col" className="px-4 py-3 text-left">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {customerLoans.map((loan) => {
                  const firstName = loan?.customerDetails?.firstName;
                  const lastName = loan?.customerDetails?.lastName;
                  const fullName = `${firstName} ${lastName}`;
                  const amountToBePaid = loan?.loanDetails?.amountToBePaid;
                  const amountPaidSoFar = loan?.loanDetails?.amountPaidSoFar;
                  const status = loan?.status || "waiting for approval";
                  const createdAt = loan?.createdAt ? new Date(loan.createdAt) : null;
                  const projectedEndDate = loan?.projectedEndDate ? new Date(loan.projectedEndDate) : null;

                  return (
                    <tr key={loan?._id || loan?.loanId} className="text-sm text-slate-700">
                      <td className="px-4 py-3 font-semibold text-slate-800">{fullName}</td>
                      
                      {/* <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span>{fullName || "—"}</span>
                        </div>
                      </td> */}
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(amountToBePaid)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(amountPaidSoFar)}</td>
                      <td className="px-4 py-3 text-slate-500">{createdAt ? formatDateWithTime(createdAt) : "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{  projectedEndDate ? formatDateWithTime(projectedEndDate) : "—"}</td>
                      <td className="px-4 py-3 capitalize">{status}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/cso/loans/${loan._id}`)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600"
                        >
                          <Wallet className="h-3.5 w-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              <p>No loans found for this NIN yet.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
