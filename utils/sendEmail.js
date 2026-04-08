// backend/utils/sendEmail.js
// Uses Brevo HTTP API (not SMTP) — works on Render free tier

// ── Email templates ───────────────────────────────────────────
const templates = {

  resetPassword: ({ name, resetUrl }) => {
    if (!resetUrl) throw new Error('resetUrl is required for resetPassword template');
    return {
      subject: 'Reset your password',
      htmlContent: `
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
    htmlContent: `
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

// ── Send via Brevo HTTP API ───────────────────────────────────
async function sendEmail(to, template, data) {
  // ── Guard: env vars ───────────────────────────────────────
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not set in environment variables.');
  }
  if (!process.env.EMAIL_FROM) {
    throw new Error('EMAIL_FROM is not set in environment variables.');
  }

  // ── Guard: template exists ────────────────────────────────
  if (!templates[template]) {
    throw new Error(`Unknown email template: "${template}"`);
  }

  const { subject, htmlContent } = templates[template](data);

  // ── Send via Brevo REST API ───────────────────────────────
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key':      process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name:  process.env.EMAIL_FROM_NAME ?? 'MyApp',
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  // ── Handle Brevo errors ───────────────────────────────────
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('❌ Brevo API error:', err);
    throw new Error(err.message ?? `Brevo API responded with status ${response.status}`);
  }

  const result = await response.json();
  console.log('✅ Email sent via Brevo API, messageId:', result.messageId);
  return result;
}

module.exports = sendEmail;
