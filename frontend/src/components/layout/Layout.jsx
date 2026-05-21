import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";

function LogoMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-soft">
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </div>
  );
}

// Deterministic color from name — same logic as Gmail
const AVATAR_COLORS = [
  "bg-red-500", "bg-pink-500", "bg-purple-500", "bg-indigo-500",
  "bg-blue-500", "bg-teal-500", "bg-emerald-500", "bg-amber-500", "bg-orange-500",
];
function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const color = avatarColor(user?.name);
  const ini = initials(user?.name);
  const rolePath = user?.role === "admin" ? "/admin" : user?.role === "doctor" ? "/doctor" : "/home";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ring-2 ring-white transition hover:ring-primary-300 focus:outline-none ${color}`}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {ini}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-slate-100 bg-white py-2 shadow-xl">
          {/* User info header */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 pb-3 pt-1">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}>
              {ini}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-ink">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
              <span className="mt-0.5 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-primary-700">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              to={rolePath}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            {user?.role === "patient" && (
              <Link
                to="/patient"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My appointments
              </Link>
            )}
          </div>

          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              onClick={() => { dispatch(logout()); navigate("/login"); setOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user } = useSelector((s) => s.auth);
  const { unread } = useSelector((s) => s.notifications);
  const location = useLocation();

  const homePath = user?.role === "patient" ? "/home" : user?.role === "doctor" ? "/doctor" : "/admin";

  const navLink = (to, label) => {
    const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
          active ? "bg-primary-100 text-primary-800" : "text-brand-soft hover:bg-surface-100"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <header className="sticky top-0 z-50 border-b border-surface-200 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to={homePath} className="flex items-center gap-3">
            <LogoMark />
            <span className="text-lg font-bold text-primary-700">MediBook</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            {user?.role === "patient" && navLink("/home", "Home")}
            {user?.role === "patient" && navLink("/doctors", "Doctors")}
            {navLink(homePath, "Dashboard")}
            {unread > 0 && (
              <Link to={homePath} className="rounded-full bg-primary-500 px-2 py-0.5 text-xs font-bold text-white">
                {unread}
              </Link>
            )}
            <UserMenu user={user} />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-surface-200 bg-white py-6 text-center text-sm text-brand-soft">
        MediBook · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
