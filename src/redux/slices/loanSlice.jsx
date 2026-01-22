import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { clearCsoAuth, getStoredCsoAuth } from "../../utils/csoAuth";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

const initialState = {
  loans: [],
  loansPagination: { page: 1, limit: 16, total: 0, totalPages: 1 },
  loading: false,
  submitting: false,
  error: null,
  detail: null,
  detailLoading: false,
  detailError: null,
  paymentSubmitting: false,
  paymentError: null,
  customerLoans: [],
  customerLoansLoading: false,
  customerLoansError: null,
  customerLoansBvn: null,
  scheduleSyncing: false,
  scheduleSyncError: null,
  collectionDate: null,
  collectionRecords: [],
  collectionSummary: {
    totalCustomers: 0,
    totalPaidToday: 0,
    totalDue: 0,
    defaultingCount: 0,
  },
  collectionLoading: false,
  collectionError: null,
  formCollectionRecords: [],
  formCollectionSummary: {
    totalCustomers: 0,
    totalLoanAppForm: 0,
  },
  formCollectionLoading: false,
  formCollectionError: null,
  outstandingLoans: [],
  totalOutstanding: 0,
  outstandingLoading: false,
  outstandingError: null,
  categoryCounts: {
    all: 0,
    active: 0,
    defaults: 0,
    overdue: 0,
    recovery: 0,
    paid: 0,
    pending: 0,
    rejected: 0,
  },
  categoryCountsLoading: false,
  categoryCountsError: null,
  currentCategoryTotalBalance: 0,
  dashboardStats: null,
  dashboardStatsLoading: false,
  dashboardStatsError: null,
};

const extractErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

export const fetchCsoLoans = createAsyncThunk(
  "loan/fetchCsoLoans",
  async (
    { page = 1, limit = 16, search = "", groupId = "", category = "all" } = {},
    { getState, rejectWithValue }
  ) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/loans/me`, {
        params: {
          page,
          limit,
          search: search || undefined,
          groupId: groupId || undefined,
          category: category !== "all" ? category : undefined,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to fetch loans"));
    }
  }
);

export const submitLoanEdit = createAsyncThunk(
  "loan/submitLoanEdit",
  async ({ loanId, data }, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.patch(`${API_BASE_URL}/api/loans/${loanId}/cso-edit`, data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to submit edited loan"));
    }
  }
);

export const syncLoanRepaymentSchedule = createAsyncThunk(
  "loan/syncRepaymentSchedule",
  async (loanId, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/loans/${loanId}/repayment/sync`);
      return { loanId, ...response.data };
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to synchronize repayment schedule"));
    }
  }
);

export const fetchCsoLoanCounts = createAsyncThunk(
  "loan/fetchCsoLoanCounts",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) return rejectWithValue("Unauthorized");

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/csos/loans/counts`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }
      return rejectWithValue(extractErrorMessage(error, "Unable to fetch loan counts"));
    }
  }
);

export const fetchLoansByCustomerBvn = createAsyncThunk(
  "loan/fetchLoansByCustomerBvn",
  async (bvn, { getState, rejectWithValue }) => {
    const trimmedBvn = typeof bvn === "string" ? bvn.trim() : "";

    if (!trimmedBvn) {
      return rejectWithValue("Customer BVN is required");
    }

    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/loans/customer/${trimmedBvn}`);
      return { bvn: trimmedBvn, loans: response.data };
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to fetch customer loans"));
    }
  }
);

export const recordLoanPayment = createAsyncThunk(
  "loan/recordPayment",
  async ({ loanId, amount, date }, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.post(`${API_BASE_URL}/api/loans/${loanId}/payments`, {
        amount,
        date,
      });
      return { loanId, ...response.data };
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to record payment"));
    }
  }
);

export const submitLoan = createAsyncThunk(
  "loan/submitLoan",
  async (loanData, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.post(`${API_BASE_URL}/api/loans`, loanData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to submit loan"));
    }
  }
);

export const fetchCsoLoanById = createAsyncThunk(
  "loan/fetchById",
  async (loanId, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/loans/${loanId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to load loan details"));
    }
  }
);

export const fetchCsoCollection = createAsyncThunk(
  "loan/fetchCsoCollection",
  async (date, { getState, rejectWithValue }) => {
    const targetDate = typeof date === "string" && date.trim().length > 0
      ? date.trim()
      : new Date().toISOString().slice(0, 10);

    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/csos/collection`, {
        params: { date: targetDate },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to fetch collection"));
    }
  }
);

export const fetchCsoFormCollection = createAsyncThunk(
  "loan/fetchCsoFormCollection",
  async (date, { getState, rejectWithValue }) => {
    const targetDate = typeof date === "string" && date.trim().length > 0
      ? date.trim()
      : new Date().toISOString().slice(0, 10);

    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/csos/form-collection`, {
        params: { date: targetDate },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to fetch form collection"));
    }
  }
);

export const fetchCsoOutstandingLoans = createAsyncThunk(
  "loan/fetchCsoOutstandingLoans",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/csos/loans/outstanding`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to fetch outstanding loans"));
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  "loan/fetchDashboardStats",
  async (timeframe = "today", { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) return rejectWithValue("Unauthorized");

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/csos/dashboard-stats`, {
        params: { timeframe },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }
      return rejectWithValue(extractErrorMessage(error, "Unable to fetch dashboard statistics"));
    }
  }
);

const loanSlice = createSlice({
  name: "loan",
  initialState,
  reducers: {
    clearLoanError(state) {
      state.error = null;
      state.detailError = null;
      state.paymentError = null;
      state.customerLoansError = null;
      state.scheduleSyncError = null;
      state.collectionError = null;
      state.formCollectionError = null;
      state.outstandingError = null;
    },
    resetLoanDetail(state) {
      state.detail = null;
      state.detailLoading = false;
      state.detailError = null;
    },
    resetCustomerLoans(state) {
      state.customerLoans = [];
      state.customerLoansLoading = false;
      state.customerLoansError = null;
      state.customerLoansBvn = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCsoLoans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCsoLoans.fulfilled, (state, action) => {
        state.loading = false;
        state.loans = action.payload?.loans || [];
        state.loansPagination =
          action.payload?.pagination || state.loansPagination;
        state.currentCategoryTotalBalance = action.payload?.totalRemainingBalance || 0;
      })
      .addCase(fetchCsoLoans.rejected, (state, action) => {
        state.loading = false;
        if (action.payload === "Unauthorized") {
          state.loans = [];
          state.loansPagination = { page: 1, limit: 16, total: 0, totalPages: 1 };
        }
        state.error = action.payload || "Unable to fetch loans";
      })
      .addCase(submitLoan.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitLoan.fulfilled, (state, action) => {
        state.submitting = false;
        state.loans = [action.payload, ...state.loans];
      })
      .addCase(submitLoan.rejected, (state, action) => {
        state.submitting = false;
        if (action.payload === "Unauthorized") {
          state.loans = [];
        }
        state.error = action.payload || "Unable to submit loan";
      })
      .addCase(submitLoanEdit.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitLoanEdit.fulfilled, (state, action) => {
        state.submitting = false;
        state.loans = state.loans.map((loan) =>
          loan._id === action.payload._id ? action.payload : loan
        );
      })
      .addCase(submitLoanEdit.rejected, (state, action) => {
        state.submitting = false;
        if (action.payload === "Unauthorized") {
          state.loans = [];
        }
        state.error = action.payload || "Unable to submit edited loan";
      })
      .addCase(fetchCsoLoanById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchCsoLoanById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchCsoLoanById.rejected, (state, action) => {
        state.detailLoading = false;
        if (action.payload === "Unauthorized") {
          state.detail = null;
        }
        state.detailError = action.payload || "Unable to load loan details";
      })
      .addCase(recordLoanPayment.pending, (state) => {
        state.paymentSubmitting = true;
        state.paymentError = null;
      })
      .addCase(recordLoanPayment.fulfilled, (state, action) => {
        state.paymentSubmitting = false;
        const { amountPaidSoFar, dailyPayment } = action.payload || {};

        if (state.detail) {
          state.detail = {
            ...state.detail,
            loanDetails: {
              ...state.detail.loanDetails,
              amountPaidSoFar,
              dailyPayment,
            },
          };
        }
      })
      .addCase(recordLoanPayment.rejected, (state, action) => {
        state.paymentSubmitting = false;
        if (action.payload === "Unauthorized") {
          state.detail = null;
        }
        state.paymentError = action.payload || "Unable to record payment";
      })
      .addCase(syncLoanRepaymentSchedule.pending, (state) => {
        state.scheduleSyncing = true;
        state.scheduleSyncError = null;
      })
      .addCase(syncLoanRepaymentSchedule.fulfilled, (state, action) => {
        state.scheduleSyncing = false;
        const { loanId, repaymentSchedule, amountPaidSoFar } = action.payload || {};

        if (!repaymentSchedule || !Array.isArray(repaymentSchedule)) {
          return;
        }

        if (state.detail && (state.detail._id === loanId || state.detail.loanId === loanId)) {
          state.detail = {
            ...state.detail,
            repaymentSchedule,
            loanDetails: {
              ...state.detail.loanDetails,
              amountPaidSoFar: amountPaidSoFar ?? state.detail.loanDetails?.amountPaidSoFar,
            },
          };
        }
      })
      .addCase(syncLoanRepaymentSchedule.rejected, (state, action) => {
        state.scheduleSyncing = false;
        if (action.payload === "Unauthorized") {
          state.detail = null;
        }
        state.scheduleSyncError = action.payload || "Unable to synchronize repayment schedule";
      })
      .addCase(fetchLoansByCustomerBvn.pending, (state) => {
        state.customerLoansLoading = true;
        state.customerLoansError = null;
      })
      .addCase(fetchLoansByCustomerBvn.fulfilled, (state, action) => {
        state.customerLoansLoading = false;
        state.customerLoans = action.payload.loans;
        state.customerLoansBvn = action.payload.bvn;
      })
      .addCase(fetchLoansByCustomerBvn.rejected, (state, action) => {
        state.customerLoansLoading = false;
        if (action.payload === "Unauthorized") {
          state.customerLoans = [];
          state.customerLoansBvn = null;
        }
        state.customerLoansError = action.payload || "Unable to fetch customer loans";
      })
      .addCase(fetchCsoCollection.pending, (state) => {
        state.collectionLoading = true;
        state.collectionError = null;
      })
      .addCase(fetchCsoCollection.fulfilled, (state, action) => {
        state.collectionLoading = false;
        state.collectionDate = action.payload?.date || null;
        state.collectionRecords = action.payload?.records || [];
        state.collectionSummary = action.payload?.summary || {
          totalCustomers: 0,
          totalPaidToday: 0,
          totalDue: 0,
          defaultingCount: 0,
        };
      })
      .addCase(fetchCsoCollection.rejected, (state, action) => {
        state.collectionLoading = false;
        if (action.payload === "Unauthorized") {
          state.collectionRecords = [];
          state.collectionSummary = {
            totalCustomers: 0,
            totalPaidToday: 0,
            totalDue: 0,
            defaultingCount: 0,
          };
          state.collectionDate = null;
        }
        state.collectionError = action.payload || "Unable to fetch collection";
      })
      .addCase(fetchCsoFormCollection.pending, (state) => {
        state.formCollectionLoading = true;
        state.formCollectionError = null;
      })
      .addCase(fetchCsoFormCollection.fulfilled, (state, action) => {
        state.formCollectionLoading = false;
        state.formCollectionRecords = action.payload?.records || [];
        state.formCollectionSummary = action.payload?.summary || {
          totalCustomers: 0,
          totalLoanAppForm: 0,
        };
      })
      .addCase(fetchCsoFormCollection.rejected, (state, action) => {
        state.formCollectionLoading = false;
        if (action.payload === "Unauthorized") {
          state.formCollectionRecords = [];
          state.formCollectionSummary = {
            totalCustomers: 0,
            totalLoanAppForm: 0,
          };
        }
        state.formCollectionError = action.payload || "Unable to fetch form collection";
      })
      .addCase(fetchCsoOutstandingLoans.pending, (state) => {
        state.outstandingLoading = true;
        state.outstandingError = null;
      })
      .addCase(fetchCsoOutstandingLoans.fulfilled, (state, action) => {
        state.outstandingLoading = false;
        state.outstandingLoans = action.payload?.loans || [];
        state.totalOutstanding = action.payload?.totalOutstanding || 0;
      })
      .addCase(fetchCsoOutstandingLoans.rejected, (state, action) => {
        state.outstandingLoading = false;
        if (action.payload === "Unauthorized") {
          state.outstandingLoans = [];
          state.totalOutstanding = 0;
        }
        state.outstandingError = action.payload || "Unable to fetch outstanding loans";
      })
      .addCase(fetchCsoLoanCounts.pending, (state) => {
        state.categoryCountsLoading = true;
        state.categoryCountsError = null;
      })
      .addCase(fetchCsoLoanCounts.fulfilled, (state, action) => {
        state.categoryCountsLoading = false;
        state.categoryCounts = action.payload || {
          all: 0,
          active: 0,
          defaults: 0,
          overdue: 0,
          recovery: 0,
          paid: 0,
          pending: 0,
          rejected: 0,
        };
      })
      .addCase(fetchCsoLoanCounts.rejected, (state, action) => {
        state.categoryCountsLoading = false;
        state.categoryCountsError = action.payload || "Unable to fetch loan counts";
      })
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboardStatsLoading = true;
        state.dashboardStatsError = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardStatsLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboardStatsLoading = false;
        state.dashboardStatsError = action.payload || "Unable to fetch dashboard statistics";
      });
  },
});

export const { clearLoanError, resetLoanDetail, resetCustomerLoans } = loanSlice.actions;
export default loanSlice.reducer;
