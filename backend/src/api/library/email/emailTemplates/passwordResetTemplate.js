const { baseLayout } = require("./baseLayout");

/**
 * PASSWORD RESET TEMPLATE
 * Sent when a user requests a password reset link.
 *
 * @param {Object} params
 * @param {string} params.username       - The user's display name
 * @param {string} params.resetUrl       - The unique password reset link
 * @param {number} [params.expiresInMins] - Expiry in minutes (default: 30)
 * @returns {{ subject: string, html: string }}
 */
function passwordResetTemplate({ username, resetUrl, expiresInMins = 30 }) {
  const subject = "Reset your password";

  const bodyContent = /* html */ `
    <h2>Reset your password</h2>
    <p>Hi ${username}, we received a request to reset your password.</p>
    <p>Click below to set a new password. This link expires in <strong>${expiresInMins} minutes</strong>.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#6b7280;">
      If you didn't request this, no action is needed — your account is safe.<br/><br/>
      Or paste this link in your browser:<br/>
      <a href="${resetUrl}" style="color:#4F46E5;">${resetUrl}</a>
    </p>
  `;

  return {
    subject,
    html: baseLayout({
      title: subject,
      previewText: "You requested a password reset. Link expires in 30 minutes.",
      bodyContent,
    }),
  };
}

module.exports = { passwordResetTemplate };
