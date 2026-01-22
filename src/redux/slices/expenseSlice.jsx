import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

const extractError = (error, fallback = "Request failed") =>
  error.response?.data?.message || error.message || fallback;

export const fetchExpenseEntries = createAsyncThunk(
  "expenses/fetchEntries",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/expenses`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error, "Unable to load expenses"));
    }
  }
);

export const fetchExpensesByDate = createAsyncThunk(
  "expenses/fetchByDate",
  async (date, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/expenses`, {
        params: { date },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error, "Unable to load expense details"));
    }
  }
);

export const createExpense = createAsyncThunk(
  "expenses/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/expenses`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error, "Unable to record expense"));
    }
  }
);

export const moveExpense = createAsyncThunk(
  "expenses/move",
  async ({ expenseId, targetDate }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/expenses/${expenseId}/move`, {
        targetDate,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error, "Unable to move expense"));
    }
  }
);

const initialState = {
  entries: [],
  totalAmount: 0,
  entriesLoading: false,
  daily: {
    date: "",
    items: [],
    totalAmount: 0,
  },
  dailyLoading: false,
  creating: false,
  movingId: null,
  error: null,
};

const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    clearExpenseError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenseEntries.pending, (state) => {
        state.entriesLoading = true;
        state.error = null;
      })
      .addCase(fetchExpenseEntries.fulfilled, (state, action) => {
        state.entriesLoading = false;
        state.entries = action.payload.entries || [];
        state.totalAmount = action.payload.totalAmount || 0;
      })
      .addCase(fetchExpenseEntries.rejected, (state, action) => {
        state.entriesLoading = false;
        state.error = action.payload || "Unable to load expenses";
      })
      .addCase(fetchExpensesByDate.pending, (state) => {
        state.dailyLoading = true;
        state.error = null;
      })
      .addCase(fetchExpensesByDate.fulfilled, (state, action) => {
        state.dailyLoading = false;
        state.daily = {
          date: action.payload.date || "",
          items: action.payload.items || [],
          totalAmount: action.payload.totalAmount || 0,
        };
      })
      .addCase(fetchExpensesByDate.rejected, (state, action) => {
        state.dailyLoading = false;
        state.error = action.payload || "Unable to load expense details";
      })
      .addCase(createExpense.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "Unable to record expense";
      })
      .addCase(moveExpense.pending, (state, action) => {
        state.movingId = action.meta.arg?.expenseId || null;
        state.error = null;
      })
      .addCase(moveExpense.fulfilled, (state) => {
        state.movingId = null;
      })
      .addCase(moveExpense.rejected, (state, action) => {
        state.movingId = null;
        state.error = action.payload || "Unable to move expense";
      });
  },
});

export const { clearExpenseError } = expenseSlice.actions;

export default expenseSlice.reducer;
