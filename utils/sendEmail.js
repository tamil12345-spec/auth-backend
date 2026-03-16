// backend/utils/sendEmail.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Verify on startup
if (!process.env.RESEND_API_KEY) {
  console.error('❌ Resend error: RESEND_API_KEY is missing in environment variables');
} else {
  console.log('✅ Resend transporter ready');
}

// ── Email templates ───────────────────────────────────────────
const templates = {
  resetPassword: (name, resetUrl) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;background:#0d1017;color:#dde1eb;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">Reset Your Password</h1>
        </div>
        <div style="padding:36px 40px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#8891a4;">
            We received a request to reset your password. Click the button below — this link expires in <strong style="color:#dde1eb;">15 minutes</strong>.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${resetUrl}"
               style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
              Reset Password
            </a>
          </div>
          <p style="margin:24px 0 0;font-size:12px;color:#4b5465;text-align:center;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  }),

  welcomeEmail: (name) => ({
    subject: 'Welcome! Your account is ready',
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;background:#0d1017;color:#dde1eb;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">Welcome aboard 🎉</h1>
        </div>
        <div style="padding:36px 40px;">
          <p style="font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>, your account has been created successfully.</p>
          <p style="font-size:15px;line-height:1.6;color:#8891a4;">You can now sign in and start using the app.</p>
        </div>
      </div>
    `,
  }),
};

/**
 * Send an email using Resend.
 * @param {string} to - recipient email
 * @param {'resetPassword'|'welcomeEmail'} template - template key
 * @param {object} data - template data { name, resetUrl? }
 */
async function sendEmail(to, template, data) {
  const { subject, html } = templates[template](data.name, data.resetUrl);

  const { error } = await resend.emails.send({
    from: 'Auth App <onboarding@resend.dev>', // free default — no domain needed
    to,
    subject,
    html,
  });

  if (error) throw new Error(error.message);

  console.log('✅ Email sent to:', to);
}

module.exports = sendEmail;
