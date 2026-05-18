import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function PaymentPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .post("/payments/checkout", { appointmentId })
      .then((r) => setCheckout(r.data))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const payMock = async () => {
    await api.post("/payments/mock-confirm", {
      paymentId: checkout.paymentId,
      appointmentId,
    });
    navigate("/patient");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm font-medium text-slate-500">Preparing secure checkout…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-12rem)] overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-brand-navy px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-hero-mesh opacity-40" />
      <div className="relative mx-auto max-w-md">
        <div className="card border-0 bg-white/95 p-8 shadow-glow backdrop-blur">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-soft">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-center text-2xl font-bold text-brand-navy">Complete payment</h1>
          <p className="mt-2 text-center text-sm text-slate-500">Your appointment is reserved pending payment.</p>

          {checkout?.mock ? (
            <div className="mt-8">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
                Demo mode — Stripe keys not set. Use mock payment to continue.
              </div>
              <button type="button" className="btn-primary mt-6 w-full py-3.5 text-base" onClick={payMock}>
                Pay now (demo)
              </button>
            </div>
          ) : (
            <a href={checkout.checkoutUrl} className="btn-primary mt-8 block w-full py-3.5 text-center text-base">
              Pay with Stripe
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
