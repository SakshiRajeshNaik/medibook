import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const searchDoctors = createAsyncThunk("doctors/search", async (params) => {
  const { data } = await api.get("/doctors", { params });
  return data.doctors;
});

export const fetchDoctor = createAsyncThunk("doctors/fetchOne", async (id) => {
  const { data } = await api.get(`/doctors/${id}`);
  return data.doctor;
});

export const fetchSlots = createAsyncThunk("doctors/slots", async ({ doctorId, date }) => {
  const { data } = await api.get(`/doctors/${doctorId}/slots`, { params: { date } });
  return data.slots;
});

const doctorSlice = createSlice({
  name: "doctors",
  initialState: { list: [], selected: null, slots: [], loading: false },
  reducers: { clearSelected: (s) => { s.selected = null; s.slots = []; } },
  extraReducers: (builder) => {
    builder
      .addCase(searchDoctors.pending, (s) => { s.loading = true; })
      .addCase(searchDoctors.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchDoctor.fulfilled, (s, a) => { s.selected = a.payload; })
      .addCase(fetchSlots.fulfilled, (s, a) => { s.slots = a.payload; });
  },
});

export default doctorSlice.reducer;
