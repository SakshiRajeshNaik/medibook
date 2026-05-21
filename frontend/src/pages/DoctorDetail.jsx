import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDoctor } from "../store/slices/doctorSlice";
import Avatar from "../components/ui/Avatar";

export default function DoctorDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selected } = useSelector((s) => s.doctors);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchDoctor(id));
  }, [dispatch, id]);

  if (!selected) {
    return (
      <div className="page-shell flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm font-medium text-slate-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  const doc = selected;

  return (
    <div className="page-shell max-w-3xl">
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card">
        <div className="h-32 bg-gradient-to-r from-primary-100 via-primary-50 to-accent-100" />
        <div className="relative px-6 pb-8 sm:px-10">
          <div className="-mt-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <Avatar name={doc.user.name} size="lg" className="ring-4 ring-white shadow-card" />
              <div className="text-center sm:mb-1 sm:pb-2 sm:text-left">
                <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">{doc.user.name}</h1>
                <p className="mt-1 text-primary-600">
                  {doc.specialization} · {doc.department}
                </p>
              </div>
            </div>
            {user?.role === "patient" && (
              <Link
                to={`/book/${doc.user._id}`}
                className="btn-primary shrink-0 px-8 py-3 shadow-glow sm:mb-2"
              >
                Book appointment
              </Link>
            )}
          </div>

          <p className="mt-8 leading-relaxed text-slate-600">
            {doc.bio || "Dedicated clinician focused on clear communication and evidence-based care."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="badge text-sm">★ {doc.ratingAverage} average</span>
            <span className="badge-muted">{doc.ratingCount} reviews</span>
            <span className="badge-accent">{doc.experienceYears}+ years experience</span>
            <span className="rounded-full bg-primary-500 px-4 py-1.5 text-sm font-semibold text-white">
              ₹{doc.consultationFee} consult
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
