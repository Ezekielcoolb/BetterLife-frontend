import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { getStoredCsoAuth } from "../../utils/csoAuth";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

const extractErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

export const fetchCsos = createAsyncThunk("cso/fetchAll", async ({ page = 1, limit = 20, branchId = "" } = {}, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/csos`, {
      params: { page, limit, branchId },
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error, "Failed to load CSOs"));
  }
});

export const createCso = createAsyncThunk("cso/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/csos`, payload);
    return response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error, "Failed to create CSO"));
  }
});

export const fetchCsoById = createAsyncThunk("cso/fetchById", async (id, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/csos/${id}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error, "Failed to load CSO details"));
  }
});

export const updateCso = createAsyncThunk(
  "cso/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/csos/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to update CSO"));
    }
  }
);

export const changeCsoStatus = createAsyncThunk(
  "cso/changeStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/csos/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to update CSO status"));
    }
  }
);

export const transferCsoBranch = createAsyncThunk(
  "cso/transferBranch",
  async ({ id, branch, branchId }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/csos/${id}/transfer-branch`, { branch, branchId });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to transfer CSO branch"));
    }
  }
);

export const fetchCsoProfile = createAsyncThunk("cso/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const { token } = getStoredCsoAuth();
    const response = await axios.get(`${API_BASE_URL}/api/csos/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error, "Failed to load CSO profile"));
  }
});

export const postCsoRemittance = createAsyncThunk(
  "cso/postRemittance",
  async (payload, { rejectWithValue }) => {
    try {
      const { token } = getStoredCsoAuth();
      const response = await axios.post(`${API_BASE_URL}/api/csos/remittance`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to post remittance"));
    }
  }
);

export const resolveCsoRemittance = createAsyncThunk(
  "cso/resolveRemittance",
  async ({ id, date, resolvedIssue }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/csos/${id}/resolve-remittance`, {
        date,
        resolvedIssue,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to resolve remittance"));
    }
  }
);

export const fetchAdminCsoCollection = createAsyncThunk(
  "cso/fetchAdminCollection",
  async ({ csoId, date }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/csos/${csoId}/collection`,
        {
          params: { date },
        }
      );

      return {
        date: response.data?.date || date || null,
        summary: response.data?.summary || {},
        records: Array.isArray(response.data?.records)
          ? response.data.records
          : [],
      };
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Failed to load CSO collection")
      );
    }
  }
);

export const fetchAdminCsoFormCollection = createAsyncThunk(
  "cso/fetchAdminFormCollection",
  async ({ csoId, date }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/csos/${csoId}/form-collection`,
        {
          params: { date },
        }
      );

      return {
        date: response.data?.date || date || null,
        summary: response.data?.summary || {},
        records: Array.isArray(response.data?.records)
          ? response.data.records
          : [],
      };
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Failed to load CSO form collection")
      );
    }
  }
);

export const fetchAdminCsoDashboardStats = createAsyncThunk(
  "cso/fetchAdminDashboardStats",
  async ({ csoId, timeframe = "today" }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/csos/${csoId}/dashboard-stats`,
        {
          params: { timeframe },
        }
      );

      return {
        timeframe,
        data: response.data,
      };
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Failed to load CSO dashboard")
      );
    }
  }
);

export const fetchAdminCsoOutstandingLoans = createAsyncThunk(
  "cso/fetchAdminOutstandingLoans",
  async (csoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/csos/${csoId}/outstanding-loans`
      );

      return {
        loans: Array.isArray(response.data?.loans)
          ? response.data.loans
          : [],
        total: Number(response.data?.totalOutstanding || 0),
      };
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Failed to load CSO outstanding loans")
      );
    }
  }
);

export const updateDefaultingTarget = createAsyncThunk(
  "cso/updateDefaultingTarget",
  async ({ scope = "single", csoId, defaultingTarget }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/csos/defaulting-target`, {
        scope,
        csoId,
        defaultingTarget,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to update defaulting target"));
    }
  }
);

const csoSlice = createSlice({
  name: "cso",
  initialState: {
    items: [],
    selected: null,
    profile: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
    listLoading: false,
    detailLoading: false,
    profileLoading: false,
    remittanceLoading: false,
    resolvingRemittance: false,
    saving: false,
    error: null,
    remittanceSuccess: false,
    collection: {
      date: null,
      records: [],
      summary: {
        totalCustomers: 0,
        totalPaidToday: 0,
        totalDue: 0,
        defaultingCount: 0,
      },
      loading: false,
      error: null,
    },
    formCollection: {
      date: null,
      records: [],
      summary: {
        totalCustomers: 0,
        totalLoanAppForm: 0,
      },
      loading: false,
      error: null,
    },
    adminDashboard: {
      timeframe: "today",
      loading: false,
      error: null,
      data: null,
    },
    adminOutstanding: {
      loading: false,
      error: null,
      loans: [],
      totalOutstanding: 0,
    },
  },
  reducers: {
    clearCsoError(state) {
      state.error = null;
    },
    resetRemittanceSuccess(state) {
      state.remittanceSuccess = false;
    },
    clearCsoCollectionError(state) {
      state.collection.error = null;
      state.formCollection.error = null;
    },
    clearCsoDashboardError(state) {
      state.adminDashboard.error = null;
      state.adminOutstanding.error = null;
    },
    setAdminDashboardTimeframe(state, action) {
      state.adminDashboard.timeframe = action.payload || "today";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCsos.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchCsos.fulfilled, (state, action) => {
        state.listLoading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCsos.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload || "Failed to load CSOs";
      })
      .addCase(createCso.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCso.fulfilled, (state, action) => {
        state.saving = false;
        state.items.unshift(action.payload);
      })
      .addCase(createCso.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to create CSO";
      })
      .addCase(fetchCsoById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchCsoById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchCsoById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || "Failed to load CSO details";
      })
      .addCase(updateCso.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateCso.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.map((cso) => (cso._id === action.payload._id ? action.payload : cso));
        state.selected = action.payload;
      })
      .addCase(updateCso.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update CSO";
      })
      .addCase(changeCsoStatus.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(changeCsoStatus.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.map((cso) => (cso._id === action.payload._id ? action.payload : cso));
        if (state.selected?._id === action.payload._id) {
          state.selected = action.payload;
        }
      })
      .addCase(changeCsoStatus.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update CSO status";
      })
      .addCase(transferCsoBranch.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(transferCsoBranch.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.map((cso) => (cso._id === action.payload.cso._id ? action.payload.cso : cso));
        if (state.selected?._id === action.payload.cso._id) {
          state.selected = action.payload.cso;
        }
      })
      .addCase(transferCsoBranch.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to transfer CSO branch";
      })
      .addCase(fetchCsoProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchCsoProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchCsoProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload || "Failed to load profile";
      })
      .addCase(postCsoRemittance.pending, (state) => {
        state.remittanceLoading = true;
        state.error = null;
        state.remittanceSuccess = false;
      })
      .addCase(postCsoRemittance.fulfilled, (state, action) => {
        state.remittanceLoading = false;
        state.remittanceSuccess = true;
        // Update profile remittance list locally
        if (state.profile) {
            // We can either refetch or update manually. 
            // The API returns { message, remittance: [] }
            // Let's update the profile's remittance array
            state.profile.remittance = action.payload.remittance;
        }
      })
      .addCase(postCsoRemittance.rejected, (state, action) => {
        state.remittanceLoading = false;
        state.error = action.payload || "Failed to post remittance";
      })
      .addCase(resolveCsoRemittance.pending, (state) => {
        state.resolvingRemittance = true;
        state.error = null;
      })
      .addCase(resolveCsoRemittance.fulfilled, (state, action) => {
        state.resolvingRemittance = false;
        if (state.selected && action.payload?.remittance) {
          state.selected = {
            ...state.selected,
            remittance: action.payload.remittance,
          };
        }
      })
      .addCase(resolveCsoRemittance.rejected, (state, action) => {
        state.resolvingRemittance = false;
        state.error = action.payload || "Failed to resolve remittance";
      })
      .addCase(updateDefaultingTarget.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateDefaultingTarget.fulfilled, (state, action) => {
        state.saving = false;
        const { scope, data } = action.payload || {};

        if (scope === "all" && data?.defaultingTarget !== undefined) {
          state.items = state.items.map((cso) => ({
            ...cso,
            defaultingTarget: data.defaultingTarget,
          }));

          if (state.selected) {
            state.selected = {
              ...state.selected,
              defaultingTarget: data.defaultingTarget,
            };
          }
          return;
        }

        if (scope === "single" && data?._id) {
          state.items = state.items.map((cso) => (cso._id === data._id ? data : cso));

          if (state.selected?._id === data._id) {
            state.selected = data;
          }
        }
      })
      .addCase(updateDefaultingTarget.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update defaulting target";
      })
      .addCase(fetchAdminCsoCollection.pending, (state) => {
        state.collection.loading = true;
        state.collection.error = null;
      })
      .addCase(fetchAdminCsoCollection.fulfilled, (state, action) => {
        const defaultSummary = {
          totalCustomers: 0,
          totalPaidToday: 0,
          totalDue: 0,
          defaultingCount: 0,
        };
        state.collection.loading = false;
        state.collection.date = action.payload?.date || null;
        state.collection.records = action.payload?.records || [];
        state.collection.summary = {
          ...defaultSummary,
          ...(action.payload?.summary || {}),
        };
      })
      .addCase(fetchAdminCsoCollection.rejected, (state, action) => {
        state.collection.loading = false;
        state.collection.error = action.payload || "Failed to load CSO collection";
      })
      .addCase(fetchAdminCsoFormCollection.pending, (state) => {
        state.formCollection.loading = true;
        state.formCollection.error = null;
      })
      .addCase(fetchAdminCsoFormCollection.fulfilled, (state, action) => {
        const defaultSummary = {
          totalCustomers: 0,
          totalLoanAppForm: 0,
        };
        state.formCollection.loading = false;
        state.formCollection.date = action.payload?.date || null;
        state.formCollection.records = action.payload?.records || [];
        state.formCollection.summary = {
          ...defaultSummary,
          ...(action.payload?.summary || {}),
        };
      })
      .addCase(fetchAdminCsoFormCollection.rejected, (state, action) => {
        state.formCollection.loading = false;
        state.formCollection.error =
          action.payload || "Failed to load CSO form collection";
      })
      .addCase(fetchAdminCsoDashboardStats.pending, (state, action) => {
        state.adminDashboard.loading = true;
        state.adminDashboard.error = null;
        if (action.meta?.arg?.timeframe) {
          state.adminDashboard.timeframe = action.meta.arg.timeframe;
        }
      })
      .addCase(fetchAdminCsoDashboardStats.fulfilled, (state, action) => {
        state.adminDashboard.loading = false;
        state.adminDashboard.data = action.payload?.data || null;
        state.adminDashboard.timeframe =
          action.payload?.timeframe || state.adminDashboard.timeframe;
      })
      .addCase(fetchAdminCsoDashboardStats.rejected, (state, action) => {
        state.adminDashboard.loading = false;
        state.adminDashboard.error =
          action.payload || "Failed to load CSO dashboard";
      })
      .addCase(fetchAdminCsoOutstandingLoans.pending, (state) => {
        state.adminOutstanding.loading = true;
        state.adminOutstanding.error = null;
      })
      .addCase(fetchAdminCsoOutstandingLoans.fulfilled, (state, action) => {
        state.adminOutstanding.loading = false;
        state.adminOutstanding.loans = action.payload?.loans || [];
        state.adminOutstanding.totalOutstanding = action.payload?.total || 0;
      })
      .addCase(fetchAdminCsoOutstandingLoans.rejected, (state, action) => {
        state.adminOutstanding.loading = false;
        state.adminOutstanding.error =
          action.payload || "Failed to load CSO outstanding loans";
      });
  },
});

export const {
  clearCsoError,
  resetRemittanceSuccess,
  clearCsoCollectionError,
  clearCsoDashboardError,
  setAdminDashboardTimeframe,
} = csoSlice.actions;

export default csoSlice.reducer;
