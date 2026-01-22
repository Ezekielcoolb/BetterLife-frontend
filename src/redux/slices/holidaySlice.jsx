import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

export const fetchHolidays = createAsyncThunk("holiday/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/holidays`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Unable to load holidays");
  }
});

export const createHoliday = createAsyncThunk(
  "holiday/create",
  async ({ holiday, reason, isRecurring }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/holidays`, {
        holiday,
        reason,
        isRecurring,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Unable to create holiday");
    }
  }
);

export const deleteHoliday = createAsyncThunk("holiday/delete", async (holidayId, { rejectWithValue }) => {
  try {
    await axios.delete(`${API_BASE_URL}/api/holidays/${holidayId}`);
    return holidayId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Unable to delete holiday");
  }
});

const holidaySlice = createSlice({
  name: "holiday",
  initialState: {
    items: [],
    loading: false,
    error: null,
    creating: false,
    deletingId: null,
  },
  reducers: {
    clearHolidayError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load holidays";
      })
      .addCase(createHoliday.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createHoliday.fulfilled, (state, action) => {
        state.creating = false;
        state.items.push(action.payload);
      })
      .addCase(createHoliday.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "Unable to create holiday";
      })
      .addCase(deleteHoliday.pending, (state, action) => {
        state.deletingId = action.meta.arg;
      })
      .addCase(deleteHoliday.fulfilled, (state, action) => {
        state.deletingId = null;
        state.items = state.items.filter((holiday) => holiday._id !== action.payload);
      })
      .addCase(deleteHoliday.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload || "Unable to delete holiday";
      });
  },
});

export const { clearHolidayError } = holidaySlice.actions;

export default holidaySlice.reducer;
