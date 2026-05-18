import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointments } from "../store/slices/appointmentSlice";
import { fetchNotifications, markAllRead } from "../store/slices/notificationSlice";
import api from "../services/api";

function statusBadge(status) {
  const map = {
    scheduled: "badge",
    waiting: "badge-accent",
    "in-progress": "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold",
    completed: "bg-emerald-100 text-emerald-800 rounded-full px-2.5 py-0.5 text-xs font-semibold",
    cancelled: "badge-muted",
  };
  const cls = map[status] || "badge-muted";
  return <span className={cls}>{status}</span>;
}

export default function PatientDashboard() {
  const dispatch = useDispatch();
  const { list } = useSelector((s) => s.appointments);
  const { list: notifications } = useSelector((s) => s.notifications);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reviewForm, setReviewForm] = useState({ appointmentId: "", rating: 5, comment: "" });

  useEffect(() => {
    dispatch(fetchAppointments());
    dispatch(fetchNotifications());
    api.get("/prescriptions").then((r) => setPrescriptions(r.data.prescriptions));
  }, [dispatch]);

  const submitReview = async () => {
    await api.post("/reviews", reviewForm);
    setReviewForm({ appointmentId: "", rating: 5, comment: "" });
    alert("Review submitted");
  };

  return (
    <div className="page-shell">
      <div className="border-b border-slate-200/80 pb-8">
        <p className="badge mb-2 w-fit">Patient</p>
        <h1 className="page-title">Your health hub</h1>
        <p className="page-subtitle">Appointments, alerts, prescriptions, and feedback in one place.</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="card border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy">My appointments</h2>
          <ul className="mt-5 space-y-3">
            {list.map((a) => (
              <li
                key={a._id}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-primary-100 hover:bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-navy">{a.doctor?.name}</p>
                    <p className="text-sm text-slate-500">
                      {a.date} · {a.time}
                    </p>
                  </div>
                  {statusBadge(a.status)}
                </div>
                <p className="mt-2 text-xs text-slate-500">Queue #{a.queuePosition}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.status === "in-progress" && (
                    <Link
                      to={`/video/${a._id}`}
                      className="inline-flex rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                    >
                      Join video
                    </Link>
                  )}
                  {a.paymentStatus !== "paid" && (
                    <Link
                      to={`/payment/${a._id}`}
                      className="inline-flex rounded-lg border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-800 hover:bg-accent-100"
                    >
                      Pay now
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-brand-navy">Notifications</h2>
            <button
              type="button"
              className="text-xs font-semibold text-primary-600 hover:text-primary-800"
              onClick={() => dispatch(markAllRead())}
            >
              Mark all read
            </button>
          </div>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm">
            {notifications.length === 0 && <li className="py-6 text-center text-slate-400">No notifications yet.</li>}
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`rounded-lg px-3 py-2 ${n.read ? "text-slate-400" : "bg-white font-medium text-slate-800 shadow-sm"}`}
              >
                <span className="text-primary-600">{n.title}</span> — {n.message}
              </li>
            ))}
          </ul>
        </section>

        <section className="card border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy">Prescriptions</h2>
          <ul className="mt-4 space-y-2">
            {prescriptions.length === 0 && <li className="text-sm text-slate-400">No prescriptions yet.</li>}
            {prescriptions.map((p) => (
              <li key={p._id}>
                <a
                  href={`/api/prescriptions/${p._id}/pdf`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="card border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy">Rate your visit</h2>
          <p className="mt-1 text-sm text-slate-500">Share feedback after a completed appointment.</p>
          <select
            className="input-field mt-4"
            value={reviewForm.appointmentId}
            onChange={(e) => setReviewForm({ ...reviewForm, appointmentId: e.target.value })}
          >
            <option value="">Select completed appointment</option>
            {list
              .filter((a) => a.status === "completed")
              .map((a) => (
                <option key={a._id} value={a._id}>
                  {a.date} — {a.doctor?.name}
                </option>
              ))}
          </select>
          <label className="input-label mt-4" htmlFor="rating">
            Rating (1–5)
          </label>
          <input
            id="rating"
            type="number"
            min={1}
            max={5}
            className="input-field"
            value={reviewForm.rating}
            onChange={(e) => setReviewForm({ ...reviewForm, rating: +e.target.value })}
          />
          <textarea
            className="input-field mt-4"
            placeholder="Optional comment…"
            value={reviewForm.comment}
            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
          />
          <button type="button" className="btn-primary mt-4 w-full" onClick={submitReview}>
            Submit review
          </button>
        </section>
      </div>
    </div>
  );
}
