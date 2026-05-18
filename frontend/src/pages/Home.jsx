import { Link } from "react-router-dom";

const features = [
  {
    title: "Live slot locking",
    desc: "Hold a time briefly while you pay—fewer double bookings and a calmer queue.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Video consult",
    desc: "Join your doctor in a secure room from your dashboard—no extra apps required.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Digital prescriptions",
    desc: "Download clear PDF prescriptions after your visit—easy to share with pharmacies.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div className="pointer-events-none absolute inset-0 bg-hero-mesh opacity-90" />
        <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="badge mb-6 border border-white/20 bg-white/10 text-white backdrop-blur">
              Trusted scheduling for patients &amp; clinicians
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Care that fits{" "}
              <span className="bg-gradient-to-r from-sky-200 to-teal-200 bg-clip-text text-transparent">
                your calendar
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
              Search specialists, book in seconds, pay securely, and stay updated with real-time notifications—one calm
              experience from booking to follow-up.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/doctors"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary-800 shadow-soft transition hover:bg-primary-50 hover:shadow-glow"
              >
                Browse doctors
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:border-white/50 hover:bg-white/10"
              >
                Create free account
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { n: "24/7", l: "Self-service booking" },
              { n: "3 roles", l: "Patient · Doctor · Admin" },
              { n: "Secure", l: "JWT & encrypted traffic" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur-md"
              >
                <p className="text-2xl font-bold text-white">{s.n}</p>
                <p className="mt-1 text-sm text-slate-300">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative -mt-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-hover group relative overflow-hidden border-slate-100 bg-gradient-to-b from-white to-slate-50/80 p-8"
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary-50 p-3 text-primary-600 transition group-hover:bg-primary-100 group-hover:text-primary-700">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-brand-navy">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell pb-16 pt-12 text-center">
        <div className="card mx-auto max-w-2xl border-primary-100 bg-gradient-to-br from-primary-50/80 to-white p-10 shadow-glow">
          <h2 className="text-2xl font-bold text-brand-navy">Ready for your next visit?</h2>
          <p className="mt-3 text-slate-600">Join thousands of patients who book online in under a minute.</p>
          <Link to="/doctors" className="btn-primary mt-8 px-10">
            Get started
          </Link>
        </div>
      </section>
    </div>
  );
}
