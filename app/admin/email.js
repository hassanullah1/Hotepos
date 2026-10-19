import nodemailer from "nodemailer";

// Requires these env vars (add to .env):
//   SMTP_HOST=smtp.yourmailprovider.com
//   SMTP_PORT=587
//   SMTP_USER=your-smtp-username
//   SMTP_PASS=your-smtp-password
//   EMAIL_FROM="Hotel App <no-reply@yourdomain.com>"
//   LOGIN_URL=https://yourapp.com/login
//
// Any SMTP provider works (Gmail app password, Resend, SendGrid SMTP,
// Mailgun, Zoho, etc). Nodemailer doesn't care which one you use.

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465, // true only for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Your ${hotelName} account is ready`,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("sendOwnerWelcomeEmail failed:", err);
    return { sent: false, reason: "send_error" };
  }
}

// lib/email.js  (add this export; keep everything else as-is)

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
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("sendPasswordResetEmail failed:", err);
    return { sent: false, reason: "send_error" };
  }
}

export async function sendContactMessage({ name, email, subject, message }) {
  return sendPasswordResetEmail({
    name,
    email,
    subject,
    message,
  });
}


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
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("sendSignupOtpEmail failed:", err);
    return { sent: false, reason: "send_error" };
  }
}
