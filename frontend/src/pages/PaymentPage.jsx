import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const CARD_BRANDS = [
  { name: "Visa", color: "from-blue-600 to-blue-800", logo: "VISA" },
  { name: "Mastercard", color: "from-red-500 to-orange-500", logo: "MC" },
  { name: "RuPay", color: "from-emerald-600 to-teal-700", logo: "RuPay" },
];

function CardPreview({ number, name, expiry, brand }) {
  const b = CARD_BRANDS.find((c) => c.name === brand) || CARD_BRANDS[0];
  const display = number.replace(/\D/g, "").padEnd(16, "·").match(/.{1,4}/g)?.join(" ") || "•••• •••• •••• ••••";
  return (
    <div className={`relative h-44 w-full overflow-hidden rounded-2xl bg-gradient-to-br ${b.color} p-6 text-white shadow-xl`}>
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-6 h-40 w-40 rounded-full bg-white/10" />
      {/* Chip */}
      <div className="relative mb-4 flex items-center justify-between">
        <div className="h-8 w-11 rounded-md bg-yellow-300/80" />
        <span className="text-lg font-black tracking-widest opacity-90">{b.logo}</span>
      </div>
      <p className="relative font-mono text-lg tracking-widest">{display}</p>
      <div className="relative mt-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest opacity-60">Card holder</p>
          <p className="text-sm font-semibold uppercase tracking-wide">{name || "YOUR NAME"}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest opacity-60">Expires</p>
          <p className="text-sm font-semibold">{expiry || "MM/YY"}</p>
        </div>
      </div>
    </div>
  );
}

function formatCard(val) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val) {
  const d = val.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export default function PaymentPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("method"); // method | card | processing | done
  const [method, setMethod] = useState("card");
  const [brand, setBrand] = useState("Visa");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [upi, setUpi] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.post("/payments/checkout", { appointmentId })
      .then((r) => setCheckout(r.data))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const runMockPay = async () => {
    setStep("processing");
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 2000));
    try {
      await api.post("/payments/mock-confirm", { paymentId: checkout.paymentId, appointmentId });
      setStep("done");
      setTimeout(() => navigate("/patient"), 2500);
    } catch {
      setError("Payment failed. Please try again.");
      setStep("card");
    }
  };

  const handleCardPay = (e) => {
    e.preventDefault();
    if (card.number.replace(/\s/g, "").length < 16) return setError("Enter a valid 16-digit card number.");
    if (!card.name.trim()) return setError("Enter the cardholder name.");
    if (card.expiry.length < 5) return setError("Enter a valid expiry date.");
    if (card.cvv.length < 3) return setError("Enter a valid CVV.");
    setError("");
    runMockPay();
  };

  const handleUpiPay = (e) => {
    e.preventDefault();
    if (!upi.includes("@")) return setError("Enter a valid UPI ID (e.g. name@upi).");
    setError("");
    runMockPay();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-slate-500">Preparing secure checkout…</p>
        </div>
      </div>
    );
  }

  const amount = checkout?.amount ?? 0;

  // ── Processing screen ──
  if (step === "processing") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary-200 opacity-60" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 shadow-lg">
            <svg className="h-8 w-8 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-brand-ink">Processing payment…</p>
          <p className="mt-1 text-sm text-slate-500">Please don't close this window.</p>
        </div>
      </div>
    );
  }

  // ── Success screen ──
  if (step === "done") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-lg">
          <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-2xl font-extrabold text-brand-ink">Payment successful!</p>
          <p className="mt-2 text-sm text-slate-500">₹{amount} paid · Redirecting to your appointments…</p>
        </div>
      </div>
    );
  }

  // ── Real Stripe ──
  if (!checkout?.mock) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="card max-w-sm w-full text-center">
          <p className="text-lg font-bold text-brand-ink">Pay ₹{amount}</p>
          <a href={checkout.checkoutUrl} className="btn-primary mt-6 block w-full py-3 text-center text-base">
            Pay with Stripe
          </a>
        </div>
      </div>
    );
  }

  // ── Demo payment UI ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-primary-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 shadow-lg">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Secure Checkout</h1>
          <p className="mt-1 text-sm text-slate-500">MediBook · Demo Mode</p>
        </div>

        {/* Amount card */}
        <div className="mb-6 rounded-2xl border border-primary-100 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Consultation fee</span>
            <span className="text-xl font-extrabold text-brand-ink">₹{amount}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Appointment #{appointmentId?.slice(-6).toUpperCase()}</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 font-semibold">Secured</span>
          </div>
        </div>

        {/* Method selector */}
        {step === "method" && (
          <div className="card space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Choose payment method</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "card", label: "Card", icon: "💳" },
                { id: "upi", label: "UPI", icon: "📱" },
                { id: "netbanking", label: "Net Banking", icon: "🏦" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 text-xs font-semibold transition ${
                    method === m.id
                      ? "border-primary-500 bg-primary-50 text-primary-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-primary-200"
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-primary w-full py-3"
              onClick={() => setStep(method === "netbanking" ? "processing" : method)}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Card form */}
        {step === "card" && (
          <div className="card space-y-5">
            {/* Brand selector */}
            <div className="flex gap-2">
              {CARD_BRANDS.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => setBrand(b.name)}
                  className={`flex-1 rounded-lg border-2 py-1.5 text-xs font-bold transition ${
                    brand === b.name ? "border-primary-500 bg-primary-50 text-primary-800" : "border-slate-200 text-slate-500"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {/* Live card preview */}
            <CardPreview number={card.number} name={card.name} expiry={card.expiry} brand={brand} />

            <form onSubmit={handleCardPay} className="space-y-4">
              <div>
                <label className="input-label">Card number</label>
                <input
                  className="input-field font-mono tracking-widest"
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  maxLength={19}
                  onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })}
                />
              </div>
              <div>
                <label className="input-label">Cardholder name</label>
                <input
                  className="input-field uppercase"
                  placeholder="AS ON CARD"
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Expiry</label>
                  <input
                    className="input-field font-mono"
                    placeholder="MM/YY"
                    value={card.expiry}
                    maxLength={5}
                    onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="input-label">CVV</label>
                  <input
                    className="input-field font-mono"
                    placeholder="•••"
                    type="password"
                    maxLength={4}
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full py-3 text-base">
                Pay ₹{amount}
              </button>
              <button type="button" className="w-full text-center text-sm text-slate-400 hover:text-slate-600" onClick={() => setStep("method")}>
                ← Back
              </button>
            </form>
          </div>
        )}

        {/* UPI form */}
        {step === "upi" && (
          <div className="card space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-primary-50 px-4 py-3">
              <span className="text-3xl">📱</span>
              <div>
                <p className="font-semibold text-brand-ink">Pay via UPI</p>
                <p className="text-xs text-slate-500">Enter your UPI ID to pay instantly</p>
              </div>
            </div>
            <form onSubmit={handleUpiPay} className="space-y-4">
              <div>
                <label className="input-label">UPI ID</label>
                <input
                  className="input-field"
                  placeholder="yourname@upi"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                />
              </div>
              {/* Quick UPI options */}
              <div className="grid grid-cols-3 gap-2">
                {["@okaxis", "@ybl", "@paytm"].map((suffix) => (
                  <button
                    key={suffix}
                    type="button"
                    onClick={() => setUpi((v) => v.split("@")[0] + suffix)}
                    className="rounded-lg border border-slate-200 py-1.5 text-xs text-slate-600 hover:border-primary-300 hover:bg-primary-50"
                  >
                    {suffix}
                  </button>
                ))}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full py-3 text-base">
                Pay ₹{amount}
              </button>
              <button type="button" className="w-full text-center text-sm text-slate-400 hover:text-slate-600" onClick={() => setStep("method")}>
                ← Back
              </button>
            </form>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">
          🔒 Demo mode — no real charges · All data is simulated
        </p>
      </div>
    </div>
  );
}
