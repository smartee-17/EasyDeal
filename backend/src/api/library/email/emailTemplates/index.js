/**
 * EMAIL TEMPLATES — BARREL EXPORT
 * Import any template from this single entry point.
 *
 * Usage:
 *   const { welcomeTemplate } = require("../emailTemplates");
 */

import welcomeTemplate from './welcomeTemplate';
import emailVerificationTemplate from './emailVerificationTemplate';
import passwordChangedTemplate from './passwordChangedTemplate';
import passwordResetTemplate from './passwordResetTemplate';
import loginOtpTemplate from './loginOtpTemplate';
import inviteUserTemplate from './inviteUserTemplate';
import notificationTemplate from './notificationTemplate';

export {
  welcomeTemplate,
  emailVerificationTemplate,
  passwordResetTemplate,
  passwordChangedTemplate,
  loginOtpTemplate,
  inviteUserTemplate,
  notificationTemplate,
};
