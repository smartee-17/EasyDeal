/**
 * EMAIL TEMPLATES — BARREL EXPORT
 * Import any template from this single entry point.
 *
 * Usage:
 *   const { welcomeTemplate } = require("../emailTemplates");
 */

import welcomeTemplate from './welcomeTemplate.js';
import emailVerificationTemplate from './emailVerificationTemplate.js';
import passwordChangedTemplate from './passwordChangedTemplate.js';
import passwordResetTemplate from './passwordResetTemplate.js';
import loginOtpTemplate from './loginOtpTemplate.js';
import inviteUserTemplate from './inviteUserTemplate.js';
import notificationTemplate from './notificationTemplate.js';

export {
  welcomeTemplate,
  emailVerificationTemplate,
  passwordResetTemplate,
  passwordChangedTemplate,
  loginOtpTemplate,
  inviteUserTemplate,
  notificationTemplate,
};
