// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

// ── Transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465', // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Email templates ───────────────────────────────────────────
const templates = {

  resetPassword: ({ name, resetUrl }) => {
    if (!resetUrl) throw new Error('resetUrl is required for resetPassword template');
    return {
      subject: 'Reset your password',
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:520px;
                    margin:auto;background:#0d1017;color:#dde1eb;
                    border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);
                      padding:32px 40px;">
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">
              Reset Your Password
            </h1>
          </div>
          <div style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
              Hi <strong>${name}</strong>,
            </p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#8891a4;">
              We received a request to reset your password. Click the button
              below — this link expires in
              <strong style="color:#dde1eb;">15 minutes</strong>.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${resetUrl}"
                 style="display:inline-block;padding:14px 32px;
                        background:linear-gradient(135deg,#6366f1,#8b5cf6);
                        color:#fff;border-radius:10px;text-decoration:none;
                        font-weight:600;font-size:15px;">
                Reset Password
              </a>
            </div>
            <p style="font-size:13px;color:#4b5465;word-break:break-all;">
              Or copy this link:
              <a href="${resetUrl}" style="color:#6366f1;">${resetUrl}</a>
            </p>
            <p style="margin:24px 0 0;font-size:12px;color:#4b5465;text-align:center;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    };
  },

  welcomeEmail: ({ name }) => ({
    subject: 'Welcome! Your account is ready 🎉',
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:520px;
                  margin:auto;background:#0d1017;color:#dde1eb;
                  border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);
                    padding:32px 40px;">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">
            Welcome aboard 🎉
          </h1>
        </div>
        <div style="padding:36px 40px;">
          <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
            Hi <strong>${name}</strong>, your account has been created successfully.
          </p>
          <p style="font-size:15px;line-height:1.6;color:#8891a4;margin:0;">
            You can now sign in and start using the app.
          </p>
        </div>
      </div>
    `,
  }),

};

// ── Send email ────────────────────────────────────────────────
async function sendEmail(to, template, data) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER or SMTP_PASS is not set in environment variables.');
  }

  if (!templates[template]) {
    throw new Error(`Unknown email template: "${template}"`);
  }

  const { subject, html } = templates[template](data);

  const info = await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME ?? 'MyApp'}" <${process.env.EMAIL_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  console.log('✅ Email sent:', info.messageId);
  return info;
}

module.exports = sendEmail;