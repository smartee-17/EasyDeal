/**
 * EMAIL TYPES
 * Central registry of all email categories used across the application.
 * Add new types here when introducing new email flows.
 */

const EMAIL_TYPES = Object.freeze({
  WELCOME:               "welcome",
  EMAIL_VERIFICATION:    "email_verification",
  PASSWORD_RESET:        "password_reset",
  PASSWORD_CHANGED:      "password_changed",
  LOGIN_OTP:             "login_otp",
  ACCOUNT_LOCKED:        "account_locked",
  INVITE_USER:           "invite_user",
  NOTIFICATION:          "notification",
});

export default EMAIL_TYPES;
