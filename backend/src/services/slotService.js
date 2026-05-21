const Appointment = require("../models/Appointment");
const SlotLock = require("../models/SlotLock");
const DoctorProfile = require("../models/DoctorProfile");
const mongoose = require("mongoose");
const env = require("../config/env");

const DEFAULT_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
const CAPACITY = env.patientsPerSlot || 3;

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

async function countBooked(doctorUserId, date, time) {
  const doctorObjId = new mongoose.Types.ObjectId(doctorUserId);
  return Appointment.countDocuments({
    doctor: doctorObjId,
    date,
    time,
    status: { $nin: ["cancelled"] },
  });
}

exports.getCapacity = () => CAPACITY;

exports.getAvailableSlots = async (doctorUserId, date) => {
  // Always work with a proper ObjectId so aggregate $match casts correctly
  const doctorObjId = new mongoose.Types.ObjectId(doctorUserId);

  const profile = await DoctorProfile.findOne({ user: doctorObjId });
  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  const allSlots =
    profile?.schedule?.length > 0
      ? generateSlotsFromSchedule(profile.schedule, dayOfWeek)
      : DEFAULT_SLOTS;

  const bookedByTime = await Appointment.aggregate([
    {
      $match: {
        doctor: doctorObjId,
        date,
        status: { $nin: ["cancelled"] },
      },
    },
    { $group: { _id: "$time", count: { $sum: 1 } } },
  ]);
  const bookedMap = new Map(bookedByTime.map((b) => [b._id, b.count]));

  const locks = await SlotLock.find({
    doctor: doctorObjId,
    date,
    expiresAt: { $gt: new Date() },
  }).select("time lockedBy");

  const lockMap = new Map(locks.map((l) => [l.time, l.lockedBy.toString()]));

  return allSlots.map((time) => {
    const booked = bookedMap.get(time) || 0;
    const remaining = Math.max(0, CAPACITY - booked);
    const locked = lockMap.has(time);
    return {
      time,
      booked,
      capacity: CAPACITY,
      remaining,
      available: remaining > 0 && !locked,
      locked,
      lockedByYou: false,
      full: remaining <= 0,
    };
  });
};

exports.lockSlot = async (doctorId, date, time, userId) => {
  const doctorObjId = new mongoose.Types.ObjectId(doctorId);
  const booked = await countBooked(doctorObjId, date, time);
  if (booked >= CAPACITY) throw new Error("Slot is full");

  const existingLock = await SlotLock.findOne({
    doctor: doctorObjId,
    date,
    time,
    expiresAt: { $gt: new Date() },
  });
  if (existingLock && existingLock.lockedBy.toString() !== userId.toString()) {
    throw new Error("Slot is temporarily locked by another user");
  }

  const expiresAt = new Date(Date.now() + env.slotLockMinutes * 60 * 1000);
  await SlotLock.findOneAndUpdate(
    { doctor: doctorObjId, date, time },
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
  const available = slots.filter((s) => s.available).map((s) => s.time);
  if (available.includes(preferredTime)) return available;
  const pref = parseTime(preferredTime);
  return available.sort((a, b) => Math.abs(parseTime(a) - pref) - Math.abs(parseTime(b) - pref));
};
