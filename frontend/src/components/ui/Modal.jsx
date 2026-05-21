export default function Modal({ open, title, message, onClose, actionLabel, onAction }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-ink/40 p-4 backdrop-blur-sm" role="dialog">
      <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-glow">
        <h2 className="text-lg font-bold text-brand-ink">{title}</h2>
        <p className="mt-2 text-sm text-brand-soft">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {actionLabel && onAction && (
            <button type="button" className="btn-primary" onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
