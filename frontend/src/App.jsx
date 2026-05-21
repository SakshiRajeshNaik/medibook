import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe, markAuthReady } from "./store/slices/authSlice";
import { fetchNotifications, addNotification } from "./store/slices/notificationSlice";
import { fetchAppointments } from "./store/slices/appointmentSlice";
import { getSocket } from "./services/socket";
import { RequireAuth, GuestOnly } from "./components/AuthGate";
import Layout from "./components/layout/Layout";
import AuthLayout from "./components/layout/AuthLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DoctorSearch from "./pages/DoctorSearch";
import DoctorDetail from "./pages/DoctorDetail";
import BookAppointment from "./pages/BookAppointment";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentPage from "./pages/PaymentPage";

export default function App() {
  const dispatch = useDispatch();
  const { user, authReady } = useSelector((s) => s.auth);

  const homeForRole = (role) =>
    role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/home";

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        await dispatch(fetchMe());
      } else {
        dispatch(markAuthReady());
      }
    };
    bootstrap();
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    dispatch(fetchNotifications());
    const socket = getSocket();
    if (!socket) return;

    const onNotification = (n) => dispatch(addNotification(n));
    const onAppointments = () => dispatch(fetchAppointments());
    const onSlotTiming = (payload) => {
      dispatch(
        addNotification({
          _id: Date.now().toString(),
          title: "Slot updated",
          message: payload.message,
          read: false,
        })
      );
      dispatch(fetchAppointments());
    };

    socket.on("notification", onNotification);
    socket.on("appointments_updated", onAppointments);
    socket.on("slot_timing_updated", onSlotTiming);

    return () => {
      socket.off("notification", onNotification);
      socket.off("appointments_updated", onAppointments);
      socket.off("slot_timing_updated", onSlotTiming);
    };
  }, [dispatch, user]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 text-brand-soft">
        Checking session…
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? <Navigate to={homeForRole(user.role)} replace /> : <Navigate to="/login" replace />
        }
      />

      <Route
        element={
          <GuestOnly>
            <AuthLayout />
          </GuestOnly>
        }
      >
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/home" element={<RequireAuth roles={["patient"]}><Home /></RequireAuth>} />
        <Route path="/doctors" element={<RequireAuth roles={["patient"]}><DoctorSearch /></RequireAuth>} />
        <Route path="/doctors/:id" element={<RequireAuth roles={["patient"]}><DoctorDetail /></RequireAuth>} />
        <Route path="/book/:doctorId" element={<RequireAuth roles={["patient"]}><BookAppointment /></RequireAuth>} />
        <Route path="/patient" element={<RequireAuth roles={["patient"]}><PatientDashboard /></RequireAuth>} />
        <Route path="/doctor" element={<RequireAuth roles={["doctor"]}><DoctorDashboard /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth roles={["admin"]}><AdminDashboard /></RequireAuth>} />
        <Route path="/payment/:appointmentId" element={<RequireAuth roles={["patient"]}><PaymentPage /></RequireAuth>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
