require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const env = require("../config/env");

const schedule = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 60 },
  { dayOfWeek: 1, startTime: "14:00", endTime: "17:00", slotDurationMinutes: 60 },
  { dayOfWeek: 2, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 60 },
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 60 },
  { dayOfWeek: 5, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 60 },
];

async function seed() {
  await mongoose.connect(env.mongoUri);
  await User.deleteMany({});
  await DoctorProfile.deleteMany({});

  const admin = await User.create({
    name: "Admin User",
    email: "admin@medibook.com",
    phone: "9000000000",
    password: "admin123",
    role: "admin",
  });

  const patient = await User.create({
    name: "John Patient",
    email: "patient@medibook.com",
    phone: "9000000001",
    password: "patient123",
    role: "patient",
  });

  const doctors = [
    {
      name: "Dr. Sarah Mitchell",
      email: "sarah@medibook.com",
      specialization: "Cardiology",
      department: "Heart Care",
      fee: 800,
    },
    {
      name: "Dr. Raj Patel",
      email: "raj@medibook.com",
      specialization: "Orthopedics",
      department: "Bone & Joint",
      fee: 600,
    },
    {
      name: "Dr. Emily Chen",
      email: "emily@medibook.com",
      specialization: "Pediatrics",
      department: "Child Health",
      fee: 500,
    },
  ];

  for (const d of doctors) {
    const user = await User.create({
      name: d.name,
      email: d.email,
      phone: `9000000${Math.floor(Math.random() * 900 + 100)}`,
      password: "doctor123",
      role: "doctor",
    });
    await DoctorProfile.create({
      user: user._id,
      specialization: d.specialization,
      department: d.department,
      qualification: "MD",
      experienceYears: 10,
      consultationFee: d.fee,
      schedule,
      ratingAverage: 4.5,
      ratingCount: 12,
    });
  }

  console.log("Seed complete:");
  console.log("  Admin:   admin@medibook.com / admin123");
  console.log("  Patient: patient@medibook.com / patient123");
  console.log("  Doctors: *@medibook.com / doctor123");
  await mongoose.disconnect();
}

seed().catch(console.error);
