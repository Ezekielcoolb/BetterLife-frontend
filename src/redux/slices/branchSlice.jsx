import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const fetchBranches = createAsyncThunk("branch/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/branches`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to load branches");
  }
});

export const createBranch = createAsyncThunk("branch/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/branches`, payload);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create branch");
  }
});

export const deleteBranch = createAsyncThunk("branch/delete", async (branchId, { rejectWithValue }) => {
  try {
    await axios.delete(`${API_BASE_URL}/api/branches/${branchId}`);
    return branchId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete branch");
  }
});

export const updateBranchTargets = createAsyncThunk(
  "branch/updateTargets",
  async ({ scope = "single", branchId, loanTarget, disbursementTarget }, { rejectWithValue }) => {
    try {
      const targetId = scope === "all" ? "all" : branchId;
      const response = await axios.patch(`${API_BASE_URL}/api/branches/${targetId}/targets`, {
        loanTarget,
        disbursementTarget,
      });
      return { scope, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update targets");
    }
  }
);

const branchSlice = createSlice({
  name: "branch",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearBranchError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load branches";
      })
      .addCase(createBranch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createBranch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create branch";
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.items = state.items.filter((branch) => branch._id !== action.payload);
      })
      .addCase(deleteBranch.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete branch";
      })
      .addCase(updateBranchTargets.fulfilled, (state, action) => {
        const { scope, data } = action.payload;

        if (scope === "all" && Array.isArray(data)) {
          const updates = new Map(data.map((branch) => [branch._id, branch]));
          state.items = state.items.map((branch) => updates.get(branch._id) || branch);
          return;
        }

        if (scope === "single" && data?._id) {
          state.items = state.items.map((branch) =>
            branch._id === data._id ? data : branch
          );
        }
      })
      .addCase(updateBranchTargets.rejected, (state, action) => {
        state.error = action.payload || "Failed to update targets";
      });
  },
});

export const { clearBranchError } = branchSlice.actions;

export default branchSlice.reducer;
