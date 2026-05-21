import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchAppointments = createAsyncThunk("appointments/list", async () => {
  const { data } = await api.get("/appointments");
  return data.appointments;
});

export const bookAppointment = createAsyncThunk(
  "appointments/book",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/appointments", payload);
      return { ...data.appointment, confirmationMessage: data.confirmationMessage };
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const lockSlot = createAsyncThunk("appointments/lock", async (payload) => {
  const { data } = await api.post("/appointments/lock", payload);
  return data.lock;
});

const appointmentSlice = createSlice({
  name: "appointments",
  initialState: { list: [], loading: false, bookingError: null, suggestions: [] },
  reducers: {
    setSuggestions: (s, a) => { s.suggestions = a.payload; },
    clearBookingError: (s) => { s.bookingError = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.fulfilled, (s, a) => { s.list = a.payload; })
      .addCase(bookAppointment.fulfilled, (s, a) => { s.list.unshift(a.payload); s.bookingError = null; })
      .addCase(bookAppointment.rejected, (s, a) => {
        s.bookingError = a.payload?.message;
        s.suggestions = a.payload?.suggestions || [];
      });
  },
});

export const { setSuggestions, clearBookingError } = appointmentSlice.actions;
export default appointmentSlice.reducer;
