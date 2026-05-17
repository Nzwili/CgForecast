/**
 * server/utils/mailer.js
 * Reusable Nodemailer transporter using Brevo SMTP.
 * Configure SMTP_* vars in .env
 */
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send the email-verification link to a newly registered user.
 * @param {string} toEmail  Recipient address
 * @param {string} toName   Recipient full name
 * @param {string} token    Signed JWT verification token
 */
async function sendVerificationEmail(toEmail, toName, token) {
  const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;
  const verifyUrl = `${serverUrl}/api/auth/verify?token=${token}`;
  const from = process.env.FROM_EMAIL || 'noreply@cgforecast.app';

  // Live debug log - extremely useful for presentations and fast testing!
  console.log(`✉️ Generated verification URL for ${toEmail}: ${verifyUrl}`);

  await transporter.sendMail({
    from: `"CG Forecast" <${from}>`,
    to: toEmail,
    subject: 'Verify your CG Forecast account',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Inter,sans-serif;background:#f2f2f7;margin:0;padding:32px;">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#7c6df0,#b86ef8);padding:28px 32px;">
            <div style="font-size:28px;">⛪</div>
            <h1 style="font-size:1.3rem;font-weight:800;color:#fff;margin:8px 0 0;">CG Forecast</h1>
            <p style="color:rgba(255,255,255,0.7);font-size:0.82rem;margin:4px 0 0;">Faith Organization Growth Intelligence</p>
          </div>
          <div style="padding:32px;">
            <h2 style="font-size:1.1rem;color:#1a1a24;margin:0 0 12px;">Hi ${toName} 👋</h2>
            <p style="color:#555;font-size:0.9rem;line-height:1.6;margin:0 0 24px;">
              You're almost ready! Click the button below to verify your email address and activate your account.
            </p>
            <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c6df0,#6d2ff5);color:#fff;font-weight:700;font-size:0.9rem;padding:12px 28px;border-radius:10px;text-decoration:none;">
              Verify Email Address →
            </a>
            <p style="color:#999;font-size:0.75rem;margin:24px 0 0;line-height:1.6;">
              This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Send an alert digest email to a pastor/admin.
 */
async function sendAlertEmail(toEmail, toName, alertSummary) {
  const from = process.env.FROM_EMAIL || 'noreply@cgforecast.app';
  await transporter.sendMail({
    from: `"CG Forecast Alerts" <${from}>`,
    to: toEmail,
    subject: `⚡ SVR Alert: ${alertSummary.groupName} — ${alertSummary.type} detected`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#7c6df0;">⚡ Attendance Alert</h2>
        <p><strong>Group:</strong> ${alertSummary.groupName}</p>
        <p><strong>Alert Type:</strong> ${alertSummary.type}</p>
        <p><strong>Message:</strong> ${alertSummary.message}</p>
        <p><strong>Recommendation:</strong> ${alertSummary.recommendation}</p>
        <p style="color:#999;font-size:0.8rem;">Log in to CG Forecast to acknowledge this alert and view the full forecast.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendAlertEmail };
