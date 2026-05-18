const Appointment = require("../models/Appointment");
const SlotLock = require("../models/SlotLock");
const DoctorProfile = require("../models/DoctorProfile");
const env = require("../config/env");

const DEFAULT_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

function parseTime(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generateSlotsFromSchedule(schedule, dayOfWeek) {
  const daySchedule = schedule.filter((s) => s.dayOfWeek === dayOfWeek);
  const slots = new Set();
  for (const block of daySchedule) {
    let start = parseTime(block.startTime);
    const end = parseTime(block.endTime);
    const step = block.slotDurationMinutes || 60;
    while (start + step <= end) {
      slots.add(formatTime(start));
      start += step;
    }
  }
  if (slots.size === 0) return DEFAULT_SLOTS;
  return [...slots].sort((a, b) => parseTime(a) - parseTime(b));
}

exports.getAvailableSlots = async (doctorUserId, date) => {
  const profile = await DoctorProfile.findOne({ user: doctorUserId });
  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  const allSlots =
    profile?.schedule?.length > 0
      ? generateSlotsFromSchedule(profile.schedule, dayOfWeek)
      : DEFAULT_SLOTS;

  const booked = await Appointment.find({
    doctor: doctorUserId,
    date,
    status: { $nin: ["cancelled"] },
  }).select("time");

  const locks = await SlotLock.find({
    doctor: doctorUserId,
    date,
    expiresAt: { $gt: new Date() },
  }).select("time lockedBy");

  const bookedTimes = new Set(booked.map((b) => b.time));
  const lockMap = new Map(locks.map((l) => [l.time, l.lockedBy.toString()]));

  return allSlots.map((time) => ({
    time,
    available: !bookedTimes.has(time),
    locked: lockMap.has(time),
    lockedByYou: false,
  }));
};

exports.lockSlot = async (doctorId, date, time, userId) => {
  const existing = await Appointment.findOne({
    doctor: doctorId,
    date,
    time,
    status: { $nin: ["cancelled"] },
  });
  if (existing) throw new Error("Slot already booked");

  const expiresAt = new Date(Date.now() + env.slotLockMinutes * 60 * 1000);
  await SlotLock.findOneAndUpdate(
    { doctor: doctorId, date, time },
    { lockedBy: userId, expiresAt },
    { upsert: true, new: true }
  );
  return { expiresAt, minutes: env.slotLockMinutes };
};

exports.releaseSlot = async (doctorId, date, time, userId) => {
  await SlotLock.deleteOne({ doctor: doctorId, date, time, lockedBy: userId });
};

exports.releaseUserLocks = async (userId) => {
  await SlotLock.deleteMany({ lockedBy: userId });
};

exports.findSuggestions = async (doctorId, date, preferredTime) => {
  const slots = await exports.getAvailableSlots(doctorId, date);
  const available = slots.filter((s) => s.available && !s.locked).map((s) => s.time);
  if (available.includes(preferredTime)) return available;
  const pref = parseTime(preferredTime);
  return available.sort((a, b) => Math.abs(parseTime(a) - pref) - Math.abs(parseTime(b) - pref));
};
