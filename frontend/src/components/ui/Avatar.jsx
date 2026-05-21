export default function Avatar({ name, size = "md", className = "" }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const sizes = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
  };
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-primary-500 font-semibold text-white shadow-soft ${sizes[size]} ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
