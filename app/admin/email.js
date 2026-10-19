// lib/email.js
//
// Uses Resend's HTTP API (port 443). Railway blocks outbound SMTP ports
// 25/465/587, so nodemailer will hang and eventually fail with
// ETIMEDOUT / ENETUNREACH. This version uses fetch() to an HTTPS endpoint,
// which is never blocked.
//
// Required env vars (Railway → Variables):
//   RESEND_API_KEY=re_xxxxxxxxx
//   EMAIL_FROM="Hotel App <onboarding@resend.dev>"   (or your own verified domain)
//   LOGIN_URL=https://yourapp.com/login              (optional, used in welcome email)

const RESEND_ENDPOINT = "https://api.resend.com/emails";

async function sendViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set in environment variables");
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Hotel App <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API Error ${res.status}: ${body}`);
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

  const loginUrl = process.env.LOGIN_URL || "https://yourapp.com/login";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#10243A;">Welcome to Hotel App</h2>
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
    `Welcome to Hotel App`,
    ``,
    `${hotelName} is set up and ready to go.`,
    `Login page: ${loginUrl}`,
    `Email: ${to}`,
    `Temporary password: ${tempPassword}`,
    ``,
    `Please log in and change your password as soon as you can.`,
  ].join("\n");

  try {
    await sendViaResend({
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
// 2. Password reset email (also used as "set your password" link)
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
    await sendViaResend({ to, subject, html, text });
    return { sent: true };
  } catch (err) {
    console.error("sendPasswordResetEmail failed:", err.message);
    return { sent: false, reason: "send_error" };
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Contact message (re-uses reset flow)
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

  const subject = `Your ${hotelName || "Hotel App"} verification code`;

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1D1A22">
      <h2 style="font-family:Fraunces,serif;font-weight:500;margin:0 0 12px">Your verification code</h2>
      <p>Hi ${ownerName || "there"},</p>
      <p>Enter this code to finish verifying your email for <strong>${hotelName || "Hotel App"}</strong>:</p>
      <p style="margin:24px 0;font-size:32px;font-weight:700;letter-spacing:8px;color:#1D1A22">${otp}</p>
      <p style="font-size:13px;color:#6E687A">This code expires in 10 minutes.</p>
      <p style="font-size:13px;color:#6E687A">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  const text = [
    `Your verification code`,
    ``,
    `Hi ${ownerName || "there"},`,
    ``,
    `Enter this code to finish verifying your email for ${hotelName || "Hotel App"}:`,
    ``,
    otp,
    ``,
    `This code expires in 10 minutes.`,
  ].join("\n");

  try {
    await sendViaResend({ to, subject, html, text });
    return { sent: true };
  } catch (err) {
    console.error("sendSignupOtpEmail failed:", err.message);
    return { sent: false, reason: "send_error" };
  }
}
