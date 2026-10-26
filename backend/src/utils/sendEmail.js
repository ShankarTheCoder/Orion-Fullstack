// Email sending via Resend (https://resend.com) - used for the registration
// OTP. Two modes:
//  * LIVE: RESEND_API_KEY is set -> mail is sent through the Resend API.
//  * DEV/TEST FALLBACK: no key -> nothing is sent and nothing crashes; the
//    OTP is logged to the server console with a clear DEV MODE marker, and
//    (in non-production) recorded in the exported `sentEmails` array so the
//    Jest suite can complete the verification flow end-to-end.
// NOTE: there is deliberately NO HTTP endpoint that returns OTPs - the array
// below is only reachable from code running inside this process (tests).
const { Resend } = require('resend');
const config = require('../config/env');

const EMAIL_FROM = process.env.EMAIL_FROM || 'Orion <onboarding@resend.dev>';
const sentEmails = []; // dev/test mode only

let resendClient = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

function otpEmailHtml(otp) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f6fbf4;padding:24px">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e2e8f0">
      <h1 style="color:#15803d;margin:0 0 4px;font-size:22px">🌱 Orion</h1>
      <p style="color:#475569;margin:0 0 20px">Meerut's online farm-fresh fruits &amp; vegetables store</p>
      <p style="color:#0f172a">Use this one-time password to verify your email address:</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#166534;background:#f0fdf4;border:1px dashed #16a34a;border-radius:10px;text-align:center;padding:16px 8px;margin:16px 0">${otp}</div>
      <p style="color:#475569">This code is <strong>valid for 10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#94a3b8;font-size:12px">If you did not create an Orion account, you can safely ignore this email.</p>
    </div>
  </div>`;
}

async function sendOtpEmail(to, otp) {
  const subject = 'Your Orion verification code';
  const client = getClient();
  if (!client) {
    // DEV MODE - no RESEND_API_KEY configured.
    console.log(`\n[DEV MODE — no RESEND_API_KEY] Email OTP for ${to}: ${otp} (valid 10 minutes)\n`);
    if (config.NODE_ENV !== 'production') sentEmails.push({ to, otp, subject, at: new Date() });
    return { devMode: true };
  }
  const { data, error } = await client.emails.send({
    from: EMAIL_FROM, to, subject, html: otpEmailHtml(otp),
  });
  if (error) {
    // Do not crash registration because the mail provider failed; the user
    // can request a fresh OTP via /auth/resend-otp.
    console.error('Resend send failed:', error);
    return { devMode: false, error };
  }
  return { devMode: false, id: data?.id };
}

function clearSentEmails() { sentEmails.length = 0; }

module.exports = { sendOtpEmail, sentEmails, clearSentEmails, otpEmailHtml };
