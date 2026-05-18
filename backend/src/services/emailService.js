const nodemailer = require("nodemailer");
const env = require("../config/env");
const logger = require("../config/logger");

let transporter = null;

function getTransporter() {
  if (!env.smtp.host || !env.smtp.user) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();
  const payload = { from: env.smtp.from, to, subject, html, text: text || html.replace(/<[^>]+>/g, "") };
  if (!transport) {
    logger.info({ event: "email_mock", ...payload });
    return { mock: true };
  }
  return transport.sendMail(payload);
}

exports.sendBookingConfirmation = (user, appointment) =>
  sendEmail({
    to: user.email,
    subject: "Appointment Confirmed - MediBook",
    html: `<h2>Appointment Confirmed</h2>
      <p>Hi ${user.name},</p>
      <p>Your appointment on <strong>${appointment.date}</strong> at <strong>${appointment.time}</strong> is confirmed.</p>
      <p>Queue position: ${appointment.queuePosition}</p>`,
  });

exports.sendAppointmentUpdate = (user, title, message) =>
  sendEmail({ to: user.email, subject: title, html: `<p>${message}</p>` });

exports.sendEmail = sendEmail;
