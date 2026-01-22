import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

export const uploadImages = createAsyncThunk(
  "upload/uploadImages",
  async ({ files, folderName, target }, { rejectWithValue }) => {
    try {
      const uploadedUrls = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("csoToken");
        const response = await axios.post(`${API_BASE_URL}/api/fileupload/${folderName}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        uploadedUrls.push(response.data.data);
      }

      return { urls: uploadedUrls, target };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Upload failed");
    }
  }
);

const uploadSlice = createSlice({
  name: "upload",
  initialState: {
    urls: [],
    target: null,
    imageUploadLoading: false,
    error: null,
  },
  reducers: {
    resetUpload(state) {
      state.urls = [];
      state.target = null;
      state.imageUploadLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadImages.pending, (state) => {
        state.imageUploadLoading = true;
        state.error = null;
      })
      .addCase(uploadImages.fulfilled, (state, action) => {
        state.imageUploadLoading = false;
        state.urls = action.payload.urls;
        state.target = action.payload.target;
      })
      .addCase(uploadImages.rejected, (state, action) => {
        state.imageUploadLoading = false;
        state.error = action.payload || "Upload failed";
      });
  },
});

export const { resetUpload } = uploadSlice.actions;

export default uploadSlice.reducer;
