import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { register } from "../store/slices/authSlice";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "patient",
    specialization: "",
    department: "",
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) {
      navigate(form.role === "doctor" ? "/doctor" : "/patient");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-12rem)] overflow-hidden bg-gradient-to-br from-accent-50/60 via-white to-primary-50/80 px-4 py-12 sm:py-16">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[28rem] -translate-x-1/2 rounded-full bg-primary-300/25 blur-3xl" />

      <div className="relative mx-auto max-w-lg">
        <div className="mb-8 text-center lg:text-left">
          <p className="badge mx-auto mb-3 w-fit lg:mx-0">Join MediBook</p>
          <h1 className="text-3xl font-bold tracking-tight text-brand-navy">Create your account</h1>
          <p className="mt-2 text-slate-600">Patients book visits; doctors get a profile and schedule tools.</p>
        </div>

        <div className="card relative overflow-hidden border-0 shadow-glow">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-500 via-teal-400 to-primary-500" />
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div>
              <label className="input-label" htmlFor="reg-name">
                Full name
              </label>
              <input
                id="reg-name"
                className="input-field"
                placeholder="Alex Kumar"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="input-label" htmlFor="reg-email">
                  Email
                </label>
                <input
                  id="reg-email"
                  className="input-field"
                  type="email"
                  placeholder="you@email.com"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label" htmlFor="reg-phone">
                  Phone
                </label>
                <input
                  id="reg-phone"
                  className="input-field"
                  placeholder="+91 …"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label" htmlFor="reg-role">
                  I am a
                </label>
                <select
                  id="reg-role"
                  className="input-field"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
            </div>
            <div>
              <label className="input-label" htmlFor="reg-pass">
                Password
              </label>
              <input
                id="reg-pass"
                className="input-field"
                type="password"
                placeholder="At least 6 characters"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {form.role === "doctor" && (
              <div className="grid gap-5 rounded-xl border border-primary-100 bg-primary-50/50 p-4 sm:grid-cols-2">
                <div>
                  <label className="input-label">Specialization</label>
                  <input
                    className="input-field bg-white"
                    placeholder="e.g. Cardiology"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">Department</label>
                  <input
                    className="input-field bg-white"
                    placeholder="e.g. Heart Care"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                </div>
              </div>
            )}
            <button type="submit" className="btn-primary w-full py-3 text-base">
              Create account
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
