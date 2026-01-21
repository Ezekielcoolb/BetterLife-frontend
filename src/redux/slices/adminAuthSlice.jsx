import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import {
  clearAdminAuth,
  getStoredAdminAuth,
  saveAdminAuth,
} from "../../utils/adminAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const storedAuth = getStoredAdminAuth();

if (storedAuth.token) {
  axios.defaults.headers.common.Authorization = `Bearer ${storedAuth.token}`;
}

const initialState = {
  token: storedAuth.token,
  admin: storedAuth.admin,
  loading: false,
  fetchingProfile: false,
  error: null,
};

const extractErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export const loginAdmin = createAsyncThunk(
  "adminAuth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, {
        email,
        password,
      });

      const { token, admin } = response.data;
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      saveAdminAuth(token, admin);

      return { token, admin };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to sign in"));
    }
  }
);

export const registerAdmin = createAsyncThunk(
  "adminAuth/register",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/register`, {
        email,
        password,
      });

      const { token, admin } = response.data;
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      saveAdminAuth(token, admin);

      return { token, admin };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to sign up"));
    }
  }
);

export const fetchAdminProfile = createAsyncThunk(
  "adminAuth/fetchProfile",
  async (_, { rejectWithValue }) => {
    const stored = getStoredAdminAuth();
    const token = stored.token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/admin/me`);
      const admin = response.data;
      saveAdminAuth(token, admin);
      return { token, admin };
    } catch (error) {
      if (error.response?.status === 401) {
        clearAdminAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to load profile"));
    }
  }
);

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    clearAdminAuthError(state) {
      state.error = null;
    },
    logoutAdmin(state) {
      state.token = null;
      state.admin = null;
      state.loading = false;
      state.fetchingProfile = false;
      state.error = null;
      clearAdminAuth();
      delete axios.defaults.headers.common.Authorization;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.admin = action.payload.admin;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to sign in";
      })
      .addCase(registerAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.admin = action.payload.admin;
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to sign up";
      })
      .addCase(fetchAdminProfile.pending, (state) => {
        state.fetchingProfile = true;
        state.error = null;
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.fetchingProfile = false;
        state.token = action.payload.token;
        state.admin = action.payload.admin;
      })
      .addCase(fetchAdminProfile.rejected, (state, action) => {
        state.fetchingProfile = false;
        if (action.payload === "Unauthorized") {
          state.token = null;
          state.admin = null;
        }
        state.error =
          action.payload && action.payload !== "Unauthorized"
            ? action.payload
            : state.error;
      });
  },
});

export const { clearAdminAuthError, logoutAdmin } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
