/**
 * EMAIL MODULE — ROOT EXPORT
 * Single import point for the entire email system.
 *
 * Usage anywhere in the backend:
 *
 *   const { sendWelcomeEmail, sendLoginOtpEmail } = require("./email");
 *   const { EMAIL_TYPES }                         = require("./email");
 *
 *   // Convenience wrapper
 *   await sendWelcomeEmail(user.email, { username: user.name, loginUrl });
 *
 *   // Or via the core function + EMAIL_TYPES
 *   await sendEmail({ to: user.email, type: EMAIL_TYPES.LOGIN_OTP, payload: { username, otp } });
 */

const emailService  = require("./emailService");
const { EMAIL_TYPES } = require("./emailTypes");
const emailTemplates  = require("./emailTemplates");

module.exports = {
  ...emailService,
  EMAIL_TYPES,
  emailTemplates, // expose if you ever need to render templates without sending
};
