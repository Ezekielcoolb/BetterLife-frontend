import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const extractErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

const computeSummary = (entries = []) => {
  const summary = {
    totalRemittances: entries.length,
    unresolvedIssues: 0,
    resolvedCount: 0,
    balancedCount: 0,
  };

  entries.forEach((entry) => {
    if (entry?.status === "issue" || entry?.hasIssue) {
      summary.unresolvedIssues += 1;
      return;
    }

    if (entry?.status === "resolved") {
      summary.resolvedCount += 1;
      return;
    }

    summary.balancedCount += 1;
  });

  return summary;
};

export const fetchAdminRemittances = createAsyncThunk(
  "adminRemittance/fetchList",
  async (
    {
      year,
      month,
      range,
      date,
      from,
      to,
      page = 1,
      limit = 20,
      csoId,
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = { page, limit };

      if (year) {
        params.year = year;
      }

      if (month) {
        params.month = month;
      }

      if (month) {
        params.month = month;
      }

      if (range) {
        params.range = range;
      }

      if (date) {
        params.date = date;
      }

      if (from) {
        params.from = from;
      }

      if (to) {
        params.to = to;
      }

      if (csoId) {
        params.csoId = csoId;
      }

      const response = await axios.get(`${API_BASE_URL}/api/admin/remittances`, {
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Unable to load remittances")
      );
    }
  }
);

export const updateAdminRemittance = createAsyncThunk(
  "adminRemittance/update",
  async ({ remittanceId, data }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/admin/remittances/${remittanceId}`,
        data
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Unable to update remittance")
      );
    }
  }
);

const initialState = {
  items: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    year: null,
    month: null,
    summary: {
      totalRemittances: 0,
      unresolvedIssues: 0,
      resolvedCount: 0,
      balancedCount: 0,
    },
    range: "month",
    filter: {
      startDate: null,
      endDate: null,
      csoId: "",
    },
    updatedAt: null,
  },
  loading: false,
  error: null,
  updatingById: {},
  updateError: null,
  lastQuery: {
    year: null,
    month: null,
    range: "month",
    date: null,
    from: null,
    to: null,
    page: 1,
    limit: 20,
    csoId: "",
  },
};

const adminRemittanceSlice = createSlice({
  name: "adminRemittance",
  initialState,
  reducers: {
    clearAdminRemittanceError(state) {
      state.error = null;
      state.updateError = null;
    },
    setAdminRemittanceQuery(state, action) {
      state.lastQuery = {
        ...state.lastQuery,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminRemittances.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        const {
          year = null,
          month = null,
          range = state.lastQuery.range,
          date = null,
          from = null,
          to = null,
          page = 1,
          limit = 20,
          csoId = "",
        } =
          action.meta.arg || {};
        state.lastQuery = {
          year,
          month,
          range,
          date,
          from,
          to,
          page,
          limit,
          csoId,
        };
      })
      .addCase(fetchAdminRemittances.fulfilled, (state, action) => {
        state.loading = false;
        const { data = [], meta = {} } = action.payload || {};
        state.items = Array.isArray(data) ? data : [];
        state.meta = {
          page: meta.page ?? 1,
          limit: meta.limit ?? state.lastQuery.limit ?? 20,
          total: meta.total ?? state.items.length,
          totalPages: meta.totalPages ?? 1,
          year: meta.year ?? state.lastQuery.year,
          month: meta.month ?? state.lastQuery.month,
          range: meta.range ?? state.lastQuery.range,
          filter: {
            startDate: meta.filter?.startDate ?? state.meta.filter.startDate,
            endDate: meta.filter?.endDate ?? state.meta.filter.endDate,
            csoId: meta.filter?.csoId ?? state.meta.filter.csoId,
          },
          summary:
            meta.summary ??
            computeSummary(Array.isArray(data) ? data : state.items ?? []),
          updatedAt: meta.updatedAt ?? new Date().toISOString(),
        };
      })
      .addCase(fetchAdminRemittances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load remittances";
      })
      .addCase(updateAdminRemittance.pending, (state, action) => {
        const { remittanceId } = action.meta.arg || {};
        if (remittanceId) {
          state.updatingById[remittanceId] = true;
        }
        state.updateError = null;
      })
      .addCase(updateAdminRemittance.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        const { remittanceId } = action.meta.arg || {};
        if (remittanceId) {
          delete state.updatingById[remittanceId];
        }
        if (updated && updated.id) {
          state.items = state.items.map((item) =>
            item.id === updated.id ? { ...item, ...updated } : item
          );
        }
        state.meta.summary = computeSummary(state.items);
      })
      .addCase(updateAdminRemittance.rejected, (state, action) => {
        const { remittanceId } = action.meta.arg || {};
        if (remittanceId) {
          delete state.updatingById[remittanceId];
        }
        state.updateError = action.payload || "Unable to update remittance";
      });
  },
});

export const { clearAdminRemittanceError } = adminRemittanceSlice.actions;
export const { setAdminRemittanceQuery } = adminRemittanceSlice.actions;

export default adminRemittanceSlice.reducer;
