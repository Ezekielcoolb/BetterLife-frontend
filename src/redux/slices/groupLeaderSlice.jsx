import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL =  "https://api.betterlifeloan.com";

// Async thunks
export const fetchGroupLeaders = createAsyncThunk(
  "groupLeader/fetchGroupLeaders",
  async (csoId = null, { rejectWithValue }) => {
    try {
      const url = csoId 
        ? `${API_BASE_URL}/api/group-leaders?csoId=${csoId}`
        : `${API_BASE_URL}/api/group-leaders`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch group leaders');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to fetch group leaders');
    }
  }
);

export const createGroupLeader = createAsyncThunk(
  "groupLeader/createGroupLeader",
  async (groupLeaderData, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.csoAuth.token;
      
      const response = await fetch(`${API_BASE_URL}/api/group-leaders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(groupLeaderData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create group leader');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to create group leader');
    }
  }
);

export const fetchMyApprovedGroupLeaders = createAsyncThunk(
  "groupLeader/fetchMyApprovedGroupLeaders",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.csoAuth.token;
      console.log('Token for group leaders:', token);
      
      const response = await fetch(`${API_BASE_URL}/api/group-leaders/my-approved`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.log('Error response:', error);
        throw new Error(error.message || 'Failed to fetch approved group leaders');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('Fetch error:', error);
      return rejectWithValue(error.message || 'Unable to fetch approved group leaders');
    }
  }
);

export const approveGroupLeader = createAsyncThunk(
  "groupLeader/approveGroupLeader",
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/group-leaders/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve group leader');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to approve group leader');
    }
  }
);

export const updateGroupLeader = createAsyncThunk(
  "groupLeader/updateGroupLeader",
  async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/group-leaders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update group leader');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to update group leader');
    }
  }
);

export const deleteGroupLeader = createAsyncThunk(
  "groupLeader/deleteGroupLeader",
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/group-leaders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete group leader');
      }
      
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to delete group leader');
    }
  }
);

export const transferGroupToCso = createAsyncThunk(
  "groupLeader/transferGroupToCso",
  async ({ groupLeaderId, newCsoId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/group-leaders/${groupLeaderId}/transfer-cso`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newCsoId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to transfer group');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to transfer group');
    }
  }
);

// Slice
const groupLeaderSlice = createSlice({
  name: "groupLeader",
  initialState: {
    items: [],
    loading: false,
    updatingId: null,
    deletingId: null,
    transferringId: null,
    error: null,
  },
  reducers: {
    clearGroupLeaderError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch group leaders
      .addCase(fetchGroupLeaders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupLeaders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchGroupLeaders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Approve group leader
      .addCase(approveGroupLeader.pending, (state, action) => {
        state.updatingId = action.meta.arg;
        state.error = null;
      })
      .addCase(approveGroupLeader.fulfilled, (state, action) => {
        state.updatingId = null;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(approveGroupLeader.rejected, (state, action) => {
        state.updatingId = null;
        state.error = action.payload;
      })
      
      // Update group leader
      .addCase(updateGroupLeader.pending, (state, action) => {
        state.updatingId = action.meta.arg.id;
        state.error = null;
      })
      .addCase(updateGroupLeader.fulfilled, (state, action) => {
        state.updatingId = null;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateGroupLeader.rejected, (state, action) => {
        state.updatingId = null;
        state.error = action.payload;
      })
      
      // Delete group leader
      .addCase(deleteGroupLeader.pending, (state, action) => {
        state.deletingId = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteGroupLeader.fulfilled, (state, action) => {
        state.deletingId = null;
        state.items = state.items.filter(item => item._id !== action.payload);
      })
      .addCase(deleteGroupLeader.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload;
      })
      
      // Create group leader
      .addCase(createGroupLeader.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroupLeader.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createGroupLeader.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch my approved group leaders
      .addCase(fetchMyApprovedGroupLeaders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyApprovedGroupLeaders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyApprovedGroupLeaders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Transfer group to CSO
      .addCase(transferGroupToCso.pending, (state, action) => {
        state.transferringId = action.meta.arg.groupLeaderId;
        state.error = null;
      })
      .addCase(transferGroupToCso.fulfilled, (state, action) => {
        state.transferringId = null;
        const index = state.items.findIndex(item => item._id === action.payload.groupLeader._id);
        if (index !== -1) {
          state.items[index] = action.payload.groupLeader;
        }
      })
      .addCase(transferGroupToCso.rejected, (state, action) => {
        state.transferringId = null;
        state.error = action.payload;
      });
  },
});

export const { clearGroupLeaderError } = groupLeaderSlice.actions;
export default groupLeaderSlice.reducer;
