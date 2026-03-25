// backend/utils/sendEmail.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Email templates ───────────────────────────────────────────
const templates = {

  resetPassword: (name, resetUrl) => ({
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
  }),

  welcomeEmail: (name) => ({
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
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in environment variables.');
  }

  const { subject, html } = templates[template](data.name, data.resetUrl);

  const { data: result, error } = await resend.emails.send({
    from: "tamilarasi3086@gmail.com", // swap for noreply@yourdomain.com after domain verification
    to,
    subject,
    html,
  });

  if (error) {
    console.error('❌ Resend error:', error);
    throw new Error('Email could not be sent: ' + error.message);
  }

  console.log('✅ Email sent via Resend:', result.id);
  return result;
}

module.exports = sendEmail;