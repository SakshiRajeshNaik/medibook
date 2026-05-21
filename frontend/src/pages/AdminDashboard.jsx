import { useEffect, useState, useRef } from "react";
import api from "../services/api";

// ── helpers ──────────────────────────────────────────────────────────────────
const ROLE_OPTIONS = ["all", "patient", "doctor", "admin"];
const ACTIVE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

function StatCard({ label, value, accent, id }) {
  return (
    <a
      href={`#${id}`}
      className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-card block hover:shadow-md transition-shadow"
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 ${accent}`} />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-brand-ink">{value ?? 0}</p>
      <p className="mt-1 text-xs text-primary-600 font-medium">View details ↓</p>
    </a>
  );
}

const STAT_CONFIG = [
  { key: "totalPatients", label: "Patients", accent: "from-sky-500 to-blue-600", id: "section-patients" },
  { key: "totalDoctors", label: "Doctors", accent: "from-teal-500 to-accent-600", id: "section-doctors" },
  { key: "totalAppointments", label: "Appointments", accent: "from-violet-500 to-purple-600", id: "section-appointments" },
  { key: "totalRevenue", label: "Revenue (₹)", accent: "from-amber-500 to-orange-600", id: "section-revenue" },
];

// ── Add Doctor Form ───────────────────────────────────────────────────────────
function AddDoctorForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    specialization: "", department: "", qualification: "",
    experienceYears: "", bio: "", consultationFee: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/admin/doctors", {
        ...form,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : 0,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : 500,
      });
      setForm({ name: "", email: "", phone: "", password: "", specialization: "", department: "", qualification: "", experienceYears: "", bio: "", consultationFee: "" });
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create doctor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button type="button" className="btn-primary" onClick={() => setOpen((v) => !v)}>
        {open ? "Cancel" : "+ Add Doctor"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
          <h3 className="md:col-span-2 text-base font-bold text-brand-ink">New doctor account</h3>

          <div>
            <label className="input-label">Full name *</label>
            <input className="input-field" required value={form.name} onChange={set("name")} placeholder="Dr. Jane Smith" />
          </div>
          <div>
            <label className="input-label">Email *</label>
            <input className="input-field" type="email" required value={form.email} onChange={set("email")} placeholder="doctor@hospital.com" />
          </div>
          <div>
            <label className="input-label">Phone *</label>
            <input className="input-field" required value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="input-label">Password *</label>
            <input className="input-field" type="password" required minLength={6} value={form.password} onChange={set("password")} placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="input-label">Specialization *</label>
            <input className="input-field" required value={form.specialization} onChange={set("specialization")} placeholder="e.g. Cardiology" />
          </div>
          <div>
            <label className="input-label">Department *</label>
            <input className="input-field" required value={form.department} onChange={set("department")} placeholder="e.g. Cardiac Sciences" />
          </div>
          <div>
            <label className="input-label">Qualification</label>
            <input className="input-field" value={form.qualification} onChange={set("qualification")} placeholder="MBBS, MD…" />
          </div>
          <div>
            <label className="input-label">Experience (years)</label>
            <input className="input-field" type="number" min={0} value={form.experienceYears} onChange={set("experienceYears")} placeholder="5" />
          </div>
          <div>
            <label className="input-label">Consultation fee (₹)</label>
            <input className="input-field" type="number" min={0} value={form.consultationFee} onChange={set("consultationFee")} placeholder="500" />
          </div>
          <div className="md:col-span-2">
            <label className="input-label">Bio</label>
            <textarea className="input-field" rows={3} value={form.bio} onChange={set("bio")} placeholder="Short professional bio…" />
          </div>

          {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating…" : "Create doctor"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availability, setAvailability] = useState([]);

  // filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  const loadAnalytics = () => api.get("/admin/analytics").then((r) => setAnalytics(r.data.analytics));
  const loadUsers = () => {
    const params = {};
    if (roleFilter !== "all") params.role = roleFilter;
    if (activeFilter !== "all") params.isActive = activeFilter;
    api.get("/admin/users", { params }).then((r) => setUsers(r.data.users));
  };
  const loadDoctors = () => api.get("/admin/doctors").then((r) => setDoctors(r.data.doctors));
  const loadAvailability = () => api.get("/admin/doctors/availability").then((r) => setAvailability(r.data.doctors));

  useEffect(() => {
    loadAnalytics();
    loadDoctors();
    loadAvailability();
  }, []);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, activeFilter]);

  const toggleUser = async (id, current) => {
    await api.patch(`/admin/users/${id}`, { isActive: !current });
    loadUsers();
  };

  const deleteDoctor = async (profileId, name) => {
    if (!window.confirm(`Delete Dr. ${name}? This will permanently remove their account and profile.`)) return;
    try {
      await api.delete(`/admin/doctors/${profileId}`);
      loadDoctors();
      loadAvailability();
      loadAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete doctor");
    }
  };

  if (!analytics) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm font-medium text-slate-500">Loading analytics…</p>
        </div>
      </div>
    );
  }

  // group doctors by specialization for the "all doctors" list
  const bySpecialization = doctors.reduce((acc, d) => {
    const key = d.specialization || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  return (
    <div className="page-shell">
      {/* ── Header ── */}
      <div className="border-b border-slate-200/80 pb-8">
        <p className="mb-2 inline-flex w-fit items-center rounded-full bg-primary-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-800">
          Administrator
        </p>
        <h1 className="page-title">Operations overview</h1>
        <p className="page-subtitle">Live counts across users, bookings, and payments. Click a card to jump to that section.</p>
      </div>

      {/* ── Overview stat cards (anchor links) ── */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CONFIG.map((s) => (
          <StatCard key={s.key} label={s.label} value={analytics[s.key]} accent={s.accent} id={s.id} />
        ))}
      </div>

      {/* ── Doctor availability panel ── */}
      <section className="mt-12 card border-slate-100">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-bold text-brand-ink">Doctor availability — today</h2>
          <button type="button" className="btn-secondary text-xs py-1.5" onClick={loadAvailability}>
            Refresh
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availability.length === 0 && (
            <p className="text-sm text-slate-400 col-span-full">No doctors found.</p>
          )}
          {availability.map((d) => (
            <div
              key={d._id}
              className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
                !d.isActive
                  ? "border-slate-200 bg-slate-50 opacity-60"
                  : d.isBusy
                  ? "border-amber-200 bg-amber-50"
                  : d.isAvailable
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm text-brand-ink truncate">{d.name}</p>
                <p className="text-xs text-slate-500 truncate">{d.specialization} · {d.department}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  !d.isActive
                    ? "bg-slate-200 text-slate-600"
                    : d.isBusy
                    ? "bg-amber-200 text-amber-800"
                    : d.isAvailable
                    ? "bg-emerald-200 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {!d.isActive ? "Inactive" : d.isBusy ? "Busy" : d.isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Patients section ── */}
      <section id="section-patients" className="mt-12 scroll-mt-20">
        <h2 className="text-lg font-bold text-brand-ink border-b border-slate-200 pb-3">Patients</h2>
        <p className="mt-2 text-sm text-slate-500">
          Total registered patients: <span className="font-bold text-brand-ink">{analytics.totalPatients}</span>
        </p>
      </section>

      {/* ── Appointments section ── */}
      <section id="section-appointments" className="mt-12 scroll-mt-20">
        <h2 className="text-lg font-bold text-brand-ink border-b border-slate-200 pb-3">Appointments</h2>
        <p className="mt-2 text-sm text-slate-500">
          Total appointments: <span className="font-bold text-brand-ink">{analytics.totalAppointments}</span>
          {" · "}Completed: <span className="font-bold text-emerald-700">{analytics.completedAppointments}</span>
        </p>
      </section>

      {/* ── Revenue section ── */}
      <section id="section-revenue" className="mt-12 scroll-mt-20">
        <h2 className="text-lg font-bold text-brand-ink border-b border-slate-200 pb-3">Revenue</h2>
        <p className="mt-2 text-sm text-slate-500">
          Total collected: <span className="font-bold text-brand-ink">₹{analytics.totalRevenue?.toLocaleString("en-IN") ?? 0}</span>
        </p>
      </section>

      {/* ── Doctors section ── */}
      <section id="section-doctors" className="mt-12 scroll-mt-20">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-brand-ink">Doctors</h2>
          <span className="text-sm text-slate-500">{doctors.length} total</span>
        </div>

        {/* Add doctor form */}
        <div className="mt-6">
          <AddDoctorForm onCreated={() => { loadDoctors(); loadAvailability(); loadAnalytics(); }} />
        </div>

        {/* Doctors grouped by specialization */}
        <div className="mt-8 space-y-8">
          {Object.entries(bySpecialization).map(([spec, docs]) => (
            <div key={spec}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-primary-700 mb-3">
                {spec} <span className="text-slate-400 font-normal">({docs.length})</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Fee (₹)</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {docs.map((d) => (
                      <tr key={d._id} className="bg-white hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-brand-ink">{d.user?.name}</td>
                        <td className="px-4 py-3 text-slate-600">{d.user?.email}</td>
                        <td className="px-4 py-3 text-slate-600">{d.department}</td>
                        <td className="px-4 py-3 text-slate-600">₹{d.consultationFee}</td>
                        <td className="px-4 py-3 text-slate-600">★ {d.ratingAverage?.toFixed(1)}</td>
                        <td className="px-4 py-3">
                          {d.user?.isActive ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Active</span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                            onClick={() => deleteDoctor(d._id, d.user?.name)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── All users with filters ── */}
      <section className="mt-12 card overflow-hidden border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-brand-ink">All users</h2>
          <div className="flex flex-wrap gap-3">
            {/* Role filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</label>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r === "all" ? "All roles" : r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            {/* Active filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                {ACTIVE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No users match the selected filters.</td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u._id} className="bg-white hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-brand-ink">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="badge-muted capitalize">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive
                      ? <span className="text-emerald-600 font-medium">Active</span>
                      : <span className="text-slate-400">Inactive</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        u.isActive
                          ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                      onClick={() => toggleUser(u._id, u.isActive)}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
