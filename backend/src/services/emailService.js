const nodemailer = require("nodemailer");
const env = require("../config/env");
const logger = require("../config/logger");

let transporter = null;

function getTransporter() {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) return null;
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

function baseTemplate(title, bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#0d9488);padding:28px 32px;text-align:center">
            <span style="font-size:28px">❤️</span>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px">MediBook</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px">Healthcare made simple</p>
          </td>
        </tr>
        <!-- Title -->
        <tr>
          <td style="padding:28px 32px 0">
            <h2 style="margin:0;color:#0f172a;font-size:20px;font-weight:700">${title}</h2>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:16px 32px 32px;color:#475569;font-size:15px;line-height:1.6">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center">
            <p style="margin:0;color:#94a3b8;font-size:12px">© ${new Date().getFullYear()} MediBook · This is an automated message, please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();
  const payload = {
    from: env.smtp.from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ""),
  };

  if (!transport) {
    // Log clearly so it's visible in docker logs
    logger.info("─────────────────────────────────────────────");
    logger.info(`📧 EMAIL (demo — no SMTP configured)`);
    logger.info(`   To:      ${to}`);
    logger.info(`   Subject: ${subject}`);
    logger.info(`   Body:    ${payload.text.slice(0, 200)}`);
    logger.info("─────────────────────────────────────────────");
    return { mock: true };
  }

  try {
    const result = await transport.sendMail(payload);
    logger.info(`📧 Email sent to ${to} — messageId: ${result.messageId}`);
    return result;
  } catch (err) {
    logger.error(`📧 Email failed to ${to}: ${err.message}`);
    throw err;
  }
}

exports.sendBookingConfirmation = (user, appointment) =>
  sendEmail({
    to: user.email,
    subject: "✅ Appointment Confirmed — MediBook",
    html: baseTemplate(
      "Appointment Confirmed",
      `<p>Hi <strong>${user.name}</strong>,</p>
       <p>Your appointment has been successfully booked.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0;border-radius:8px;overflow:hidden">
         <tr style="background:#f0fdf4">
           <td style="padding:10px 14px;font-weight:600;color:#166534;width:40%">Date</td>
           <td style="padding:10px 14px;color:#0f172a">${appointment.date}</td>
         </tr>
         <tr style="background:#ffffff">
           <td style="padding:10px 14px;font-weight:600;color:#166534">Time</td>
           <td style="padding:10px 14px;color:#0f172a">${appointment.time}</td>
         </tr>
         <tr style="background:#f0fdf4">
           <td style="padding:10px 14px;font-weight:600;color:#166534">Queue #</td>
           <td style="padding:10px 14px;color:#0f172a">${appointment.queuePosition}</td>
         </tr>
         <tr style="background:#ffffff">
           <td style="padding:10px 14px;font-weight:600;color:#166534">Amount</td>
           <td style="padding:10px 14px;color:#0f172a">₹${appointment.amount}</td>
         </tr>
       </table>
       <p style="color:#64748b;font-size:13px">A confirmation was also sent to your registered phone number.</p>
       <p>See you soon! 🏥</p>`
    ),
  });

exports.sendCancellationConfirmation = (user, appointment, refundInfo) =>
  sendEmail({
    to: user.email,
    subject: "❌ Appointment Cancelled — MediBook",
    html: baseTemplate(
      "Appointment Cancelled",
      `<p>Hi <strong>${user.name}</strong>,</p>
       <p>Your appointment on <strong>${appointment.date}</strong> at <strong>${appointment.time}</strong> has been cancelled.</p>
       ${refundInfo ? `
       <table style="width:100%;border-collapse:collapse;margin:16px 0;border-radius:8px;overflow:hidden">
         <tr style="background:#fef9c3">
           <td style="padding:10px 14px;font-weight:600;color:#854d0e;width:50%">Original amount</td>
           <td style="padding:10px 14px;color:#0f172a">₹${refundInfo.originalAmount}</td>
         </tr>
         <tr style="background:#fff7ed">
           <td style="padding:10px 14px;font-weight:600;color:#9a3412">Cancellation fee (10%)</td>
           <td style="padding:10px 14px;color:#dc2626">− ₹${refundInfo.cancellationFee}</td>
         </tr>
         <tr style="background:#f0fdf4">
           <td style="padding:10px 14px;font-weight:700;color:#166534">Refund amount</td>
           <td style="padding:10px 14px;font-weight:700;color:#16a34a">₹${refundInfo.refundAmount}</td>
         </tr>
       </table>
       <p style="color:#64748b;font-size:13px">Refunds are processed within 5–7 business days.</p>
       ` : `<p>No payment was made, so no refund is applicable.</p>`}
       <p>We hope to see you again soon.</p>`
    ),
  });

exports.sendAppointmentUpdate = (user, title, message) =>
  sendEmail({
    to: user.email,
    subject: `${title} — MediBook`,
    html: baseTemplate(title, `<p>${message}</p>`),
  });

exports.sendEmail = sendEmail;
