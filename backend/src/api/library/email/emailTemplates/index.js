/**
 * EMAIL TEMPLATES — BARREL EXPORT
 * Import any template from this single entry point.
 *
 * Usage:
 *   const { welcomeTemplate } = require("../emailTemplates");
 */

const { welcomeTemplate }           = require("./welcomeTemplate");
const { emailVerificationTemplate } = require("./emailVerificationTemplate");
const { passwordResetTemplate }     = require("./passwordResetTemplate");
const { passwordChangedTemplate }   = require("./passwordChangedTemplate");
const { loginOtpTemplate }          = require("./loginOtpTemplate");
const { inviteUserTemplate }        = require("./inviteUserTemplate");
const { notificationTemplate }      = require("./notificationTemplate");

module.exports = {
  welcomeTemplate,
  emailVerificationTemplate,
  passwordResetTemplate,
  passwordChangedTemplate,
  loginOtpTemplate,
  inviteUserTemplate,
  notificationTemplate,
};
