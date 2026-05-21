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

const doctors = [
  // Cardiology — 3 doctors
  { name: "Dr. Sarah Mitchell",   email: "sarah.mitchell@medibook.com",   specialization: "Cardiology",       department: "Heart Care",          qualification: "MD, DM Cardiology",      exp: 14, fee: 800,  rating: 4.8, ratingCount: 42 },
  { name: "Dr. Arjun Mehta",      email: "arjun.mehta@medibook.com",      specialization: "Cardiology",       department: "Heart Care",          qualification: "MBBS, MD, DM",           exp: 10, fee: 750,  rating: 4.6, ratingCount: 31 },
  { name: "Dr. Priya Nair",       email: "priya.nair@medibook.com",       specialization: "Cardiology",       department: "Cardiac Sciences",    qualification: "MD, Fellowship Cardio",  exp: 8,  fee: 700,  rating: 4.5, ratingCount: 28 },

  // Orthopedics — 3 doctors
  { name: "Dr. Raj Patel",        email: "raj.patel@medibook.com",        specialization: "Orthopedics",      department: "Bone & Joint",        qualification: "MS Ortho",               exp: 12, fee: 600,  rating: 4.7, ratingCount: 38 },
  { name: "Dr. Kavya Reddy",      email: "kavya.reddy@medibook.com",      specialization: "Orthopedics",      department: "Bone & Joint",        qualification: "MBBS, MS Ortho",         exp: 7,  fee: 550,  rating: 4.4, ratingCount: 22 },
  { name: "Dr. Suresh Kumar",     email: "suresh.kumar@medibook.com",     specialization: "Orthopedics",      department: "Sports Medicine",     qualification: "MS, Fellowship Sports",  exp: 9,  fee: 650,  rating: 4.6, ratingCount: 19 },

  // Pediatrics — 2 doctors
  { name: "Dr. Emily Chen",       email: "emily.chen@medibook.com",       specialization: "Pediatrics",       department: "Child Health",        qualification: "MD Pediatrics",          exp: 11, fee: 500,  rating: 4.9, ratingCount: 55 },
  { name: "Dr. Ananya Sharma",    email: "ananya.sharma@medibook.com",    specialization: "Pediatrics",       department: "Child Health",        qualification: "MBBS, DCH, MD",          exp: 6,  fee: 450,  rating: 4.5, ratingCount: 30 },

  // Neurology — 2 doctors
  { name: "Dr. Vikram Singh",     email: "vikram.singh@medibook.com",     specialization: "Neurology",        department: "Brain & Spine",       qualification: "MD, DM Neurology",       exp: 15, fee: 900,  rating: 4.8, ratingCount: 47 },
  { name: "Dr. Meera Iyer",       email: "meera.iyer@medibook.com",       specialization: "Neurology",        department: "Brain & Spine",       qualification: "MBBS, MD, DM",           exp: 9,  fee: 850,  rating: 4.6, ratingCount: 33 },

  // Dermatology — 2 doctors
  { name: "Dr. Pooja Verma",      email: "pooja.verma@medibook.com",      specialization: "Dermatology",      department: "Skin & Hair",         qualification: "MD Dermatology",         exp: 8,  fee: 600,  rating: 4.7, ratingCount: 60 },
  { name: "Dr. Rahul Gupta",      email: "rahul.gupta@medibook.com",      specialization: "Dermatology",      department: "Skin & Hair",         qualification: "MBBS, DVD, MD",          exp: 5,  fee: 550,  rating: 4.4, ratingCount: 25 },

  // Gynecology — 2 doctors
  { name: "Dr. Sunita Joshi",     email: "sunita.joshi@medibook.com",     specialization: "Gynecology",       department: "Women's Health",      qualification: "MS OBG",                 exp: 13, fee: 700,  rating: 4.8, ratingCount: 70 },
  { name: "Dr. Lakshmi Rao",      email: "lakshmi.rao@medibook.com",      specialization: "Gynecology",       department: "Women's Health",      qualification: "MBBS, DGO, MS",          exp: 7,  fee: 650,  rating: 4.5, ratingCount: 40 },

  // General Medicine — 2 doctors
  { name: "Dr. Anil Kapoor",      email: "anil.kapoor@medibook.com",      specialization: "General Medicine", department: "General OPD",         qualification: "MBBS, MD",               exp: 10, fee: 400,  rating: 4.3, ratingCount: 80 },
  { name: "Dr. Divya Menon",      email: "divya.menon@medibook.com",      specialization: "General Medicine", department: "General OPD",         qualification: "MBBS, MD",               exp: 6,  fee: 350,  rating: 4.2, ratingCount: 55 },

  // ENT — 2 doctors
  { name: "Dr. Kiran Bose",       email: "kiran.bose@medibook.com",       specialization: "ENT",              department: "Ear Nose Throat",     qualification: "MS ENT",                 exp: 11, fee: 500,  rating: 4.6, ratingCount: 35 },
  { name: "Dr. Neha Tiwari",      email: "neha.tiwari@medibook.com",      specialization: "ENT",              department: "Ear Nose Throat",     qualification: "MBBS, DLO, MS",          exp: 5,  fee: 450,  rating: 4.4, ratingCount: 20 },

  // Psychiatry — 2 doctors
  { name: "Dr. Sameer Desai",     email: "sameer.desai@medibook.com",     specialization: "Psychiatry",       department: "Mental Health",       qualification: "MD Psychiatry",          exp: 12, fee: 750,  rating: 4.7, ratingCount: 28 },
  { name: "Dr. Ritu Saxena",      email: "ritu.saxena@medibook.com",      specialization: "Psychiatry",       department: "Mental Health",       qualification: "MBBS, MD, DPM",          exp: 7,  fee: 700,  rating: 4.5, ratingCount: 18 },
];

async function seed() {
  await mongoose.connect(env.mongoUri);

  // Wipe existing data
  await User.deleteMany({});
  await DoctorProfile.deleteMany({});

  // Admin
  await User.create({
    name: "Admin User",
    email: "admin@medibook.com",
    phone: "9000000000",
    password: "admin123",
    role: "admin",
  });

  // Patients
  await User.create({
    name: "John Patient",
    email: "patient@medibook.com",
    phone: "9000000001",
    password: "patient123",
    role: "patient",
  });
  await User.create({
    name: "Priya Patient",
    email: "priya.patient@medibook.com",
    phone: "9000000002",
    password: "patient123",
    role: "patient",
  });

  // Doctors
  let phoneCounter = 100;
  for (const d of doctors) {
    const user = await User.create({
      name: d.name,
      email: d.email,
      phone: `90000${phoneCounter++}`,
      password: "doctor123",
      role: "doctor",
    });
    await DoctorProfile.create({
      user: user._id,
      specialization: d.specialization,
      department: d.department,
      qualification: d.qualification,
      experienceYears: d.exp,
      consultationFee: d.fee,
      bio: `${d.exp} years of experience in ${d.specialization}. ${d.qualification}.`,
      schedule,
      ratingAverage: d.rating,
      ratingCount: d.ratingCount,
      isAvailable: true,
    });
  }

  console.log("\n✅ Seed complete");
  console.log("─────────────────────────────────────────");
  console.log("  Admin:    admin@medibook.com   / admin123");
  console.log("  Patient:  patient@medibook.com / patient123");
  console.log(`  Doctors:  ${doctors.length} doctors seeded  / doctor123`);
  console.log("─────────────────────────────────────────\n");
  await mongoose.disconnect();
}

seed().catch(console.error);
