require("dotenv").config();

module.exports = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri:
    process.env.MONGODB_URI ||
    "mongodb://mongo:27017/medibook?directConnection=true",
  jwtSecret: process.env.JWT_SECRET || "medibook-dev-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:8080",
  slotLockMinutes: parseInt(process.env.SLOT_LOCK_MINUTES || "5", 10),
  consultationFee: parseInt(process.env.CONSULTATION_FEE || "500", 10),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "MediBook <noreply@medibook.local>",
  },
};
