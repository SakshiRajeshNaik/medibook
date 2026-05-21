import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointments } from "../store/slices/appointmentSlice";
import api from "../services/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Profile editor ────────────────────────────────────────────────────────────
function ProfileEditor({ profile, onSaved }) {
  const [form, setForm] = useState({
    specialization: profile?.specialization || "",
    department: profile?.department || "",
    qualification: profile?.qualification || "",
    experienceYears: profile?.experienceYears ?? "",
    bio: profile?.bio || "",
    consultationFee: profile?.consultationFee ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await api.patch("/doctors/profile/me", {
        ...form,
        experienceYears: form.experienceYears !== "" ? Number(form.experienceYears) : undefined,
        consultationFee: form.consultationFee !== "" ? Number(form.consultationFee) : undefined,
      });
      setMsg("Profile saved successfully.");
      onSaved();
    } catch {
      setMsg("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="input-label">Specialization</label>
        <input className="input-field" value={form.specialization} onChange={set("specialization")} placeholder="e.g. Cardiology" />
      </div>
      <div>
        <label className="input-label">Department</label>
        <input className="input-field" value={form.department} onChange={set("department")} placeholder="e.g. Cardiac Sciences" />
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
      {msg && (
        <p className={`md:col-span-2 text-sm font-medium ${msg.includes("success") ? "text-emerald-600" : "text-red-600"}`}>
          {msg}
        </p>
      )}
      <div className="md:col-span-2">
        <button type="button" className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

// ── Availability toggle ───────────────────────────────────────────────────────
function AvailabilityToggle({ profile, onChanged }) {
  const [loading, setLoading] = useState(false);
  const isAvailable = profile?.isAvailable ?? true;

  const toggle = async () => {
    setLoading(true);
    try {
      await api.patch("/doctors/profile/schedule", { isAvailable: !isAvailable });
      onChanged();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-slate-600">
        You are currently{" "}
        <span className={`font-bold ${isAvailable ? "text-emerald-600" : "text-slate-500"}`}>
          {isAvailable ? "available" : "unavailable"}
        </span>{" "}
        for new bookings.
      </span>
      <button
        type="button"
        disabled={loading}
        onClick={toggle}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          isAvailable
            ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
        }`}
      >
        {loading ? "Updating…" : isAvailable ? "Go unavailable" : "Go available"}
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const dispatch = useDispatch();
  const { list } = useSelector((s) => s.appointments);
  const { profile: reduxProfile } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(reduxProfile);
  const [queue, setQueue] = useState([]);
  const [schedule, setSchedule] = useState(reduxProfile?.schedule || []);
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
    if (reduxProfile?.schedule) setSchedule(reduxProfile.schedule);
    setProfile(reduxProfile);
  }, [reduxProfile]);

  const refreshProfile = async () => {
    const { data } = await api.get("/auth/me");
    setProfile(data.profile);
    if (data.profile?.schedule) setSchedule(data.profile.schedule);
  };

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

  const adjustTiming = async (id, payload) => {
    await api.patch(`/appointments/${id}/status`, payload);
    dispatch(fetchAppointments());
    alert("Patients notified of the updated slot timing.");
  };

  const saveSchedule = async () => {
    await api.patch("/doctors/profile/schedule", { schedule });
    alert("Schedule updated");
  };

  const [rxMsg, setRxMsg] = useState({ text: "", ok: true });

  const emptyMed = () => ({ name: "", dosage: "", frequency: "", duration: "" });

  const setMed = (i, field, value) => {
    const meds = rxForm.medicines.map((m, idx) => idx === i ? { ...m, [field]: value } : m);
    setRxForm({ ...rxForm, medicines: meds });
  };

  const addMed = () => setRxForm({ ...rxForm, medicines: [...rxForm.medicines, emptyMed()] });

  const removeMed = (i) => {
    if (rxForm.medicines.length === 1) return;
    setRxForm({ ...rxForm, medicines: rxForm.medicines.filter((_, idx) => idx !== i) });
  };

  const createPrescription = async () => {
    setRxMsg({ text: "", ok: true });
    try {
      await api.post("/prescriptions", rxForm);
      setRxForm({ appointmentId: "", diagnosis: "", medicines: [emptyMed()], notes: "" });
      setRxMsg({ text: "Prescription created successfully.", ok: true });
    } catch (err) {
      setRxMsg({ text: err.response?.data?.message || "Failed to create prescription.", ok: false });
    }
  };

  return (
    <div className="page-shell">
      <div className="border-b border-slate-200/80 pb-8">
        <p className="badge-accent mb-2 w-fit">Clinician</p>
        <h1 className="page-title">Doctor workspace</h1>
        <p className="page-subtitle">Manage your profile, visits, queue, schedule, and prescriptions.</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">

        {/* ── My Profile ── */}
        <section className="card border-slate-100 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <h2 className="text-lg font-bold text-brand-ink">My profile</h2>
            <AvailabilityToggle profile={profile} onChanged={refreshProfile} />
          </div>
          <ProfileEditor profile={profile} onSaved={refreshProfile} />
        </section>

        {/* ── Appointments ── */}
        <section className="card border-slate-100">
          <h2 className="text-lg font-bold text-brand-ink">Appointments</h2>
          <ul className="mt-5 space-y-3">
            {list.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-400">No appointments yet.</li>
            )}
            {list.map((a) => (
              <li
                key={a._id}
                className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-4"
              >
                <p className="font-semibold text-brand-ink">{a.patient?.name}</p>
                <p className="text-sm text-slate-500">
                  {a.date} · {a.time} · Queue #{a.queuePosition}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary-600">{a.status}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-primary py-2 text-xs"
                    onClick={() => {
                      loadQueue(a.doctor?._id || a.doctor, a.date, a.time);
                      advanceQueue(a._id);
                    }}
                  >
                    Start visit
                  </button>
                  <button type="button" className="btn-secondary py-2 text-xs" onClick={() => complete(a._id)}>
                    Mark complete
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900"
                    onClick={() => adjustTiming(a._id, { delayMinutes: 10 })}
                  >
                    +10 min delay
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-primary-200 bg-primary-50 px-2 py-1 text-xs text-primary-800"
                    onClick={() => adjustTiming(a._id, { earlyMinutes: 5 })}
                  >
                    5 min early
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Live queue ── */}
        <section className="card border-slate-100">
          <h2 className="text-lg font-bold text-brand-ink">Live queue</h2>
          <p className="mt-1 text-sm text-slate-500">Updates when you start a visit from the list.</p>
          <ul className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm">
            {queue.length === 0 && <li className="py-6 text-center text-slate-400">Queue will appear here.</li>}
            {queue.map((q) => (
              <li key={q._id} className="flex justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                <span className="font-medium text-brand-ink">#{q.queuePosition}</span>
                <span>{q.patient?.name}</span>
                <span className="text-slate-500">{q.status}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Schedule ── */}
        <section className="card border-slate-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-brand-ink">Weekly schedule (JSON)</h2>
          <p className="mt-1 text-xs text-slate-500">Days: {DAYS.map((d, i) => `${i}=${d}`).join(", ")}</p>
          <textarea
            className="input-field mt-3 font-mono text-xs leading-relaxed"
            rows={8}
            value={JSON.stringify(schedule, null, 2)}
            onChange={(e) => {
              try {
                setSchedule(JSON.parse(e.target.value));
              } catch {
                /* ignore parse errors while typing */
              }
            }}
          />
          <button type="button" className="btn-primary mt-3" onClick={saveSchedule}>
            Save schedule
          </button>
        </section>

        {/* ── Issue prescription ── */}
        <section className="card border-slate-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-brand-ink">Issue prescription</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {/* Appointment */}
            <div className="md:col-span-2">
              <label className="input-label">Appointment *</label>
              <select
                className="input-field"
                value={rxForm.appointmentId}
                onChange={(e) => setRxForm({ ...rxForm, appointmentId: e.target.value })}
              >
                <option value="">Select appointment…</option>
                {list.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.patient?.name} — {a.date} at {a.time}
                  </option>
                ))}
              </select>
            </div>

            {/* Diagnosis */}
            <div className="md:col-span-2">
              <label className="input-label">Diagnosis *</label>
              <input
                className="input-field"
                placeholder="e.g. Viral fever, Hypertension"
                value={rxForm.diagnosis}
                onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })}
              />
            </div>
          </div>

          {/* Medicines */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-ink">
                Medicines
                <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
                  {rxForm.medicines.length}
                </span>
              </p>
              <button
                type="button"
                onClick={addMed}
                className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add medicine
              </button>
            </div>

            <div className="space-y-4">
              {rxForm.medicines.map((med, i) => (
                <div
                  key={i}
                  className="relative rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  {/* Medicine number badge */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Medicine {i + 1}
                    </span>
                    {rxForm.medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMed(i)}
                        className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2 lg:col-span-2">
                      <label className="input-label">Medicine name *</label>
                      <input
                        className="input-field"
                        placeholder="e.g. Paracetamol"
                        value={med.name}
                        onChange={(e) => setMed(i, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="input-label">Dosage *</label>
                      <input
                        className="input-field"
                        placeholder="e.g. 500mg"
                        value={med.dosage}
                        onChange={(e) => setMed(i, "dosage", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="input-label">Frequency *</label>
                      <select
                        className="input-field"
                        value={med.frequency}
                        onChange={(e) => setMed(i, "frequency", e.target.value)}
                      >
                        <option value="">Select…</option>
                        <option>Once daily</option>
                        <option>Twice daily</option>
                        <option>Three times daily</option>
                        <option>Four times daily</option>
                        <option>Every 6 hours</option>
                        <option>Every 8 hours</option>
                        <option>Every 12 hours</option>
                        <option>As needed (SOS)</option>
                        <option>At bedtime</option>
                        <option>Before meals</option>
                        <option>After meals</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="input-label">Duration *</label>
                      <input
                        className="input-field"
                        placeholder="e.g. 5 days, 2 weeks, 1 month"
                        value={med.duration}
                        onChange={(e) => setMed(i, "duration", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="input-label">Additional notes</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="e.g. Take with food, avoid alcohol, rest advised…"
              value={rxForm.notes}
              onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })}
            />
          </div>

          {rxMsg.text && (
            <p className={`mt-3 text-sm font-medium ${rxMsg.ok ? "text-emerald-600" : "text-red-600"}`}>
              {rxMsg.text}
            </p>
          )}

          <button
            type="button"
            className="btn-primary mt-4"
            onClick={createPrescription}
            disabled={!rxForm.appointmentId || !rxForm.diagnosis}
          >
            Issue prescription
          </button>
        </section>
      </div>
    </div>
  );
}
