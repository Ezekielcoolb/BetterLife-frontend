import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

const extractErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export const fetchAdminMembers = createAsyncThunk(
  "adminPanel/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin-members`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to load admin members"));
    }
  }
);

export const createAdminMember = createAsyncThunk(
  "adminPanel/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin-members`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to create admin member"));
    }
  }
);

export const suspendAdminMember = createAsyncThunk(
  "adminPanel/suspend",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/admin-members/${id}/suspend`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to suspend admin member"));
    }
  }
);

export const activateAdminMember = createAsyncThunk(
  "adminPanel/activate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/admin-members/${id}/activate`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to activate admin member"));
    }
  }
);

export const deleteAdminMember = createAsyncThunk(
  "adminPanel/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/admin-members/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to delete admin member"));
    }
  }
);

const adminPanelSlice = createSlice({
  name: "adminPanel",
  initialState: {
    items: [],
    loading: false,
    creating: false,
    error: null,
    actionId: null,
  },
  reducers: {
    clearAdminPanelError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAdminMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAdminMember.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createAdminMember.fulfilled, (state, action) => {
        state.creating = false;
        state.items.unshift(action.payload);
      })
      .addCase(createAdminMember.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      .addCase(suspendAdminMember.pending, (state, action) => {
        state.actionId = action.meta.arg;
      })
      .addCase(suspendAdminMember.fulfilled, (state, action) => {
        state.actionId = null;
        state.items = state.items.map((member) =>
          member._id === action.payload._id ? action.payload : member
        );
      })
      .addCase(suspendAdminMember.rejected, (state, action) => {
        state.actionId = null;
        state.error = action.payload;
      })
      .addCase(activateAdminMember.pending, (state, action) => {
        state.actionId = action.meta.arg;
      })
      .addCase(activateAdminMember.fulfilled, (state, action) => {
        state.actionId = null;
        state.items = state.items.map((member) =>
          member._id === action.payload._id ? action.payload : member
        );
      })
      .addCase(activateAdminMember.rejected, (state, action) => {
        state.actionId = null;
        state.error = action.payload;
      })
      .addCase(deleteAdminMember.pending, (state, action) => {
        state.actionId = action.meta.arg;
      })
      .addCase(deleteAdminMember.fulfilled, (state, action) => {
        state.actionId = null;
        state.items = state.items.filter((member) => member._id !== action.payload);
      })
      .addCase(deleteAdminMember.rejected, (state, action) => {
        state.actionId = null;
        state.error = action.payload;
      });
  },
});

export const { clearAdminPanelError } = adminPanelSlice.actions;

export default adminPanelSlice.reducer;
