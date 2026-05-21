import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function AuthSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 text-brand-soft">
      Loading…
    </div>
  );
}

export function RequireAuth({ children, roles }) {
  const { token, user, authReady } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!authReady) return <AuthSpinner />;
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    const dest = user.role === "admin" ? "/admin" : user.role === "doctor" ? "/doctor" : "/home";
    return <Navigate to={dest} replace />;
  }
  return children;
}

export function GuestOnly({ children }) {
  const { token, user, authReady } = useSelector((s) => s.auth);

  if (!authReady) return <AuthSpinner />;
  if (token && user) {
    const dest = user.role === "admin" ? "/admin" : user.role === "doctor" ? "/doctor" : "/home";
    return <Navigate to={dest} replace />;
  }
  return children;
}
