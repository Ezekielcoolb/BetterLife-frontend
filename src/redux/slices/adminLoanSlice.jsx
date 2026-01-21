import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const extractErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

export const fetchWaitingLoans = createAsyncThunk(
  "adminLoans/fetchWaiting",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/loans/waiting`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load waiting loans"));
    }
  }
);

export const fetchAdminLoans = createAsyncThunk(
  "adminLoans/fetchAdminLoans",
  async (
    { status = "all", search = "", csoId = "", page = 1, limit = 10 } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = { page, limit };

      if (status && status !== "all") {
        params.status = status;
      }

      if (search && search.trim()) {
        params.search = search.trim();
      }

      if (csoId) {
        params.csoId = csoId;
      }

      const response = await axios.get(`${API_BASE_URL}/api/admin/loans`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load loans"));
    }
  }
);

export const fetchApprovedLoans = createAsyncThunk(
  "adminLoans/fetchApproved",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/loans/approved`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load approved loans"));
    }
  }
);

export const fetchLoanById = createAsyncThunk(
  "adminLoans/fetchById",
  async (loanId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/loans/${loanId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load loan details"));
    }
  }
);

export const approveLoan = createAsyncThunk(
  "adminLoans/approve",
  async ({ loanId, amountApproved }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/loans/${loanId}/approve`, {
        amountApproved,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to approve loan"));
    }
  }
);

export const rejectLoan = createAsyncThunk(
  "adminLoans/reject",
  async ({ loanId, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/loans/${loanId}/reject`, {
        reason,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to reject loan"));
    }
  }
);

export const requestLoanEdit = createAsyncThunk(
  "adminLoans/requestEdit",
  async ({ loanId, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/loans/${loanId}/request-edit`, {
        reason,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to request loan edit"));
    }
  }
);

export const updateLoanCallChecks = createAsyncThunk(
  "adminLoans/updateCallChecks",
  async ({ loanId, callChecks }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/loans/${loanId}/call-checks`, {
        callChecks,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to update call verification"));
    }
  }
);

export const fetchCustomerLoans = createAsyncThunk(
  "adminLoans/fetchCustomerLoans",
  async (bvn, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/loans/customer/${bvn}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to fetch customer loans"));
    }
  }
);

export const fetchDashboardSummaryStats = createAsyncThunk(
  "adminLoans/fetchDashboardSummaryStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard/summary-stats`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load summary stats"));
    }
  }
);

export const fetchDashboardFinancialOverview = createAsyncThunk(
  "adminLoans/fetchDashboardFinancialOverview",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard/financial-overview`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load financial overview"));
    }
  }
);

export const fetchDashboardTargetProgress = createAsyncThunk(
  "adminLoans/fetchDashboardTargetProgress",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard/target-progress`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load target progress"));
    }
  }
);

export const fetchDashboardDisbursementTrends = createAsyncThunk(
  "adminLoans/fetchDashboardDisbursementTrends",
  async ({ year } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard/disbursement-trends`, {
        params: { year },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load disbursement trends"));
    }
  }
);

export const fetchMonthlySummary = createAsyncThunk(
  "adminLoans/fetchMonthlySummary",
  async ({ year }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/business-report/monthly-summary`, {
        params: { year },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load monthly summary"));
    }
  }
);


export const disburseLoan = createAsyncThunk(
  "adminLoans/disburse",
  async ({ loanId, disbursementPicture }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/loans/${loanId}/disburse`, {
        disbursementPicture,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to disburse loan"));
    }
  }
);

const initialState = {
  adminLoans: [],
  adminLoansLoading: false,
  adminLoansError: null,
  adminLoansCounts: {
    total: 0,
    active: 0,
    fullyPaid: 0,
    pending: 0,
    rejected: 0,
  },
  adminLoansPagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  },
  waitingLoans: [],
  waitingLoansLoading: false,
  waitingLoansError: null,
  approvedLoans: [],
  approvedLoansLoading: false,
  approvedLoansError: null,
  detail: null,
  detailLoading: false,
  detailError: null,
  updating: false,
  updateError: null,
  customerLoans: [],
  customerLoansLoading: false,
  customerLoansError: null,
  csoLoans: [],
  csoLoansCso: null,
  csoLoansPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  csoLoansLoading: false,
  csoLoansError: null,
  // CSO Loan Metrics state
  csoMetrics: [],
  csoMetricsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  csoMetricsMonth: new Date().getMonth() + 1,
  csoMetricsYear: new Date().getFullYear(),
  csoMetricsLoading: false,
  csoMetricsError: null,
  // CSO Weekly loan counts state
  csoWeeklyData: [],
  csoWeeklyWeeks: [],
  csoWeeklySummary: { totalCsos: 0, totalLoans: 0, weekTotals: [] },
  csoWeeklyMonth: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
  csoWeeklyAvailableMonths: [],
  csoWeeklyGeneratedAt: null,
  csoWeeklyLoading: false,
  csoWeeklyError: null,
  // CSO General report state
  csoGeneralData: [],
  csoGeneralSummary: {
    totalCsos: 0,
    portfolioWorth: 0,
    balanceOfDebt: 0,
    totalRepayment: 0,
    totalDisbursed: 0,
    totalInterest: 0,
    totalLoans: 0,
    totalRecovery: 0,
    overshootValue: 0,
    tenBones: 0,
    totalLoanAppForm: 0,
    totalExpenses: 0,
    totalProfit: 0,
    loanBalance: 0,
    profitability: 0,
  },
  csoGeneralMonth: {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
  csoGeneralAvailableMonths: [],
  csoGeneralGeneratedAt: null,
  csoGeneralLoading: false,
  csoGeneralError: null,
  // Business report state
  businessReportWeeks: [],
  businessReportMonth: {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
  businessReportLoading: false,
  businessReportError: null,
  businessLiquidityWeeks: [],
  businessLiquidityLoading: false,
  businessLiquidityError: null,
  // Customer Loan Weekly state
  customerLoans: [],
  customerLoansPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  customerLoansWeek: { start: null, end: null, days: [] },
  customerLoansLoading: false,
  customerLoansError: null,
  // Overdue Loans state
  overdueLoans: [],
  overdueLoansPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  overdueLoansLoading: false,
  overdueLoansError: null,
  // Customer Summary state
  customerSummary: [],
  customerSummaryPagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  customerSummaryLoading: false,
  customerSummaryError: null,
  customerLoanHistory: [],
  customerLoanHistoryLoading: false,
  customerLoanHistoryError: null,
  customerLoanHistoryCustomer: null,
  customerDetailsRecord: null,
  customerDetailsLoading: false,
  customerDetailsError: null,
  monthlySummary: [],
  monthlySummaryLoading: false,
  monthlySummaryError: null,
  monthlySummaryYear: null,
  groupLeaders: [],
  groupLeadersLoading: false,
  groupLeadersError: null,
  dashboardAnalytics: null,
  dashboardAnalyticsLoading: false,
  dashboardAnalyticsError: null,
  dashboardAnalyticsYear: new Date().getFullYear(),
  dashboardSummary: null,
  dashboardSummaryLoading: false,
  dashboardSummaryError: null,
  dashboardFinancials: null,
  dashboardFinancialsLoading: false,
  dashboardFinancialsError: null,
  dashboardTarget: null,
  dashboardTargetLoading: false,
  dashboardTargetError: null,
  dashboardTrends: [],
  dashboardTrendsLoading: false,
  dashboardTrendsError: null,
};

export const fetchLoansByCsoId = createAsyncThunk(
  "adminLoans/fetchByCsoId",
  async (csoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/loans/cso/${csoId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load CSO loans"));
    }
  }
);

export const fetchCsoLoanMetrics = createAsyncThunk(
  "adminLoans/fetchCsoLoanMetrics",
  async ({ month, year, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cso-loan-metrics`, {
        params: { month, year, page, limit }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load CSO loan metrics"));
    }
  }
);

export const fetchCsoWeeklyLoanCounts = createAsyncThunk(
  "adminLoans/fetchCsoWeeklyLoanCounts",
  async ({ month, year } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (Number.isFinite(month)) params.month = month;
      if (Number.isFinite(year)) params.year = year;

      const response = await axios.get(`${API_BASE_URL}/api/cso-weekly-loan-counts`, {
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Unable to load CSO weekly loan counts")
      );
    }
  }
);

export const fetchCsoGeneralReport = createAsyncThunk(
  "adminLoans/fetchCsoGeneralReport",
  async ({ month, year } = {}, { rejectWithValue }) => {
    try {
      const params = {};

      if (Number.isFinite(month)) {
        params.month = month;
      }

      if (Number.isFinite(year)) {
        params.year = year;
      }

      const response = await axios.get(`${API_BASE_URL}/api/cso-general-report`, {
        params,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Unable to load CSO general report")
      );
    }
  }
);

export const fetchCustomerLoanWeekly = createAsyncThunk(
  "adminLoans/fetchCustomerLoanWeekly",
  async ({ weekStart, page = 1, limit = 20, search = "", csoId = "" }, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (weekStart) params.weekStart = weekStart;
      if (search) params.search = search;
      if (csoId) params.csoId = csoId;
      const response = await axios.get(`${API_BASE_URL}/api/customer-loan-weekly`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load customer loans"));
    }
  }
);

export const fetchOverdueLoans = createAsyncThunk(
  "adminLoans/fetchOverdueLoans",
  async ({ page = 1, limit = 20, search = "", csoId = "" }, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (csoId) params.csoId = csoId;
      const response = await axios.get(`${API_BASE_URL}/api/overdue-loans`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load overdue loans"));
    }
  }
);

export const fetchBusinessReportWeeklyMetrics = createAsyncThunk(
  "adminLoans/fetchBusinessReportWeeklyMetrics",
  async ({ month, year } = {}, { rejectWithValue }) => {
    try {
      const params = {};

      if (Number.isFinite(month)) {
        params.month = month;
      }

      if (Number.isFinite(year)) {
        params.year = year;
      }

      const response = await axios.get(`${API_BASE_URL}/api/business-report/weekly-metrics`, {
        params,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Unable to load business weekly metrics")
      );
    }
  }
);

export const fetchBusinessReportLiquidity = createAsyncThunk(
  "adminLoans/fetchBusinessReportLiquidity",
  async ({ month, year } = {}, { rejectWithValue }) => {
    try {
      const params = {};

      if (Number.isFinite(month)) {
        params.month = month;
      }

      if (Number.isFinite(year)) {
        params.year = year;
      }

      const response = await axios.get(`${API_BASE_URL}/api/business-report/liquidity`, {
        params,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Unable to load business liquidity metrics")
      );
    }
  }
);

export const fetchCustomerSummary = createAsyncThunk(
  "adminLoans/fetchCustomerSummary",
  async ({ page = 1, limit = 10, search = "" }, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (search) params.search = search;
      const response = await axios.get(`${API_BASE_URL}/api/admin/customers`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load customer summary"));
    }
  }
);

export const fetchCustomerLoansByBvn = createAsyncThunk(
  "adminLoans/fetchCustomerLoansByBvn",
  async (bvn, { rejectWithValue }) => {
    const trimmedBvn = typeof bvn === "string" ? bvn.trim() : "";

    if (!trimmedBvn) {
      return rejectWithValue("Customer BVN is required");
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/customers/${trimmedBvn}/loans`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load customer loans"));
    }
  }
);

export const fetchCustomerDetailsByBvn = createAsyncThunk(
  "adminLoans/fetchCustomerDetailsByBvn",
  async (bvn, { rejectWithValue }) => {
    const trimmedBvn = typeof bvn === "string" ? bvn.trim() : "";

    if (!trimmedBvn) {
      return rejectWithValue("Customer BVN is required");
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/customers/${trimmedBvn}/details`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load customer details"));
    }
  }
);

export const fetchCsoCustomers = createAsyncThunk(
  "adminLoans/fetchCsoCustomers",
  async ({ csoId, search, groupId, page, limit }, { rejectWithValue }) => {
    try {
      const params = {};
      if (search) params.search = search;
      if (groupId) params.groupId = groupId;
      if (Number.isFinite(page)) params.page = page;
      if (Number.isFinite(limit)) params.limit = limit;
      
      const response = await axios.get(`${API_BASE_URL}/api/loans/cso/${csoId}/customers`, {
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load CSO customers"));
    }
  }
);

export const fetchCsoGroupLeaders = createAsyncThunk(
  "adminLoans/fetchCsoGroupLeaders",
  async (csoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/csos/${csoId}/group-leaders`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load group leaders"));
    }
  }
);

export const assignCustomersToGroup = createAsyncThunk(
  "adminLoans/assignCustomersToGroup",
  async ({ loanIds, groupLeaderId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/loans/assign-group`, {
        loanIds,
        groupLeaderId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to assign customers to group"));
    }
  }
);

export const assignCustomersToCso = createAsyncThunk(
  "adminLoans/assignCustomersToCso",
  async ({ loanIds, csoId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/loans/assign-cso`, {
        loanIds,
        csoId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to assign customers to CSO"));
    }
  }
);

const adminLoanSlice = createSlice({
  name: "adminLoans",
  initialState,
  reducers: {
    clearAdminLoanErrors(state) {
      state.adminLoansError = null;
      state.waitingLoansError = null;
      state.approvedLoansError = null;
      state.detailError = null;
      state.updateError = null;
      state.csoLoansError = null;
      state.csoMetricsError = null;
      state.csoWeeklyError = null;
      state.csoGeneralError = null;
      state.customerLoansError = null;
      state.overdueLoansError = null;
      state.customerSummaryError = null;
      state.customerLoanHistoryError = null;
      state.customerDetailsError = null;
      state.businessReportError = null;
      state.businessLiquidityError = null;
      state.dashboardSummaryError = null;
      state.dashboardFinancialsError = null;
      state.dashboardTargetError = null;
      state.dashboardTrendsError = null;
    },
    resetLoanDetail(state) {
      state.detail = null;
      state.detailLoading = false;
      state.detailError = null;
    },
    setDashboardAnalyticsYear(state, action) {
      state.dashboardAnalyticsYear = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminLoans.pending, (state) => {
        state.adminLoansLoading = true;
        state.adminLoansError = null;
      })
      .addCase(fetchAdminLoans.fulfilled, (state, action) => {
        state.adminLoansLoading = false;
        state.adminLoans = action.payload?.data || [];
        state.adminLoansPagination = {
          page: action.payload?.pagination?.page || 1,
          limit: action.payload?.pagination?.limit || 10,
          totalItems: action.payload?.pagination?.totalItems || 0,
          totalPages: action.payload?.pagination?.totalPages || 1,
        };
        state.adminLoansCounts = {
          total: action.payload?.counts?.total || 0,
          active: action.payload?.counts?.active || 0,
          fullyPaid: action.payload?.counts?.fullyPaid || 0,
          pending: action.payload?.counts?.pending || 0,
          rejected: action.payload?.counts?.rejected || 0,
        };
      })
      .addCase(fetchAdminLoans.rejected, (state, action) => {
        state.adminLoansLoading = false;
        state.adminLoansError = action.payload || "Unable to load loans";
      })
      .addCase(fetchWaitingLoans.pending, (state) => {
        state.waitingLoansLoading = true;
        state.waitingLoansError = null;
      })
      .addCase(fetchWaitingLoans.fulfilled, (state, action) => {
        state.waitingLoansLoading = false;
        state.waitingLoans = action.payload;
      })
      .addCase(fetchWaitingLoans.rejected, (state, action) => {
        state.waitingLoansLoading = false;
        state.waitingLoansError = action.payload || "Unable to load waiting loans";
      })
      .addCase(fetchApprovedLoans.pending, (state) => {
        state.approvedLoansLoading = true;
        state.approvedLoansError = null;
      })
      .addCase(fetchApprovedLoans.fulfilled, (state, action) => {
        state.approvedLoansLoading = false;
        state.approvedLoans = action.payload;
      })
      .addCase(fetchApprovedLoans.rejected, (state, action) => {
        state.approvedLoansLoading = false;
        state.approvedLoansError = action.payload || "Unable to load approved loans";
      })
      .addCase(fetchLoanById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchLoanById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchLoanById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload || "Unable to load loan details";
      })
      .addCase(approveLoan.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(approveLoan.fulfilled, (state, action) => {
        state.updating = false;
        state.detail = action.payload;
        state.waitingLoans = state.waitingLoans.filter((loan) => loan._id !== action.payload._id);
      })
      .addCase(approveLoan.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload || "Unable to approve loan";
      })
      .addCase(rejectLoan.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(rejectLoan.fulfilled, (state, action) => {
        state.updating = false;
        state.detail = action.payload;
        const updated = action.payload;
        if (updated.status === "waiting for approval" || updated.status === "edited") {
          state.waitingLoans = state.waitingLoans.map((loan) =>
            loan._id === updated._id ? updated : loan
          );
        } else {
          state.waitingLoans = state.waitingLoans.filter((loan) => loan._id !== updated._id);
        }
      })
      .addCase(rejectLoan.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload || "Unable to reject loan";
      })
      .addCase(requestLoanEdit.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(requestLoanEdit.fulfilled, (state, action) => {
        state.updating = false;
        state.detail = action.payload;
        state.waitingLoans = state.waitingLoans.map((loan) =>
          loan._id === action.payload._id ? action.payload : loan
        );
      })
      .addCase(requestLoanEdit.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload || "Unable to request loan edit";
      })
      .addCase(fetchCustomerLoans.pending, (state) => {
        state.customerLoansLoading = true;
        state.customerLoansError = null;
      })
      .addCase(fetchCustomerLoans.fulfilled, (state, action) => {
        state.customerLoansLoading = false;
        state.customerLoans = action.payload;
      })
      .addCase(fetchCustomerLoans.rejected, (state, action) => {
        state.customerLoansLoading = false;
        state.customerLoansError = action.payload || "Unable to fetch customer loans";
      })
      .addCase(updateLoanCallChecks.pending, (state) => {
        state.updateError = null;
      })
      .addCase(updateLoanCallChecks.fulfilled, (state, action) => {
        state.detail = action.payload;
        state.waitingLoans = state.waitingLoans.map((loan) =>
          loan._id === action.payload._id ? action.payload : loan
        );
      })
      .addCase(updateLoanCallChecks.rejected, (state, action) => {
        state.updateError = action.payload || "Unable to update call verification";
      })
      .addCase(disburseLoan.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(disburseLoan.fulfilled, (state, action) => {
        state.updating = false;
        state.approvedLoans = state.approvedLoans.filter((loan) => loan._id !== action.payload._id);
      })
      .addCase(disburseLoan.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload || "Unable to disburse loan";
      })
      .addCase(fetchLoansByCsoId.pending, (state) => {
        state.csoLoansLoading = true;
        state.csoLoansError = null;
      })
      .addCase(fetchLoansByCsoId.fulfilled, (state, action) => {
        state.csoLoansLoading = false;
        state.csoLoans = action.payload;
      })
      .addCase(fetchLoansByCsoId.rejected, (state, action) => {
        state.csoLoansLoading = false;
        state.csoLoansError = action.payload || "Unable to load CSO loans";
      })
      .addCase(fetchCsoLoanMetrics.pending, (state) => {
        state.csoMetricsLoading = true;
        state.csoMetricsError = null;
      })
      .addCase(fetchCsoLoanMetrics.fulfilled, (state, action) => {
        state.csoMetricsLoading = false;
        state.csoMetrics = action.payload.data;
        state.csoMetricsPagination = action.payload.pagination;
        state.csoMetricsMonth = action.payload.month;
        state.csoMetricsYear = action.payload.year;
      })
      .addCase(fetchCsoLoanMetrics.rejected, (state, action) => {
        state.csoMetricsLoading = false;
        state.csoMetricsError = action.payload || "Unable to load CSO loan metrics";
      })
      .addCase(fetchCsoWeeklyLoanCounts.pending, (state) => {
        state.csoWeeklyLoading = true;
        state.csoWeeklyError = null;
      })
      .addCase(fetchCsoWeeklyLoanCounts.fulfilled, (state, action) => {
        state.csoWeeklyLoading = false;
        state.csoWeeklyData = action.payload?.data || [];
        state.csoWeeklyWeeks = action.payload?.weeks || [];
        state.csoWeeklySummary = action.payload?.summary || {
          totalCsos: 0,
          totalLoans: 0,
          weekTotals: [],
        };
        state.csoWeeklyMonth = action.payload?.month || state.csoWeeklyMonth;
        state.csoWeeklyAvailableMonths = action.payload?.availableMonths || [];
        state.csoWeeklyGeneratedAt = action.payload?.generatedAt || null;
      })
      .addCase(fetchCsoWeeklyLoanCounts.rejected, (state, action) => {
        state.csoWeeklyLoading = false;
        state.csoWeeklyError = action.payload || "Unable to load CSO weekly loan counts";
      })
      .addCase(fetchCsoGeneralReport.pending, (state) => {
        state.csoGeneralLoading = true;
        state.csoGeneralError = null;
      })
      .addCase(fetchCsoGeneralReport.fulfilled, (state, action) => {
        state.csoGeneralLoading = false;
        state.csoGeneralData = action.payload?.data || [];
        state.csoGeneralSummary = action.payload?.summary || state.csoGeneralSummary;
        state.csoGeneralMonth = action.payload?.month || state.csoGeneralMonth;
        state.csoGeneralAvailableMonths = action.payload?.availableMonths || [];
        state.csoGeneralGeneratedAt = action.payload?.generatedAt || null;
      })
      .addCase(fetchCsoGeneralReport.rejected, (state, action) => {
        state.csoGeneralLoading = false;
        state.csoGeneralError = action.payload || "Unable to load CSO general report";
      })
      .addCase(fetchCustomerLoanWeekly.pending, (state) => {
        state.customerLoansLoading = true;
        state.customerLoansError = null;
      })
      .addCase(fetchCustomerLoanWeekly.fulfilled, (state, action) => {
        state.customerLoansLoading = false;
        state.customerLoans = action.payload.data;
        state.customerLoansPagination = action.payload.pagination;
        state.customerLoansWeek = action.payload.week;
      })
      .addCase(fetchCustomerLoanWeekly.rejected, (state, action) => {
        state.customerLoansLoading = false;
        state.customerLoansError = action.payload || "Unable to load customer loans";
      })
      .addCase(fetchOverdueLoans.pending, (state) => {
        state.overdueLoansLoading = true;
        state.overdueLoansError = null;
      })
      .addCase(fetchOverdueLoans.fulfilled, (state, action) => {
        state.overdueLoansLoading = false;
        state.overdueLoans = action.payload.data;
        state.overdueLoansPagination = action.payload.pagination;
      })
      .addCase(fetchOverdueLoans.rejected, (state, action) => {
        state.overdueLoansLoading = false;
        state.overdueLoansError = action.payload || "Unable to load overdue loans";
      })
      .addCase(fetchCustomerSummary.pending, (state) => {
        state.customerSummaryLoading = true;
        state.customerSummaryError = null;
      })
      .addCase(fetchCustomerSummary.fulfilled, (state, action) => {
        state.customerSummaryLoading = false;
        state.customerSummary = action.payload.customers;
        state.customerSummaryPagination = action.payload.pagination;
      })
      .addCase(fetchCustomerSummary.rejected, (state, action) => {
        state.customerSummaryLoading = false;
        state.customerSummaryError = action.payload || "Unable to load customer summary";
      })
      .addCase(fetchBusinessReportWeeklyMetrics.pending, (state) => {
        state.businessReportLoading = true;
        state.businessReportError = null;
      })
      .addCase(fetchBusinessReportWeeklyMetrics.fulfilled, (state, action) => {
        state.businessReportLoading = false;
        state.businessReportWeeks = action.payload?.weeks || [];
        state.businessReportMonth = action.payload?.month || state.businessReportMonth;
      })
      .addCase(fetchBusinessReportWeeklyMetrics.rejected, (state, action) => {
        state.businessReportLoading = false;
        state.businessReportError = action.payload || "Unable to load business weekly metrics";
      })
      .addCase(fetchBusinessReportLiquidity.pending, (state) => {
        state.businessLiquidityLoading = true;
        state.businessLiquidityError = null;
      })
      .addCase(fetchBusinessReportLiquidity.fulfilled, (state, action) => {
        state.businessLiquidityLoading = false;
        state.businessLiquidityWeeks = action.payload?.weeks || [];
        if (action.payload?.month) {
          state.businessReportMonth = action.payload.month;
        }
      })
      .addCase(fetchBusinessReportLiquidity.rejected, (state, action) => {
        state.businessLiquidityLoading = false;
        state.businessLiquidityError = action.payload || "Unable to load business liquidity metrics";
      })
      .addCase(fetchCustomerLoansByBvn.pending, (state) => {
        state.customerLoanHistoryLoading = true;
        state.customerLoanHistoryError = null;
        state.customerLoanHistory = [];
        state.customerLoanHistoryCustomer = null;
      })
      .addCase(fetchCustomerLoansByBvn.fulfilled, (state, action) => {
        state.customerLoanHistoryLoading = false;
        state.customerLoanHistory = action.payload.loans || [];
        state.customerLoanHistoryCustomer = {
          bvn: action.payload.bvn,
          name: action.payload.customerName || "",
        };
      })
      .addCase(fetchCustomerLoansByBvn.rejected, (state, action) => {
        state.customerLoanHistoryLoading = false;
        state.customerLoanHistoryError = action.payload || "Unable to load customer loans";
      })
      .addCase(fetchCustomerDetailsByBvn.pending, (state) => {
        state.customerDetailsLoading = true;
        state.customerDetailsError = null;
        state.customerDetailsRecord = null;
      })
      .addCase(fetchCustomerDetailsByBvn.fulfilled, (state, action) => {
        state.customerDetailsLoading = false;
        state.customerDetailsRecord = action.payload || null;
      })
      .addCase(fetchCustomerDetailsByBvn.rejected, (state, action) => {
        state.customerDetailsLoading = false;
        state.customerDetailsError = action.payload || "Unable to load customer details";
      })
      .addCase(fetchCsoCustomers.pending, (state) => {
        state.csoLoansLoading = true;
        state.csoLoansError = null;
      })
      .addCase(fetchCsoCustomers.fulfilled, (state, action) => {
        state.csoLoansLoading = false;
        state.csoLoans = action.payload?.customers || [];
        state.csoLoansCso = action.payload?.cso || null;
        state.csoLoansPagination =
          action.payload?.pagination || state.csoLoansPagination;
      })
      .addCase(fetchCsoCustomers.rejected, (state, action) => {
        state.csoLoansLoading = false;
        state.csoLoansError = action.payload || "Unable to load CSO customers";
      })
      .addCase(fetchCsoGroupLeaders.pending, (state) => {
        state.groupLeadersLoading = true;
        state.groupLeadersError = null;
      })
      .addCase(fetchCsoGroupLeaders.fulfilled, (state, action) => {
        state.groupLeadersLoading = false;
        state.groupLeaders = action.payload;
      })
      .addCase(fetchCsoGroupLeaders.rejected, (state, action) => {
        state.groupLeadersLoading = false;
        state.groupLeadersError = action.payload || "Unable to load group leaders";
      })
      .addCase(assignCustomersToGroup.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(assignCustomersToGroup.fulfilled, (state) => {
        state.updating = false;
      })
      .addCase(assignCustomersToGroup.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload || "Unable to assign customers to group";
      })
      .addCase(assignCustomersToCso.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(assignCustomersToCso.fulfilled, (state) => {
        state.updating = false;
      })
      .addCase(assignCustomersToCso.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload || "Unable to assign customers to CSO";
      })
      .addCase(fetchMonthlySummary.pending, (state) => {
        state.monthlySummaryLoading = true;
        state.monthlySummaryError = null;
      })
      .addCase(fetchMonthlySummary.fulfilled, (state, action) => {
        state.monthlySummaryLoading = false;
        state.monthlySummary = action.payload.monthSummary || [];
        state.monthlySummaryYear = action.payload.year;
      })
      .addCase(fetchMonthlySummary.rejected, (state, action) => {
        state.monthlySummaryLoading = false;
        state.monthlySummaryError = action.payload || "Unable to load monthly summary";
      })
      .addCase(fetchDashboardSummaryStats.pending, (state) => {
        state.dashboardSummaryLoading = true;
        state.dashboardSummaryError = null;
      })
      .addCase(fetchDashboardSummaryStats.fulfilled, (state, action) => {
        state.dashboardSummaryLoading = false;
        state.dashboardSummary = action.payload;
      })
      .addCase(fetchDashboardSummaryStats.rejected, (state, action) => {
        state.dashboardSummaryLoading = false;
        state.dashboardSummaryError = action.payload;
      })
      .addCase(fetchDashboardFinancialOverview.pending, (state) => {
        state.dashboardFinancialsLoading = true;
        state.dashboardFinancialsError = null;
      })
      .addCase(fetchDashboardFinancialOverview.fulfilled, (state, action) => {
        state.dashboardFinancialsLoading = false;
        state.dashboardFinancials = action.payload;
      })
      .addCase(fetchDashboardFinancialOverview.rejected, (state, action) => {
        state.dashboardFinancialsLoading = false;
        state.dashboardFinancialsError = action.payload;
      })
      .addCase(fetchDashboardTargetProgress.pending, (state) => {
        state.dashboardTargetLoading = true;
        state.dashboardTargetError = null;
      })
      .addCase(fetchDashboardTargetProgress.fulfilled, (state, action) => {
        state.dashboardTargetLoading = false;
        state.dashboardTarget = action.payload;
      })
      .addCase(fetchDashboardTargetProgress.rejected, (state, action) => {
        state.dashboardTargetLoading = false;
        state.dashboardTargetError = action.payload;
      })
      .addCase(fetchDashboardDisbursementTrends.pending, (state, action) => {
        state.dashboardTrendsLoading = true;
        state.dashboardTrendsError = null;
        if (action.meta?.arg?.year) {
          state.dashboardAnalyticsYear = action.meta.arg.year;
        }
      })
      .addCase(fetchDashboardDisbursementTrends.fulfilled, (state, action) => {
        state.dashboardTrendsLoading = false;
        state.dashboardTrends = action.payload;
      })
      .addCase(fetchDashboardDisbursementTrends.rejected, (state, action) => {
        state.dashboardTrendsLoading = false;
        state.dashboardTrendsError = action.payload;
      });
  },
});

export const { clearAdminLoanErrors, resetLoanDetail, setDashboardAnalyticsYear } =
  adminLoanSlice.actions;
export default adminLoanSlice.reducer;
