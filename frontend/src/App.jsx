import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "./store/slices/authSlice";
import { fetchNotifications, addNotification } from "./store/slices/notificationSlice";
import { getSocket } from "./services/socket";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DoctorSearch from "./pages/DoctorSearch";
import DoctorDetail from "./pages/DoctorDetail";
import BookAppointment from "./pages/BookAppointment";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import VideoConsult from "./pages/VideoConsult";
import PaymentPage from "./pages/PaymentPage";

function ProtectedRoute({ children, roles }) {
  const { user, token } = useSelector((s) => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (user && roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
}

export default function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [dispatch, token]);

  useEffect(() => {
    if (!user) return;
    dispatch(fetchNotifications());
    const socket = getSocket();
    if (!socket) return;
    socket.on("notification", (n) => dispatch(addNotification(n)));
    socket.on("appointments_updated", () => dispatch(fetchMe()));
    return () => {
      socket.off("notification");
      socket.off("appointments_updated");
    };
  }, [dispatch, user]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors" element={<DoctorSearch />} />
        <Route path="/doctors/:id" element={<DoctorDetail />} />
        <Route
          path="/book/:doctorId"
          element={
            <ProtectedRoute roles={["patient"]}>
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient"
          element={
            <ProtectedRoute roles={["patient"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute roles={["doctor"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video/:appointmentId"
          element={
            <ProtectedRoute>
              <VideoConsult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/:appointmentId"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
