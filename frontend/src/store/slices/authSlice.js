import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { connectSocket, disconnectSocket } from "../../services/socket";

export const login = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/login", credentials);
    localStorage.setItem("token", data.token);
    connectSocket(data.token);
    return data;
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message || "Login failed";
    return rejectWithValue({ message, status, userNotFound: status === 404 });
  }
});

export const register = createAsyncThunk("auth/register", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/register", payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Registration failed");
  }
});

export const fetchMe = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/auth/me");
    const token = localStorage.getItem("token");
    if (token) connectSocket(token);
    return data;
  } catch (err) {
    localStorage.removeItem("token");
    return rejectWithValue(err.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    profile: null,
    token: localStorage.getItem("token"),
    authReady: false,
    loading: false,
    error: null,
  },
  reducers: {
    markAuthReady: (state) => {
      state.authReady = true;
    },
    logout: (state) => {
      state.user = null;
      state.profile = null;
      state.token = null;
      state.error = null;
      state.authReady = true;
      localStorage.removeItem("token");
      disconnectSocket();
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload.user;
        s.token = a.payload.token;
      })
      .addCase(login.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(register.fulfilled, (s) => {
        s.loading = false;
      })
      .addCase(fetchMe.fulfilled, (s, a) => {
        s.user = a.payload.user;
        s.profile = a.payload.profile;
        s.authReady = true;
      })
      .addCase(fetchMe.rejected, (s) => {
        s.user = null;
        s.token = null;
        s.authReady = true;
      });
  },
});

export const { logout, clearAuthError, markAuthReady } = authSlice.actions;
export default authSlice.reducer;
