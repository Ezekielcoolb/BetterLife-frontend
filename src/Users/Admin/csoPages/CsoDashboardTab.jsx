import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import CsoDashboard from "../../CsosPages/CsoDashboard";
import {
  fetchAdminCsoDashboardStats,
  fetchAdminCsoOutstandingLoans,
  clearCsoDashboardError,
  setAdminDashboardTimeframe,
} from "../../../redux/slices/csoSlice";

export default function CsoDashboardTab({ csoId }) {
  const dispatch = useDispatch();
  const {
    adminDashboard: {
      timeframe,
      loading: dashboardLoading,
      error: dashboardError,
      data: dashboardData,
    },
    adminOutstanding: {
      loading: outstandingLoading,
      error: outstandingError,
      loans,
      totalOutstanding,
    },
  } = useSelector((state) => state.cso);

  useEffect(() => {
    if (!csoId) return;

    dispatch(fetchAdminCsoDashboardStats({ csoId, timeframe }));
    dispatch(fetchAdminCsoOutstandingLoans(csoId));
  }, [dispatch, csoId, timeframe]);

  const handleTimeframeChange = useCallback(
    (nextTimeframe) => {
      if (!csoId || !nextTimeframe || nextTimeframe === timeframe) {
        return;
      }

      dispatch(setAdminDashboardTimeframe(nextTimeframe));
      dispatch(fetchAdminCsoDashboardStats({ csoId, timeframe: nextTimeframe }));
    },
    [dispatch, csoId, timeframe]
  );

  useEffect(() => {
    if (dashboardError || outstandingError) {
      const timeout = setTimeout(() => {
        dispatch(clearCsoDashboardError());
      }, 4000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [dispatch, dashboardError, outstandingError]);

  const isLoading = dashboardLoading || outstandingLoading;
  const error = dashboardError || outstandingError;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Loading dashboard metrics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <CsoDashboard
      mode="admin"
      timeframe={timeframe}
      onTimeframeChange={handleTimeframeChange}
      dashboardData={dashboardData}
      dashboardLoading={dashboardLoading}
      outstandingTotal={totalOutstanding}
      outstandingLoading={outstandingLoading}
    />
  );
}
