import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDoctor, fetchSlots } from "../store/slices/doctorSlice";
import { bookAppointment, lockSlot, fetchAppointments } from "../store/slices/appointmentSlice";
import Avatar from "../components/ui/Avatar";

export default function BookAppointment() {
  const { doctorId } = useParams();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selected, slots } = useSelector((s) => s.doctors);
  const { bookingError, suggestions } = useSelector((s) => s.appointments);

  useEffect(() => {
    dispatch(fetchDoctor(doctorId));
  }, [dispatch, doctorId]);

  useEffect(() => {
    if (date) dispatch(fetchSlots({ doctorId, date }));
  }, [dispatch, doctorId, date]);

  const handleSelectSlot = async (slotTime) => {
    setTime(slotTime);
    await dispatch(lockSlot({ doctorId, date, time: slotTime }));
  };

  const handleBook = async () => {
    const result = await dispatch(bookAppointment({ doctorId, date, time, reason }));
    if (bookAppointment.fulfilled.match(result)) {
      dispatch(fetchAppointments());
      navigate(`/payment/${result.payload._id}`);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="page-shell max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <Avatar name={selected?.user?.name || "Dr"} size="md" />
        <div>
          <p className="badge mb-1 w-fit">Booking</p>
          <h1 className="page-title text-xl sm:text-2xl">Book with {selected?.user?.name || "…"}</h1>
          <p className="page-subtitle">Pick a date, choose an open slot, then confirm.</p>
        </div>
      </div>

      <div className="card space-y-6 border-slate-100 shadow-glow">
        <div>
          <label className="input-label" htmlFor="appt-date">
            Preferred date
          </label>
          <input
            id="appt-date"
            type="date"
            className="input-field"
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {date && (
          <div>
            <p className="input-label">Available times</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {slots.map((s) => {
                const taken = !s.available || s.locked;
                const active = time === s.time;
                return (
                  <button
                    key={s.time}
                    type="button"
                    disabled={taken}
                    onClick={() => handleSelectSlot(s.time)}
                    className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-primary-500 bg-primary-50 text-primary-900 shadow-soft"
                        : "border-slate-100 bg-slate-50/80 text-slate-700 hover:border-primary-200 hover:bg-white"
                    } ${taken ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">Unavailable slots are crossed out. Selected slot is held briefly.</p>
          </div>
        )}

        <div>
          <label className="input-label" htmlFor="reason">
            Reason for visit
          </label>
          <textarea
            id="reason"
            className="input-field min-h-[100px] resize-y"
            placeholder="Brief symptoms or questions for your doctor…"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {bookingError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">{bookingError}</p>
            {suggestions?.length > 0 && (
              <p className="mt-2 text-amber-800">
                Nearby times: <span className="font-mono font-medium">{suggestions.join(", ")}</span>
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          className="btn-primary w-full py-3.5 text-base"
          disabled={!date || !time}
          onClick={handleBook}
        >
          Confirm booking
        </button>
      </div>
    </div>
  );
}
