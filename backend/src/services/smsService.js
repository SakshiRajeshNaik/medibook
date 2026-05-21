const env = require("../config/env");
const logger = require("../config/logger");
const fs = require("fs");
const path = require("path");

let twilioClient = null;

function getTwilio() {
  if (!env.twilio.accountSid || !env.twilio.authToken) return null;
  if (!twilioClient) {
    const twilio = require("twilio");
    twilioClient = twilio(env.twilio.accountSid, env.twilio.authToken);
  }
  return twilioClient;
}

async function sendSms(to, body) {
  if (!to) return { mock: true };

  const client = getTwilio();

  if (!client || !env.twilio.phoneNumber) {
    // Write to log file AND print clearly to console
    const logPath = path.join(process.cwd(), "data", "sms-notifications.log");
    const line = `${new Date().toISOString()} | TO: ${to} | MSG: ${body}\n`;
    try {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      fs.appendFileSync(logPath, line);
    } catch { /* ignore fs errors */ }

    logger.info("─────────────────────────────────────────────");
    logger.info(`📱 SMS (demo — no Twilio configured)`);
    logger.info(`   To:  ${to}`);
    logger.info(`   Msg: ${body}`);
    logger.info("─────────────────────────────────────────────");
    return { mock: true };
  }

  try {
    const result = await client.messages.create({ body, from: env.twilio.phoneNumber, to });
    logger.info(`📱 SMS sent to ${to} — sid: ${result.sid}`);
    return result;
  } catch (err) {
    logger.error(`📱 SMS failed to ${to}: ${err.message}`);
    // Don't throw — SMS failure shouldn't break the booking flow
    return { mock: true, error: err.message };
  }
}

exports.sendBookingConfirmationSms = (phone, appointment) =>
  sendSms(
    phone,
    `MediBook: Appointment confirmed! Date: ${appointment.date} at ${appointment.time}. Queue #${appointment.queuePosition}. Amount: Rs.${appointment.amount}. See you soon!`
  );

exports.sendCancellationSms = (phone, appointment, refundInfo) =>
  sendSms(
    phone,
    refundInfo
      ? `MediBook: Appointment on ${appointment.date} at ${appointment.time} cancelled. Refund: Rs.${refundInfo.refundAmount} (10% fee deducted).`
      : `MediBook: Appointment on ${appointment.date} at ${appointment.time} has been cancelled.`
  );

exports.sendSlotUpdateSms = (phone, message) =>
  sendSms(phone, `MediBook: ${message}`);

exports.sendSms = sendSms;
