import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { searchDoctors } from "../store/slices/doctorSlice";
import { formatDoctorAvailableDays } from "../utils/scheduleDays";
import Avatar from "../components/ui/Avatar";

export default function Home() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.doctors);
  const { user } = useSelector((s) => s.auth);
  const [query, setQuery] = useState("");
  const [specFilter, setSpecFilter] = useState("");

  useEffect(() => {
    dispatch(searchDoctors({}));
  }, [dispatch]);

  // Collect unique specializations for the dropdown
  const specializations = useMemo(
    () => [...new Set(list.map((d) => d.specialization).filter(Boolean))].sort(),
    [list]
  );

  // Client-side filter on top of the full list
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return list.filter((doc) => {
      const matchesQuery =
        !q ||
        doc.user.name.toLowerCase().includes(q) ||
        doc.specialization?.toLowerCase().includes(q) ||
        doc.department?.toLowerCase().includes(q);
      const matchesSpec = !specFilter || doc.specialization === specFilter;
      return matchesQuery && matchesSpec;
    });
  }, [list, query, specFilter]);

  return (
    <div className="page-shell">
      {/* ── Hero ── */}
      <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-surface-50 p-8 shadow-soft">
        <p className="badge mb-3">Welcome, {user?.name}</p>
        <h1 className="page-title">Book your appointment</h1>
        <p className="page-subtitle max-w-2xl">
          Each doctor lists the days they work. Up to 3 patients share each hourly slot. Slots update in
          real time; you receive email and SMS when your booking is confirmed or if the queue time changes.
        </p>
      </div>

      {/* ── Search bar ── */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Text search */}
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search by name, specialization, or department…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Specialization dropdown */}
        <select
          className="input-field sm:w-56"
          value={specFilter}
          onChange={(e) => setSpecFilter(e.target.value)}
        >
          <option value="">All specializations</option>
          {specializations.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Clear */}
        {(query || specFilter) && (
          <button
            type="button"
            className="btn-secondary shrink-0 py-2 text-sm"
            onClick={() => { setQuery(""); setSpecFilter(""); }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Results header ── */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-ink">
          {query || specFilter ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}` : "Available doctors"}
        </h2>
        <Link to="/doctors" className="text-sm font-medium text-primary-600 hover:text-primary-800">
          Advanced search →
        </Link>
      </div>

      {/* ── Doctor cards ── */}
      {loading ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-52 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mt-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-700">No doctors match your search</p>
          <p className="mt-2 text-sm text-slate-500">Try a different name or clear the filters.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => {
            const days = formatDoctorAvailableDays(doc.schedule);
            return (
              <div key={doc._id} className="card-hover flex flex-col">
                <div className="flex items-start gap-4">
                  <Avatar name={doc.user.name} size="md" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-brand-ink truncate">{doc.user.name}</h3>
                    <p className="text-sm text-primary-700">{doc.specialization}</p>
                    <p className="text-sm text-brand-soft">{doc.department}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-primary-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-primary-800">Available days</p>
                  <p className="mt-1 text-sm font-medium text-brand-ink" title={days.full}>
                    {days.short}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-surface-200 pt-4">
                  <span className="badge">★ {doc.ratingAverage}</span>
                  <span className="font-semibold text-primary-700">₹{doc.consultationFee}</span>
                </div>
                <Link
                  to={`/book/${doc.user._id}`}
                  className="btn-primary mt-4 w-full py-2.5 text-center text-sm"
                >
                  Book slot
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/patient" className="btn-secondary">
          My appointments
        </Link>
      </div>
    </div>
  );
}
