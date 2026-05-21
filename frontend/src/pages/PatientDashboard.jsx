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
  return <span className={map[status] || "badge-muted"}>{status}</span>;
}

// Cancellation confirmation modal
function CancelModal({ appointment, onConfirm, onClose }) {
  const isPaid = appointment?.paymentStatus === "paid";
  const fee = appointment?.amount || 0;
  const cancellationFee = Math.round(fee * 0.1);
  const refund = fee - cancellationFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-brand-ink">Cancel appointment?</h3>
        <p className="mt-1 text-sm text-slate-500">
          {appointment?.doctor?.name} · {appointment?.date} at {appointment?.time}
        </p>

        {isPaid ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-semibold text-amber-800">Cancellation fee applies</p>
            <div className="mt-2 space-y-1 text-amber-700">
              <div className="flex justify-between">
                <span>Original payment</span>
                <span className="font-semibold">₹{fee}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Cancellation fee (10%)</span>
                <span className="font-semibold">− ₹{cancellationFee}</span>
              </div>
              <div className="flex justify-between border-t border-amber-200 pt-1 font-bold text-emerald-700">
                <span>Refund amount</span>
                <span>₹{refund}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">This appointment has not been paid yet. No charges will apply.</p>
        )}

        <div className="mt-5 flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            Keep it
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition"
            onClick={onConfirm}
          >
            Yes, cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Refund info modal shown after cancellation
function RefundModal({ refundInfo, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-brand-ink">Appointment cancelled</h3>
        {refundInfo ? (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-left">
            <div className="flex justify-between text-slate-600">
              <span>Original amount</span>
              <span>₹{refundInfo.originalAmount}</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Cancellation fee (10%)</span>
              <span>− ₹{refundInfo.cancellationFee}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-emerald-700">
              <span>Refund</span>
              <span>₹{refundInfo.refundAmount}</span>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No payment was made — nothing to refund.</p>
        )}
        <button type="button" className="btn-primary mt-5 w-full" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const dispatch = useDispatch();
  const { list } = useSelector((s) => s.appointments);
  const { list: notifications } = useSelector((s) => s.notifications);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reviewForm, setReviewForm] = useState({ appointmentId: "", rating: 5, comment: "" });
  const [cancelTarget, setCancelTarget] = useState(null);
  const [refundResult, setRefundResult] = useState(null);

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

  const confirmCancel = async () => {
    try {
      const { data } = await api.delete(`/appointments/${cancelTarget._id}`);
      setCancelTarget(null);
      setRefundResult(data.refundInfo || null);
      dispatch(fetchAppointments());
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel");
      setCancelTarget(null);
    }
  };

  const cancellableStatuses = ["scheduled", "waiting"];

  return (
    <div className="page-shell">
      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onConfirm={confirmCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {refundResult !== undefined && refundResult !== null && (
        <RefundModal refundInfo={refundResult} onClose={() => setRefundResult(undefined)} />
      )}
      {/* Show "cancelled, no refund" modal when refundResult is explicitly null (set after cancel) */}
      {refundResult === null && cancelTarget === null && (
        // only show if we just cancelled (track with a flag)
        null
      )}

      <div className="border-b border-slate-200/80 pb-8">
        <p className="badge mb-2 w-fit">Patient</p>
        <h1 className="page-title">Your health hub</h1>
        <p className="page-subtitle">Appointments, alerts, prescriptions, and feedback in one place.</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="card border-slate-100">
          <h2 className="text-lg font-bold text-brand-ink">My appointments</h2>
          <ul className="mt-5 space-y-3">
            {list.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No appointments yet.</li>}
            {list.map((a) => (
              <li
                key={a._id}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-primary-100 hover:bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-ink">{a.doctor?.name}</p>
                    <p className="text-sm text-slate-500">{a.date} · {a.time}</p>
                  </div>
                  {statusBadge(a.status)}
                </div>
                <p className="mt-2 text-xs text-slate-500">Queue #{a.queuePosition}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.status === "scheduled" && (
                    <button
                      type="button"
                      className="inline-flex rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-800 hover:bg-primary-100"
                      onClick={async () => {
                        await api.patch(`/appointments/${a._id}/status`, { status: "in-progress" });
                        dispatch(fetchAppointments());
                      }}
                    >
                      Start treatment
                    </button>
                  )}
                  {a.status === "in-progress" && (
                    <>
                      <button
                        type="button"
                        className="inline-flex rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                        onClick={async () => {
                          await api.patch(`/appointments/${a._id}/status`, { delayMinutes: 15 });
                          alert("Other patients in this slot were notified by email & SMS.");
                          dispatch(fetchAppointments());
                        }}
                      >
                        Report delay (+15 min)
                      </button>
                      <button
                        type="button"
                        className="inline-flex rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        onClick={async () => {
                          await api.patch(`/appointments/${a._id}/status`, { earlyMinutes: 10 });
                          alert("Slot updated — waiting patients notified.");
                          dispatch(fetchAppointments());
                        }}
                      >
                        Finished early (−10 min)
                      </button>
                    </>
                  )}

                  {a.paymentStatus !== "paid" && a.status !== "cancelled" && (
                    <Link
                      to={`/payment/${a._id}`}
                      className="inline-flex rounded-lg border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-800 hover:bg-accent-100"
                    >
                      Pay now
                    </Link>
                  )}
                  {cancellableStatuses.includes(a.status) && (
                    <button
                      type="button"
                      className="inline-flex rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      onClick={() => setCancelTarget(a)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-brand-ink">Notifications</h2>
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
          <h2 className="text-lg font-bold text-brand-ink">Prescriptions</h2>
          <ul className="mt-4 space-y-2">
            {prescriptions.length === 0 && <li className="text-sm text-slate-400">No prescriptions yet.</li>}
            {prescriptions.map((p) => (
              <li key={p._id}>
                <a
                  href={`/api/prescriptions/${p._id}/pdf?token=${localStorage.getItem("token")}`}
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
          <h2 className="text-lg font-bold text-brand-ink">Rate your visit</h2>
          <p className="mt-1 text-sm text-slate-500">Share feedback after a completed appointment.</p>
          <select
            className="input-field mt-4"
            value={reviewForm.appointmentId}
            onChange={(e) => setReviewForm({ ...reviewForm, appointmentId: e.target.value })}
          >
            <option value="">Select completed appointment</option>
            {list.filter((a) => a.status === "completed").map((a) => (
              <option key={a._id} value={a._id}>{a.date} — {a.doctor?.name}</option>
            ))}
          </select>
          <label className="input-label mt-4" htmlFor="rating">Rating (1–5)</label>
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
