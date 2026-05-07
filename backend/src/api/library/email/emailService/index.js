/**
 * EMAIL SERVICE
 * Centralizes all email-sending logic.
 * Uses the Resend API. API key is loaded from environment — never hardcoded.
 *
 * Environment variables required:
 *   RESEND_API_KEY   — your Resend secret key
 *   EMAIL_FROM       — verified sender address, e.g. "MyApp <no-reply@myapp.com>"
 */

"use strict";

import Resend from require("resend");
import EMAIL_TYPES from '../emailTypes';
import {
  welcomeTemplate,
  emailVerificationTemplate,
  passwordResetTemplate,
  passwordChangedTemplate,
  loginOtpTemplate,
  inviteUserTemplate,
  notificationTemplate,
} from '../emailTemplates'

// ─── Guard: fail fast if env vars are missing ────────────────────────────────

if (!process.env.RESEND_API_KEY) {
  throw new Error("[emailService] Missing required env var: RESEND_API_KEY");
}
if (!process.env.EMAIL_FROM) {
  throw new Error("[emailService] Missing required env var: EMAIL_FROM");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = process.env.EMAIL_FROM;

// ─── Template resolver ────────────────────────────────────────────────────────

/**
 * Maps an EMAIL_TYPES value to its template builder function.
 * Add new types here as the system grows.
 *
 * @param {string} type    - One of EMAIL_TYPES values
 * @param {Object} payload - Dynamic data passed to the template
 * @returns {{ subject: string, html: string }}
 */
function resolveTemplate(type, payload) {
  switch (type) {
    case EMAIL_TYPES.WELCOME:
      return welcomeTemplate(payload);

    case EMAIL_TYPES.EMAIL_VERIFICATION:
      return emailVerificationTemplate(payload);

    case EMAIL_TYPES.PASSWORD_RESET:
      return passwordResetTemplate(payload);

    case EMAIL_TYPES.PASSWORD_CHANGED:
      return passwordChangedTemplate(payload);

    case EMAIL_TYPES.LOGIN_OTP:
      return loginOtpTemplate(payload);

    case EMAIL_TYPES.INVITE_USER:
      return inviteUserTemplate(payload);

    case EMAIL_TYPES.NOTIFICATION:
      return notificationTemplate(payload);

    default:
      throw new Error(`[emailService] Unknown email type: "${type}"`);
  }
}

// ─── Core send function ───────────────────────────────────────────────────────

/**
 * Sends an email via Resend.
 *
 * @param {Object}  options
 * @param {string}  options.to      - Recipient email address
 * @param {string}  options.type    - One of EMAIL_TYPES values
 * @param {Object}  options.payload - Data passed to the matching template
 * @param {string}  [options.from]  - Override sender (defaults to EMAIL_FROM env var)
 * @param {string[]} [options.cc]   - Optional CC addresses
 * @param {string[]} [options.bcc]  - Optional BCC addresses
 * @returns {Promise<{ id: string }>} Resend message ID on success
 * @throws Will throw if Resend returns an error
 */
async function sendEmail({ to, type, payload, from, cc, bcc }) {
  const { subject, html } = resolveTemplate(type, payload);

  const message = {
    from: from || FROM_ADDRESS,
    to,
    subject,
    html,
    ...(cc  && { cc }),
    ...(bcc && { bcc }),
  };

  const { data, error } = await resend.emails.send(message);

  if (error) {
    console.error(`[emailService] Failed to send "${type}" to ${to}:`, error);
    throw new Error(error.message || "Email send failed");
  }

  console.log(`[emailService] "${type}" sent to ${to} — id: ${data.id}`);
  return data;
}

// ─── Convenience wrappers (optional but ergonomic) ───────────────────────────

/**
 * Sends a welcome email to a newly registered user.
 * @param {string} to        - Recipient email
 * @param {Object} payload   - { username, loginUrl }
 */
const sendWelcomeEmail = (to, payload) =>
  sendEmail({ to, type: EMAIL_TYPES.WELCOME, payload });

/**
 * Sends an email verification link.
 * @param {string} to        - Recipient email
 * @param {Object} payload   - { username, verifyUrl, expiresInHrs? }
 */
const sendVerificationEmail = (to, payload) =>
  sendEmail({ to, type: EMAIL_TYPES.EMAIL_VERIFICATION, payload });

/**
 * Sends a password reset link.
 * @param {string} to        - Recipient email
 * @param {Object} payload   - { username, resetUrl, expiresInMins? }
 */
const sendPasswordResetEmail = (to, payload) =>
  sendEmail({ to, type: EMAIL_TYPES.PASSWORD_RESET, payload });

/**
 * Sends a password-changed security confirmation.
 * @param {string} to        - Recipient email
 * @param {Object} payload   - { username, supportUrl }
 */
const sendPasswordChangedEmail = (to, payload) =>
  sendEmail({ to, type: EMAIL_TYPES.PASSWORD_CHANGED, payload });

/**
 * Sends a one-time password for login.
 * @param {string} to        - Recipient email
 * @param {Object} payload   - { username, otp, expiresInMins? }
 */
const sendLoginOtpEmail = (to, payload) =>
  sendEmail({ to, type: EMAIL_TYPES.LOGIN_OTP, payload });

/**
 * Sends a team/platform invitation.
 * @param {string} to        - Recipient email
 * @param {Object} payload   - { invitedBy, inviteUrl, expiresInDays? }
 */
const sendInviteEmail = (to, payload) =>
  sendEmail({ to, type: EMAIL_TYPES.INVITE_USER, payload });

/**
 * Sends a generic notification email.
 * @param {string} to        - Recipient email
 * @param {Object} payload   - { username, heading, message, ctaLabel?, ctaUrl? }
 */
const sendNotificationEmail = (to, payload) =>
  sendEmail({ to, type: EMAIL_TYPES.NOTIFICATION, payload });

// ─── Exports ──────────────────────────────────────────────────────────────────

export default {
  // Core (use when building new flows programmatically)
  sendEmail,

  // Convenience wrappers
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendLoginOtpEmail,
  sendInviteEmail,
  sendNotificationEmail,
};
