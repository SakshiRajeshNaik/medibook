import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, clearAuthError } from "../store/slices/authSlice";
import Modal from "../components/ui/Modal";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [registeredMsg, setRegisteredMsg] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((s) => s.auth);

  useEffect(() => {
    if (location.state?.registered) {
      setRegisteredMsg("Registration successful. Please sign in.");
      if (location.state.email) setForm((f) => ({ ...f, email: location.state.email }));
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    setShowNotFound(false);
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      const role = result.payload.user.role;
      navigate(role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/home");
    } else if (login.rejected.match(result) && result.payload?.userNotFound) {
      setShowNotFound(true);
    }
  };

  return (
    <>
      <div className="w-full">
        <h1 className="text-3xl font-extrabold text-brand-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-brand-soft">Sign in to manage your appointments.</p>

        {registeredMsg && (
          <div className="mt-5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
            {registeredMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="input-label">Email address</label>
            <input
              id="email"
              className="input-field"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="password" className="input-label">Password</label>
            <div className="relative">
              <input
                id="password"
                className="input-field pr-11"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && !error.userNotFound && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {typeof error === "string" ? error : error.message}
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Signing in…
              </span>
            ) : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-soft">
          New patient?{" "}
          <Link to="/register" className="font-semibold text-primary-700 hover:text-primary-800">
            Create an account
          </Link>
        </p>
      </div>

      <Modal
        open={showNotFound}
        title="User not found"
        message="No account exists with this email. Please register first, then sign in."
        onClose={() => setShowNotFound(false)}
        actionLabel="Go to register"
        onAction={() => navigate("/register")}
      />
    </>
  );
}
