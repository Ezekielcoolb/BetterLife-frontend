import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// const API_BASE_URL =  "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

const extractErrorMessage = (error, fallbackMessage) => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

export const fetchAdminDisbursements = createAsyncThunk(
  "adminDailyTransactions/fetchDisbursements",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/transactions/disbursements`, {
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Unable to load disbursement transactions")
      );
    }
  }
);

export const fetchAdminCollections = createAsyncThunk(
  "adminDailyTransactions/fetchCollections",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/transactions/collections`, {
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Unable to load collection transactions")
      );
    }
  }
);

const buildDefaultPagination = () => ({
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 1,
});

const buildDefaultFilter = () => ({
  startDate: "",
  endDate: "",
  range: "month",
  search: "",
  csoId: "",
});

const initialState = {
  disbursement: {
    items: [],
    loading: false,
    error: null,
    pagination: buildDefaultPagination(),
    summary: {
      totalDisbursed: 0,
      totalAmountToBePaid: 0,
      totalAdminFees: 0,
    },
    filter: buildDefaultFilter(),
    lastQuery: null,
  },
  collection: {
    items: [],
    loading: false,
    error: null,
    pagination: buildDefaultPagination(),
    summary: {
      totalAmountPaid: 0,
    },
    filter: buildDefaultFilter(),
    lastQuery: null,
  },
};

const adminDailyTransactionSlice = createSlice({
  name: "adminDailyTransactions",
  initialState,
  reducers: {
    clearDisbursementError(state) {
      state.disbursement.error = null;
    },
    clearCollectionError(state) {
      state.collection.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDisbursements.pending, (state, action) => {
        state.disbursement.loading = true;
        state.disbursement.error = null;
        state.disbursement.lastQuery = action.meta?.arg || null;
      })
      .addCase(fetchAdminDisbursements.fulfilled, (state, action) => {
        state.disbursement.loading = false;
        state.disbursement.items = action.payload?.data || [];
        state.disbursement.pagination = {
          ...buildDefaultPagination(),
          ...(action.payload?.pagination || {}),
        };
        state.disbursement.summary = {
          totalDisbursed: Number(action.payload?.summary?.totalDisbursed || 0),
          totalAmountToBePaid: Number(
            action.payload?.summary?.totalAmountToBePaid || 0
          ),
          totalAdminFees: Number(action.payload?.summary?.totalAdminFees || 0),
        };
        state.disbursement.filter = {
          ...buildDefaultFilter(),
          ...(action.payload?.filter || {}),
        };
      })
      .addCase(fetchAdminDisbursements.rejected, (state, action) => {
        state.disbursement.loading = false;
        state.disbursement.error = action.payload || "Unable to load disbursement transactions";
      })
      .addCase(fetchAdminCollections.pending, (state, action) => {
        state.collection.loading = true;
        state.collection.error = null;
        state.collection.lastQuery = action.meta?.arg || null;
      })
      .addCase(fetchAdminCollections.fulfilled, (state, action) => {
        state.collection.loading = false;
        state.collection.items = action.payload?.data || [];
        state.collection.pagination = {
          ...buildDefaultPagination(),
          ...(action.payload?.pagination || {}),
        };
        state.collection.summary = {
          totalAmountPaid: Number(action.payload?.summary?.totalAmountPaid || 0),
        };
        state.collection.filter = {
          ...buildDefaultFilter(),
          ...(action.payload?.filter || {}),
        };
      })
      .addCase(fetchAdminCollections.rejected, (state, action) => {
        state.collection.loading = false;
        state.collection.error = action.payload || "Unable to load collection transactions";
      });
  },
});

export const { clearDisbursementError, clearCollectionError } =
  adminDailyTransactionSlice.actions;

export default adminDailyTransactionSlice.reducer;
