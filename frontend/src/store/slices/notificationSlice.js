import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchNotifications = createAsyncThunk("notifications/list", async () => {
  const { data } = await api.get("/notifications");
  return data.notifications;
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState: { list: [], unread: 0 },
  reducers: {
    addNotification: (s, a) => {
      s.list.unshift(a.payload);
      s.unread += 1;
    },
    markAllRead: (s) => {
      s.list = s.list.map((n) => ({ ...n, read: true }));
      s.unread = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.fulfilled, (s, a) => {
      s.list = a.payload;
      s.unread = a.payload.filter((n) => !n.read).length;
    });
  },
});

export const { addNotification, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
