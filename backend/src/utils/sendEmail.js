// Email delivery service supporting both Nodemailer (Gmail / SMTP) and Resend.
//
// Priority:
//  1. SMTP (Nodemailer): If SMTP_USER and SMTP_PASS (or GMAIL_APP_PASSWORD) are set.
//  2. RESEND: If RESEND_API_KEY is configured.
//  3. DEV/TEST FALLBACK: Logs OTP to server console and tracks in sentEmails array
//     so local testing and automated Jest tests succeed without real credentials.
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const config = require('../config/env');

const EMAIL_FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || 'Orion <onboarding@resend.dev>';
const sentEmails = []; // dev/test mode tracking

let resendClient = null;
function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

let smtpTransporter = null;
function getSmtpTransporter() {
  const user = process.env.SMTP_USER || (process.env.EMAIL_FROM && process.env.EMAIL_FROM.includes('@') ? process.env.EMAIL_FROM : null);
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  if (!smtpTransporter) {
    const isGmail = user.includes('@gmail.com') || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail'));
    if (isGmail) {
      smtpTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    } else {
      smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: { user, pass },
      });
    }
  }
  return smtpTransporter;
}

function otpEmailHtml(otp, type = 'verification') {
  const isReset = type === 'reset-password';
  const heading = isReset ? 'Reset Your Orion Password' : 'Verify Your Email Address';
  const description = isReset
    ? 'We received a request to reset your Orion account password. Use this one-time password to complete your reset:'
    : 'Welcome to Orion! Use this one-time password to verify your email address and activate your account:';

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f6fbf4;padding:24px">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e2e8f0">
      <h1 style="color:#15803d;margin:0 0 4px;font-size:22px">🌱 Orion</h1>
      <p style="color:#475569;margin:0 0 20px;font-size:13px">Meerut's online farm-fresh fruits &amp; vegetables store</p>
      <h2 style="color:#0f172a;font-size:18px;margin:0 0 8px">${heading}</h2>
      <p style="color:#475569;font-size:14px;line-height:1.5">${description}</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#166534;background:#f0fdf4;border:1px dashed #16a34a;border-radius:10px;text-align:center;padding:16px 8px;margin:18px 0">${otp}</div>
      <p style="color:#475569;font-size:13px">This code is <strong>valid for 10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:20px;border-top:1px solid #f1f5f9;padding-top:12px">If you did not request this code, you can safely ignore this email.</p>
    </div>
  </div>`;
}

async function sendOtpEmail(to, otp, type = 'verification') {
  const subject = type === 'reset-password'
    ? 'Your Orion password reset code'
    : 'Your Orion verification code';

  // 1. Try SMTP (Nodemailer with Gmail / App Password)
  const transporter = getSmtpTransporter();
  if (transporter) {
    try {
      const fromAddr = process.env.EMAIL_FROM || process.env.SMTP_USER;
      const info = await transporter.sendMail({
        from: fromAddr.includes('<') ? fromAddr : `"Orion Store" <${fromAddr}>`,
        to,
        subject,
        html: otpEmailHtml(otp, type),
      });
      console.log(`[SMTP] Sent OTP email to ${to} (MessageID: ${info.messageId})`);
      return { devMode: false, provider: 'smtp', messageId: info.messageId };
    } catch (smtpErr) {
      console.error('[SMTP Error] Failed to send via Nodemailer:', smtpErr.message);
    }
  }

  // 2. Try Resend API
  const resend = getResendClient();
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        html: otpEmailHtml(otp, type),
      });
      if (error) {
        console.error('[Resend Error] Resend send failed:', error);
      } else {
        console.log(`[Resend] Sent OTP email to ${to} (ID: ${data?.id})`);
        return { devMode: false, provider: 'resend', id: data?.id };
      }
    } catch (resendErr) {
      console.error('[Resend Error] Exception during Resend:', resendErr.message);
    }
  }

  // 3. Fallback / Dev Mode
  console.log(`\n================================================================`);
  console.log(`[DEV MODE — NO EMAIL CREDENTIALS CONFIGURED]`);
  console.log(`Target Email : ${to}`);
  console.log(`OTP Code     : ${otp} (valid for 10 minutes)`);
  console.log(`Purpose      : ${type}`);
  console.log(`================================================================\n`);

  if (config.NODE_ENV !== 'production') {
    sentEmails.push({ to, otp, subject, type, at: new Date() });
  }
  return { devMode: true, otp };
}

function clearSentEmails() {
  sentEmails.length = 0;
}

module.exports = { sendOtpEmail, sentEmails, clearSentEmails, otpEmailHtml };
