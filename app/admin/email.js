// lib/email.js — Brevo HTTP API
// Works on Railway free plan (HTTPS port 443, never blocked).
//
// Required env vars:
//   BREVO_API_KEY=xkeysib-xxxxxxxxx
//   EMAIL_FROM_ADDRESS=hassanullahsalamzaiwar@gmail.com  (your verified sender)
//   LOGIN_URL=https://melmah.up.railway.app/login        (optional)

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

async function sendViaBrevo({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set in environment variables");
  }

  const senderEmail = process.env.EMAIL_FROM_ADDRESS;
  if (!senderEmail) {
    throw new Error("EMAIL_FROM_ADDRESS is not set in environment variables");
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: "Melmah", email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API Error ${res.status}: ${body}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// 1. Owner welcome email (after successful payment)
// ─────────────────────────────────────────────────────────────
export async function sendOwnerWelcomeEmail({
  to,
  ownerName,
  hotelName,
  tempPassword,
}) {
  if (!to) {
    console.warn("sendOwnerWelcomeEmail: no email address, skipping send");
    return { sent: false, reason: "no_email" };
  }

  const loginUrl =
    process.env.LOGIN_URL || "https://melmah.up.railway.app/hotel/login";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#10243A;">Welcome to Melmah</h2>
      <p>Hi ${ownerName || "there"},</p>
      <p><strong>${hotelName}</strong> is set up and ready to go. Here's how to log in:</p>
      <table style="margin: 16px 0; border-collapse: collapse;">
        <tr><td style="padding:4px 12px 4px 0; color:#8FA0B3;">Login page</td><td><a href="${loginUrl}">${loginUrl}</a></td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#8FA0B3;">Email</td><td>${to}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#8FA0B3;">Temporary password</td><td><strong>${tempPassword}</strong></td></tr>
      </table>
      <p>Please log in and change your password as soon as you can.</p>
    </div>
  `;

  const text = [
    `Welcome to Melmah`,
    ``,
    `${hotelName} is set up and ready to go.`,
    `Login page: ${loginUrl}`,
    `Email: ${to}`,
    `Temporary password: ${tempPassword}`,
    ``,
    `Please log in and change your password as soon as you can.`,
  ].join("\n");

  try {
    await sendViaBrevo({
      to,
      subject: `Your ${hotelName} account is ready`,
      html,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error("sendOwnerWelcomeEmail failed:", err.message);
    return { sent: false, reason: "send_error" };
  }
}

// ─────────────────────────────────────────────────────────────
// 2. Password reset email
// ─────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail({ to, ownerName, link }) {
  if (!to) {
    console.warn("sendPasswordResetEmail: no email address, skipping send");
    return { sent: false, reason: "no_email" };
  }

  const subject = "Reset your password";

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1D1A22">
      <h2 style="font-family:Fraunces,serif;font-weight:500;margin:0 0 12px">Reset your password</h2>
      <p>Hi ${ownerName || "there"},</p>
      <p>We received a request to reset the password for your account.</p>
      <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
      <p style="margin:24px 0">
        <a href="${link}"
           style="display:inline-block;background:#C9A227;color:#1D1707;padding:12px 20px;border-radius:8px;font-weight:600;text-decoration:none">
          Reset password
        </a>
      </p>
      <p style="font-size:13px;color:#6E687A">
        If the button doesn't work, copy this URL into your browser:<br/>
        <span style="word-break:break-all">${link}</span>
      </p>
      <p style="font-size:13px;color:#6E687A">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = [
    `Reset your password`,
    ``,
    `Hi ${ownerName || "there"},`,
    ``,
    `We received a request to reset the password for your account.`,
    `Click the link below to choose a new password. This link expires in 1 hour.`,
    ``,
    link,
    ``,
    `If you didn't request this, you can safely ignore this email.`,
  ].join("\n");

  try {
    await sendViaBrevo({ to, subject, html, text });
    return { sent: true };
  } catch (err) {
    console.error("sendPasswordResetEmail failed:", err.message);
    return { sent: false, reason: "send_error" };
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Contact form (re-uses password reset)
// ─────────────────────────────────────────────────────────────
export async function sendContactMessage({ name, email, subject, message }) {
  return sendPasswordResetEmail({ name, email, subject, message });
}

// ─────────────────────────────────────────────────────────────
// 4. Signup OTP email
// ─────────────────────────────────────────────────────────────
export async function sendSignupOtpEmail({ to, ownerName, hotelName, otp }) {
  if (!to) {
    console.warn("sendSignupOtpEmail: no email address, skipping send");
    return { sent: false, reason: "no_email" };
  }

  const subject = `Your ${hotelName || "Melmah"} verification code`;
  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://melmah.app"}/Melmah.png`;
  const year = new Date().getFullYear();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF7F1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(29,26,34,0.06);">

          <!-- gold accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#C9A227,#E0B93A,#C9A227);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- logo + Persian wordmark -->
          <tr>
            <td align="center" style="padding:36px 32px 8px;">
              <img
                src="${logoUrl}"
                alt="Melmah"
                height="48"
                style="display:block;height:48px;width:auto;max-width:180px;border:0;outline:none;text-decoration:none;margin:0 auto;"
              />
              <p style="margin:12px 0 0;font-size:14px;color:#8A8595;letter-spacing:3px;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">میلمه</p>
            </td>
          </tr>

          <!-- title + greeting -->
          <tr>
            <td style="padding:24px 40px 0;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#1D1A22;line-height:1.2;letter-spacing:-0.3px;">
                Verify your email
              </h1>
              <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#4A4552;">
                Hi ${ownerName || "there"}, welcome to Melmah. Use the code below to finish verifying your email for <strong style="color:#1D1A22;">${hotelName || "Melmah"}</strong>.
              </p>
            </td>
          </tr>

          <!-- OTP code card (Gmail auto-adds a "Copy code" button on these digits) -->
          <tr>
            <td style="padding:28px 40px 8px;">
              <div style="background:#FAF7F1;border:2px dashed #E0D8C4;border-radius:16px;padding:28px 20px;text-align:center;">
                <p style="margin:0 0 14px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8A8595;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">
                  Your verification code
                </p>
                <div style="font-family:'Courier New',Consolas,monospace;font-size:40px;font-weight:700;letter-spacing:14px;color:#1D1A22;line-height:1.1;padding-left:14px;word-break:break-all;">
                  ${otp}
                </div>
                <p style="margin:18px 0 0;font-size:12px;color:#8A8595;">
                  Tap and hold the code to copy
                </p>
              </div>
            </td>
          </tr>

          <!-- expiry -->
          <tr>
            <td align="center" style="padding:20px 40px 8px;">
              <p style="margin:0;font-size:13px;color:#8A8595;">
                This code expires in <strong style="color:#1D1A22;">10 minutes</strong>
              </p>
            </td>
          </tr>

          <!-- security note -->
          <tr>
            <td style="padding:20px 40px 32px;">
              <div style="background:#F5F1E8;border-left:3px solid #C9A227;border-radius:8px;padding:14px 18px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6E687A;">
                  <strong style="color:#1D1A22;">Security tip:</strong> If you didn't request this code, you can safely ignore this email. No account was created.
                </p>
              </div>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid #EFEADF;text-align:center;">
              <p style="margin:0;font-size:11px;color:#8A8595;">
                © ${year} Melmah · میلمه · All rights reserved
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#8A8595;">
                Need help? Just reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = [
    `Verify your email — Melmah`,
    ``,
    `Hi ${ownerName || "there"},`,
    ``,
    `Welcome to Melmah. Use this code to verify your email for ${hotelName || "Melmah"}:`,
    ``,
    `    ${otp}`,
    ``,
    `This code expires in 10 minutes.`,
    ``,
    `If you didn't request this, you can safely ignore this email.`,
    ``,
    `© ${year} Melmah · میلمه`,
  ].join("\n");

  try {
    await sendViaBrevo({ to, subject, html, text });
    return { sent: true };
  } catch (err) {
    console.error("sendSignupOtpEmail failed:", err.message);
    return { sent: false, reason: "send_error" };
  }
}