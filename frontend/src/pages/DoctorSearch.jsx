import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { searchDoctors } from "../store/slices/doctorSlice";
import Avatar from "../components/ui/Avatar";

export default function DoctorSearch() {
  const [filters, setFilters] = useState({ search: "", specialization: "", department: "" });
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.doctors);

  useEffect(() => {
    dispatch(searchDoctors(filters));
  }, [dispatch, filters]);

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-2 border-b border-slate-200/80 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="badge mb-2">Directory</p>
          <h1 className="page-title">Find your doctor</h1>
          <p className="page-subtitle max-w-xl">
            Filter by specialty or department. Every profile shows experience, ratings, and consultation fee at a glance.
          </p>
        </div>
      </div>

      <div className="card mt-8 border-slate-100 shadow-soft">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Search &amp; filters</p>
        <div className="grid gap-4 md:grid-cols-3">
          <input
            className="input-field"
            placeholder="Name or keyword…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Specialization"
            value={filters.specialization}
            onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Department"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-48 p-6">
              <div className="skeleton mb-4 h-14 w-14 rounded-2xl" />
              <div className="skeleton mb-2 h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card mt-10 py-16 text-center">
          <p className="text-lg font-semibold text-slate-700">No doctors match your filters</p>
          <p className="mt-2 text-sm text-slate-500">Try clearing a field or broadening your search.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((doc) => (
            <Link
              key={doc._id}
              to={`/doctors/${doc.user._id}`}
              className="card-hover group flex flex-col gap-4 border-slate-100 p-0"
            >
              <div className="flex items-start gap-4 p-6 pb-0">
                <Avatar name={doc.user.name} size="md" className="shadow-soft" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-brand-ink group-hover:text-primary-700">
                    {doc.user.name}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-primary-600">{doc.specialization}</p>
                  <p className="text-sm text-slate-500">{doc.department}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-6 py-4">
                <span className="badge-accent">★ {doc.ratingAverage}</span>
                <span className="badge-muted">{doc.ratingCount} reviews</span>
                <span className="ml-auto text-base font-bold text-brand-ink">₹{doc.consultationFee}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
