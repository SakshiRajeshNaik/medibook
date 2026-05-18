import { useEffect, useState } from "react";
import api from "../services/api";

const statConfig = [
  { key: "totalPatients", label: "Patients", accent: "from-sky-500 to-blue-600" },
  { key: "totalDoctors", label: "Doctors", accent: "from-teal-500 to-accent-600" },
  { key: "totalAppointments", label: "Appointments", accent: "from-violet-500 to-purple-600" },
  { key: "totalRevenue", label: "Revenue (₹)", accent: "from-amber-500 to-orange-600" },
];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/admin/analytics").then((r) => setAnalytics(r.data.analytics));
    api.get("/admin/users").then((r) => setUsers(r.data.users));
  }, []);

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

  return (
    <div className="page-shell">
      <div className="border-b border-slate-200/80 pb-8">
        <p className="mb-2 inline-flex w-fit items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Administrator
        </p>
        <h1 className="page-title">Operations overview</h1>
        <p className="page-subtitle">Live counts across users, bookings, and payments.</p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((s) => (
          <div
            key={s.key}
            className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-card"
          >
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 ${s.accent}`} />
            <p className="text-sm font-medium text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-brand-navy">{analytics[s.key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="card border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy">Appointments by status</h2>
          <ul className="mt-4 space-y-2">
            {analytics.appointmentsByStatus?.map((row) => (
              <li
                key={row._id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm"
              >
                <span className="font-medium capitalize text-slate-700">{row._id}</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary-700 shadow-sm">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy">Recent activity</h2>
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto text-sm">
            {analytics.recentAppointments?.map((a) => (
              <li key={a._id} className="rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50">
                <span className="font-medium text-brand-navy">{a.patient?.name}</span>
                <span className="text-slate-400"> → </span>
                <span className="font-medium text-slate-700">{a.doctor?.name}</span>
                <span className="ml-2 text-xs text-slate-400">({a.status})</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card overflow-hidden border-slate-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-brand-navy">All users</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="bg-white hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-brand-navy">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="badge-muted capitalize">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">{u.isActive ? <span className="text-emerald-600">Yes</span> : <span className="text-slate-400">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
