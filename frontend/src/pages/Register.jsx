import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { register } from "../store/slices/authSlice";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "patient",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await dispatch(register({ ...form, role: "patient" }));
    setLoading(false);
    if (register.fulfilled.match(result)) {
      navigate("/login", { state: { registered: true, email: form.email } });
    } else {
      setError(result.payload || "Registration failed");
    }
  };

  return (
    <div className="card w-full max-w-lg border-primary-100">
      <h1 className="text-2xl font-bold text-brand-ink">Create account</h1>
      <p className="mt-1 text-sm text-brand-soft">Register as a patient, then sign in to book appointments.</p>

      {registered && (
        <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          Registration successful. Please sign in with your email and password.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input className="input-field" placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input-field" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input-field" placeholder="Phone (for SMS confirmations)" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input-field" type="password" placeholder="Password (min 6 chars)" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? "Creating…" : "Register"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-brand-soft">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-primary-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
