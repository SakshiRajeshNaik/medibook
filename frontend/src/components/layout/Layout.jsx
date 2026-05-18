import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";

function LogoMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-soft">
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </div>
  );
}

export default function Layout() {
  const { user } = useSelector((s) => s.auth);
  const { unread } = useSelector((s) => s.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const dashPath =
    user?.role === "admin" ? "/admin" : user?.role === "doctor" ? "/doctor" : "/patient";

  const navLink = (to, label) => {
    const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
          active ? "bg-primary-50 text-primary-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-surface-50 to-surface-100">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/75 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <LogoMark />
            <div>
              <span className="block text-lg font-bold tracking-tight text-brand-navy group-hover:text-primary-700">
                MediBook
              </span>
              <span className="hidden text-xs font-medium text-slate-500 sm:block">Hospital appointments</span>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
            {navLink("/doctors", "Find doctors")}
            {user ? (
              <>
                <Link
                  to={dashPath}
                  className="relative inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Dashboard
                  {unread > 0 && (
                    <span className="ml-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-1 text-[10px] font-bold text-white shadow-sm">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
                <span className="hidden max-w-[140px] truncate text-sm text-slate-500 sm:inline" title={user.name}>
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(logout());
                    navigate("/");
                  }}
                  className="btn-secondary py-2 text-sm"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary py-2 text-sm shadow-none">
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200/80 bg-white/80 py-8 text-center text-sm text-slate-500 backdrop-blur-sm">
        <p className="font-medium text-slate-600">MediBook</p>
        <p className="mt-1">Hospital appointment system · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
