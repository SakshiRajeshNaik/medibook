import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/slices/authSlice";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      const role = result.payload.user.role;
      navigate(role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/patient");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-12rem)] overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50/40 px-4 py-12 sm:py-16">
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 translate-x-1/3 -translate-y-1/4 rounded-full bg-primary-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/4 translate-y-1/4 rounded-full bg-accent-200/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-4xl gap-10 lg:grid-cols-2 lg:items-center">
        <div className="hidden text-left lg:block">
          <p className="badge mb-4">Welcome back</p>
          <h1 className="text-4xl font-bold tracking-tight text-brand-navy">Sign in to your MediBook account</h1>
          <p className="mt-4 text-lg text-slate-600">
            Manage appointments, join video visits, and download prescriptions from one place.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-600">
            {["Real-time slot updates", "Secure role-based dashboards", "Email confirmations"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500/15 text-accent-600">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="card relative overflow-hidden border-0 shadow-glow">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-sky-400 to-accent-500" />
          <div className="pt-2">
            <h1 className="text-2xl font-bold text-brand-navy">Sign in</h1>
            <p className="mt-1 text-sm text-slate-500">Use your registered email and password.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="input-label">
                  Email
                </label>
                <input
                  id="email"
                  className="input-field"
                  type="email"
                  autoComplete="email"
                  placeholder="you@hospital.com"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="password" className="input-label">
                  Password
                </label>
                <input
                  id="password"
                  className="input-field"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
              )}
              <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-600">
              New here?{" "}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                Create an account
              </Link>
            </p>
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
              Demo: <span className="font-mono text-slate-700">patient@medibook.com</span> /{" "}
              <span className="font-mono text-slate-700">patient123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
