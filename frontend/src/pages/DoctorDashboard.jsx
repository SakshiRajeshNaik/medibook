import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointments } from "../store/slices/appointmentSlice";
import api from "../services/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DoctorDashboard() {
  const dispatch = useDispatch();
  const { list } = useSelector((s) => s.appointments);
  const { profile } = useSelector((s) => s.auth);
  const [queue, setQueue] = useState([]);
  const [schedule, setSchedule] = useState(profile?.schedule || []);
  const [rxForm, setRxForm] = useState({
    appointmentId: "",
    diagnosis: "",
    medicines: [{ name: "", dosage: "", frequency: "", duration: "" }],
    notes: "",
  });

  useEffect(() => {
    dispatch(fetchAppointments());
  }, [dispatch]);

  useEffect(() => {
    if (profile?.schedule) setSchedule(profile.schedule);
  }, [profile]);

  const loadQueue = async (doctorId, date, time) => {
    const { data } = await api.get("/queue", { params: { doctorId, date, time } });
    setQueue(data.queue);
  };

  const advanceQueue = async (appointmentId) => {
    await api.post("/queue/advance", { appointmentId });
    dispatch(fetchAppointments());
  };

  const complete = async (id) => {
    await api.post(`/queue/${id}/complete`);
    dispatch(fetchAppointments());
  };

  const saveSchedule = async () => {
    await api.patch("/doctors/profile/schedule", { schedule });
    alert("Schedule updated");
  };

  const createPrescription = async () => {
    await api.post("/prescriptions", rxForm);
    alert("Prescription created");
  };

  return (
    <div className="page-shell">
      <div className="border-b border-slate-200/80 pb-8">
        <p className="badge-accent mb-2 w-fit">Clinician</p>
        <h1 className="page-title">Doctor workspace</h1>
        <p className="page-subtitle">Manage visits, queue, schedule, and prescriptions.</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="card border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy">Appointments</h2>
          <ul className="mt-5 space-y-3">
            {list.map((a) => (
              <li
                key={a._id}
                className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-4"
              >
                <p className="font-semibold text-brand-navy">{a.patient?.name}</p>
                <p className="text-sm text-slate-500">
                  {a.date} · {a.time} · Queue #{a.queuePosition}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary-600">{a.status}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-primary py-2 text-xs"
                    onClick={() => {
                      loadQueue(a.doctor._id || a.doctor, a.date, a.time);
                      advanceQueue(a._id);
                    }}
                  >
                    Start visit
                  </button>
                  <button type="button" className="btn-secondary py-2 text-xs" onClick={() => complete(a._id)}>
                    Mark complete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy">Live queue</h2>
          <p className="mt-1 text-sm text-slate-500">Updates when you start a visit from the list.</p>
          <ul className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm">
            {queue.length === 0 && <li className="py-6 text-center text-slate-400">Queue will appear here.</li>}
            {queue.map((q) => (
              <li key={q._id} className="flex justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                <span className="font-medium text-brand-navy">#{q.queuePosition}</span>
                <span>{q.patient?.name}</span>
                <span className="text-slate-500">{q.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card border-slate-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-brand-navy">Schedule (JSON)</h2>
          <p className="mt-1 text-xs text-slate-500">Days: {DAYS.join(", ")} (0 = Sunday)</p>
          <textarea
            className="input-field mt-3 font-mono text-xs leading-relaxed"
            rows={8}
            value={JSON.stringify(schedule, null, 2)}
            onChange={(e) => {
              try {
                setSchedule(JSON.parse(e.target.value));
              } catch {
                /* ignore */
              }
            }}
          />
          <button type="button" className="btn-primary mt-3" onClick={saveSchedule}>
            Save schedule
          </button>
        </section>

        <section className="card border-slate-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-brand-navy">Issue prescription</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="input-label">Appointment</label>
              <select
                className="input-field"
                value={rxForm.appointmentId}
                onChange={(e) => setRxForm({ ...rxForm, appointmentId: e.target.value })}
              >
                <option value="">Select…</option>
                {list.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.patient?.name} — {a.date}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="input-label">Diagnosis</label>
              <input
                className="input-field"
                placeholder="Clinical impression"
                value={rxForm.diagnosis}
                onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="input-label">Medicine</label>
              <input
                className="input-field"
                placeholder="Drug name"
                value={rxForm.medicines[0].name}
                onChange={(e) =>
                  setRxForm({ ...rxForm, medicines: [{ ...rxForm.medicines[0], name: e.target.value }] })
                }
              />
            </div>
          </div>
          <button type="button" className="btn-primary mt-4" onClick={createPrescription}>
            Create prescription
          </button>
        </section>
      </div>
    </div>
  );
}
