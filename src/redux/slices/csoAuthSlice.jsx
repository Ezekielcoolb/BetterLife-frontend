import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { clearCsoAuth, getStoredCsoAuth, saveCsoAuth } from "../../utils/csoAuth";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

const storedAuth = getStoredCsoAuth();

if (storedAuth.token) {
  axios.defaults.headers.common.Authorization = `Bearer ${storedAuth.token}`;
}

const initialState = {
  token: storedAuth.token,
  cso: storedAuth.cso,
  loading: false,
  profileLoading: false,
  savingProfile: false,
  savingSignature: false,
  savingPassword: false,
  resettingPassword: false,
  error: null,
};

const extractErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

export const loginCso = createAsyncThunk(
  "csoAuth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/csos/login`, { email, password });
      const { token, cso } = response.data;

      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      saveCsoAuth(token, cso);

      return { token, cso };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to login"));
    }
  }
);

export const resetCsoPassword = createAsyncThunk(
  "csoAuth/resetPassword",
  async ({ email, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/csos/forgot-password`, {
        email,
        newPassword,
      });

      return response.data?.message || "Password reset successfully";
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Unable to reset password"));
    }
  }
);

export const updateCsoPassword = createAsyncThunk(
  "csoAuth/updatePassword",
  async ({ currentPassword, newPassword, confirmPassword }, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.patch(`${API_BASE_URL}/api/csos/me/password`, {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      return response.data?.message || "Password updated successfully";
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to update password"));
    }
  }
);

export const updateCsoProfile = createAsyncThunk(
  "csoAuth/updateProfile",
  async (updates, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.patch(`${API_BASE_URL}/api/csos/me/profile`, updates);
      const cso = response.data;
      saveCsoAuth(token, cso);
      return cso;
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to update profile"));
    }
  }
);

export const updateCsoSignature = createAsyncThunk(
  "csoAuth/updateSignature",
  async ({ signature }, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.patch(`${API_BASE_URL}/api/csos/me/signature`, { signature });
      const cso = response.data;
      saveCsoAuth(token, cso);
      return cso;
    } catch (error) {
      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(extractErrorMessage(error, "Unable to update signature"));
    }
  }
);

export const fetchCsoProfile = createAsyncThunk(
  "csoAuth/fetchProfile",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.csoAuth?.token || getStoredCsoAuth().token;

    if (!token) {
      return rejectWithValue("Unauthorized");
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/csos/me`);
      const cso = response.data;
      saveCsoAuth(token, cso);
      return { cso };
    } catch (error) {
      const message = extractErrorMessage(error, "Unable to load CSO profile");

      if (error.response?.status === 401) {
        clearCsoAuth();
        delete axios.defaults.headers.common.Authorization;
        return rejectWithValue("Unauthorized");
      }

      return rejectWithValue(message);
    }
  }
);

const csoAuthSlice = createSlice({
  name: "csoAuth",
  initialState,
  reducers: {
    clearCsoAuthError(state) {
      state.error = null;
    },
    logoutCso(state) {
      state.token = null;
      state.cso = null;
      state.loading = false;
      state.profileLoading = false;
      state.error = null;
      clearCsoAuth();
      delete axios.defaults.headers.common.Authorization;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginCso.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginCso.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.cso = action.payload.cso;
      })
      .addCase(loginCso.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to login";
      })
      .addCase(resetCsoPassword.pending, (state) => {
        state.resettingPassword = true;
        state.error = null;
      })
      .addCase(resetCsoPassword.fulfilled, (state) => {
        state.resettingPassword = false;
      })
      .addCase(resetCsoPassword.rejected, (state, action) => {
        state.resettingPassword = false;
        state.error = action.payload || "Unable to reset password";
      })
      .addCase(fetchCsoProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchCsoProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.cso = action.payload.cso;
      })
      .addCase(fetchCsoProfile.rejected, (state, action) => {
        state.profileLoading = false;
        if (action.payload === "Unauthorized") {
          state.token = null;
          state.cso = null;
        }
        state.error = action.payload || "Unable to load CSO profile";
      })
      .addCase(updateCsoProfile.pending, (state) => {
        state.savingProfile = true;
        state.error = null;
      })
      .addCase(updateCsoProfile.fulfilled, (state, action) => {
        state.savingProfile = false;
        state.cso = action.payload;
      })
      .addCase(updateCsoProfile.rejected, (state, action) => {
        state.savingProfile = false;
        if (action.payload === "Unauthorized") {
          state.token = null;
          state.cso = null;
        }
        state.error = action.payload || "Unable to update profile";
      })
      .addCase(updateCsoSignature.pending, (state) => {
        state.savingSignature = true;
        state.error = null;
      })
      .addCase(updateCsoSignature.fulfilled, (state, action) => {
        state.savingSignature = false;
        state.cso = action.payload;
      })
      .addCase(updateCsoSignature.rejected, (state, action) => {
        state.savingSignature = false;
        if (action.payload === "Unauthorized") {
          state.token = null;
          state.cso = null;
        }
        state.error = action.payload || "Unable to update signature";
      })
      .addCase(updateCsoPassword.pending, (state) => {
        state.savingPassword = true;
        state.error = null;
      })
      .addCase(updateCsoPassword.fulfilled, (state) => {
        state.savingPassword = false;
      })
      .addCase(updateCsoPassword.rejected, (state, action) => {
        state.savingPassword = false;
        if (action.payload === "Unauthorized") {
          state.token = null;
          state.cso = null;
        }
        state.error = action.payload || "Unable to update password";
      });
  },
});

export const { clearCsoAuthError, logoutCso } = csoAuthSlice.actions;

export default csoAuthSlice.reducer;
