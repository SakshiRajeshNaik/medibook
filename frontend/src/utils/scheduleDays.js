const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatDoctorAvailableDays(schedule) {
  if (!schedule?.length) return { short: "Schedule TBA", full: "Contact hospital for availability" };
  const days = [...new Set(schedule.map((s) => s.dayOfWeek))].sort((a, b) => a - b);
  return {
    short: days.map((d) => DAY_SHORT[d]).join(", "),
    full: days.map((d) => DAY_NAMES[d]).join(", "),
  };
}

export function isDateOnDoctorSchedule(schedule, dateStr) {
  if (!schedule?.length) return true;
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  return schedule.some((s) => s.dayOfWeek === day);
}
