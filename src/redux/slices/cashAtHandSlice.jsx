import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

const extractError = (error, fallback = "Request failed") =>
  error.response?.data?.message || error.message || fallback;

export const fetchCashEntries = createAsyncThunk(
  "cashAtHand/fetchEntries",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cash-at-hand`);
      return response.data?.entries || [];
    } catch (error) {
      return rejectWithValue(extractError(error, "Unable to load cash at hand"));
    }
  }
);

export const fetchCashByDate = createAsyncThunk(
  "cashAtHand/fetchByDate",
  async (date, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cash-at-hand`, {
        params: { date },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error, "Unable to load selected date"));
    }
  }
);

export const updateCashAtHand = createAsyncThunk(
  "cashAtHand/update",
  async ({ amount, date }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/cash-at-hand`, { amount, date });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error, "Unable to update cash at hand"));
    }
  }
);

const cashAtHandSlice = createSlice({
  name: "cashAtHand",
  initialState: {
    entries: [],
    entriesLoading: false,
    selected: {
      date: "",
      amount: 0,
      updatedAt: null,
    },
    selectedLoading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearCashError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCashEntries.pending, (state) => {
        state.entriesLoading = true;
        state.error = null;
      })
      .addCase(fetchCashEntries.fulfilled, (state, action) => {
        state.entriesLoading = false;
        state.entries = action.payload || [];
      })
      .addCase(fetchCashEntries.rejected, (state, action) => {
        state.entriesLoading = false;
        state.error = action.payload || "Unable to load cash at hand";
      })
      .addCase(fetchCashByDate.pending, (state) => {
        state.selectedLoading = true;
        state.error = null;
      })
      .addCase(fetchCashByDate.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = {
          date: action.payload?.date || "",
          amount: action.payload?.amount || 0,
          updatedAt: action.payload?.updatedAt || null,
        };
      })
      .addCase(fetchCashByDate.rejected, (state, action) => {
        state.selectedLoading = false;
        state.error = action.payload || "Unable to load selected date";
      })
      .addCase(updateCashAtHand.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateCashAtHand.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateCashAtHand.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Unable to update cash at hand";
      });
  },
});

export const { clearCashError } = cashAtHandSlice.actions;

export default cashAtHandSlice.reducer;
