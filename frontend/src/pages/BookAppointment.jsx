import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDoctor, fetchSlots } from "../store/slices/doctorSlice";
import { bookAppointment, lockSlot, fetchAppointments, clearBookingError } from "../store/slices/appointmentSlice";
import { getSocket } from "../services/socket";
import { formatDoctorAvailableDays, isDateOnDoctorSchedule } from "../utils/scheduleDays";
import Avatar from "../components/ui/Avatar";

// Fill bar: shows booked/capacity visually
function SlotFillBar({ booked, capacity }) {
  const pct = Math.min(100, Math.round((booked / capacity) * 100));
  const color =
    pct === 0 ? "bg-emerald-400" : pct < 67 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="mt-1.5 h-1 w-full rounded-full bg-slate-200 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function BookAppointment() {
  const { doctorId } = useParams();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selected, slots } = useSelector((s) => s.doctors);
  const { bookingError, suggestions } = useSelector((s) => s.appointments);

  useEffect(() => {
    dispatch(fetchDoctor(doctorId));
  }, [dispatch, doctorId]);

  useEffect(() => {
    if (date) {
      dispatch(fetchSlots({ doctorId, date }));
      dispatch(clearBookingError());
      setTime("");
    }
  }, [dispatch, doctorId, date]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !doctorId || !date) return;

    socket.emit("join_doctor_slots", { doctorId, date });
    const refresh = (payload) => {
      if (payload?.doctorId === doctorId && payload?.date === date) {
        dispatch(fetchSlots({ doctorId, date }));
      }
    };
    socket.on("slots_updated", refresh);
    socket.on("queue_updated", refresh);

    return () => {
      socket.off("slots_updated", refresh);
      socket.off("queue_updated", refresh);
    };
  }, [dispatch, doctorId, date]);

  const handleSelectSlot = async (slotTime) => {
    setTime(slotTime);
    dispatch(clearBookingError());
    await dispatch(lockSlot({ doctorId, date, time: slotTime }));
  };

  const handleBook = async () => {
    if (selected?.schedule?.length && !isDateOnDoctorSchedule(selected.schedule, date)) {
      alert("This doctor is not available on the selected weekday. Pick another date.");
      return;
    }
    const result = await dispatch(bookAppointment({ doctorId, date, time, reason }));
    if (bookAppointment.fulfilled.match(result)) {
      dispatch(fetchAppointments());
      setConfirmMsg(result.payload.confirmationMessage || "Booking confirmed! Check email/SMS.");
      setTimeout(() => navigate(`/payment/${result.payload._id}`), 2000);
    }
    // On rejection, suggestions are set in the slice from the API response
    // Refresh slots so the UI reflects the latest state
    if (bookAppointment.rejected.match(result)) {
      dispatch(fetchSlots({ doctorId, date }));
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];
  const days = selected ? formatDoctorAvailableDays(selected.schedule) : null;

  // Available slots excluding the currently selected (full) one — for suggestions
  const availableSuggestions = suggestions?.length
    ? slots.filter((s) => suggestions.includes(s.time) && s.time !== time && !s.full)
    : [];

  return (
    <div className="page-shell max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={selected?.user?.name || "Dr"} size="md" />
        <div>
          <h1 className="page-title text-xl">Book with {selected?.user?.name || "…"}</h1>
          {days && (
            <p className="text-sm text-primary-700">
              Available on: <strong>{days.full}</strong>
            </p>
          )}
          <p className="page-subtitle">Slots update in real time when others book or the queue changes.</p>
        </div>
      </div>

      {confirmMsg && (
        <div className="mb-4 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          {confirmMsg}
        </div>
      )}

      <div className="card space-y-6">
        {/* Date picker */}
        <div>
          <label className="input-label" htmlFor="appt-date">
            Date (must match an available day)
          </label>
          <input
            id="appt-date"
            type="date"
            className="input-field"
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Slot grid */}
        {date && (
          <div>
            <p className="input-label flex items-center gap-2">
              Available times
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-normal normal-case text-primary-700">
                live
              </span>
            </p>

            {slots.length === 0 ? (
              <p className="text-sm text-slate-400">No slots available for this date.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {slots.map((s) => {
                  const full = s.full || (s.capacity && s.booked >= s.capacity);
                  const taken = full || s.locked || !s.available;
                  const active = time === s.time;
                  const booked = s.booked ?? 0;
                  const capacity = s.capacity ?? 3;

                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={taken}
                      onClick={() => handleSelectSlot(s.time)}
                      className={`flex flex-col items-center rounded-xl border-2 px-2 py-3 text-xs font-semibold transition sm:text-sm ${
                        active
                          ? "border-primary-500 bg-primary-100 text-primary-800"
                          : full
                            ? "cursor-not-allowed border-surface-200 bg-surface-100 text-slate-400"
                            : booked > 0
                              ? "border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400"
                              : "border-surface-200 bg-surface-50 text-brand-ink hover:border-primary-300"
                      } ${s.locked && !full ? "opacity-60" : ""}`}
                    >
                      {/* Time */}
                      <span className={full ? "line-through" : ""}>{s.time}</span>

                      {/* Booked / capacity count */}
                      <span className={`mt-0.5 text-[10px] font-normal ${
                        full
                          ? "text-slate-400"
                          : booked === 0
                            ? "text-emerald-600"
                            : booked === capacity - 1
                              ? "text-red-500"
                              : "text-amber-600"
                      }`}>
                        {full ? "Full" : `${booked}/${capacity} booked`}
                      </span>

                      {/* Fill bar */}
                      <div className="mt-1.5 h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            full
                              ? "bg-slate-400"
                              : booked === 0
                                ? "bg-emerald-400"
                                : booked === capacity - 1
                                  ? "bg-red-400"
                                  : "bg-amber-400"
                          }`}
                          style={{ width: `${Math.min(100, Math.round((booked / capacity) * 100))}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        <textarea
          className="input-field min-h-[80px]"
          placeholder="Reason for visit"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* Booking error + suggestions (excluding the full slot) */}
        {bookingError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">{bookingError}</p>

            {availableSuggestions.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                  Try one of these available slots instead:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSuggestions.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => handleSelectSlot(s.time)}
                      className="rounded-lg border border-primary-300 bg-white px-3 py-1.5 text-xs font-bold text-primary-700 hover:bg-primary-50 transition"
                    >
                      {s.time} · {s.booked}/{s.capacity} booked
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="btn-primary w-full py-3"
          disabled={!date || !time}
          onClick={handleBook}
        >
          Confirm booking
        </button>
      </div>
    </div>
  );
}
