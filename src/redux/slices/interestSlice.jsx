import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const extractError = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export const fetchInterest = createAsyncThunk("interest/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/interest`);
    return response.data;
  } catch (error) {
    return rejectWithValue(extractError(error, "Failed to load current interest"));
  }
});

export const saveInterest = createAsyncThunk(
  "interest/save",
  async ({ amount, description }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/interest`, {
        amount,
        description,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error, "Failed to update interest"));
    }
  }
);

const interestSlice = createSlice({
  name: "interest",
  initialState: {
    current: null,
    loading: false,
    saving: false,
    error: null,
    hasLoaded: false,
  },
  reducers: {
    clearInterestError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInterest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInterest.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
        state.hasLoaded = true;
      })
      .addCase(fetchInterest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hasLoaded = true;
      })
      .addCase(saveInterest.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveInterest.fulfilled, (state, action) => {
        state.saving = false;
        state.current = action.payload;
      })
      .addCase(saveInterest.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { clearInterestError } = interestSlice.actions;

export default interestSlice.reducer;
