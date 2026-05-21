import { Outlet } from "react-router-dom";

const FEATURES = [
  { icon: "🗓️", title: "Smart Scheduling", desc: "Book slots in real time — up to 3 patients per hour, no double-booking." },
  { icon: "🔔", title: "Instant Alerts", desc: "Email & SMS confirmations the moment your appointment is confirmed." },
  { icon: "👨‍⚕️", title: "20+ Specialists", desc: "Cardiologists, neurologists, pediatricians and more — all in one place." },
  { icon: "💊", title: "Digital Prescriptions", desc: "Doctors issue prescriptions digitally; download your PDF anytime." },
];

function LogoMark() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </div>
  );
}

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left panel — branding ── */}
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-teal-500 p-12 lg:flex">
        {/* Background decorative circles */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-40 left-10 h-48 w-48 rounded-full bg-teal-400/20" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <LogoMark />
          <span className="text-2xl font-bold tracking-tight text-white">MediBook</span>
        </div>

        {/* Hero text */}
        <div className="relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
            Healthcare made simple
          </p>
          <h2 className="text-4xl font-extrabold leading-tight text-white">
            Your health,<br />your schedule.
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-white/75">
            Book appointments with top specialists, get real-time slot updates, and receive instant confirmations — all from one platform.
          </p>

          {/* Feature list */}
          <ul className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl">
                  {f.icon}
                </span>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-white/65">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} MediBook · Trusted by patients & doctors
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-surface-50 px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-primary-700">MediBook</span>
        </div>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
