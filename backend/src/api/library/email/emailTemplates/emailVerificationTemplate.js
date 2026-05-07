const { baseLayout } = require("./baseLayout");

/**
 * EMAIL VERIFICATION TEMPLATE
 * Sent to confirm a user's email address after registration or email change.
 *
 * @param {Object} params
 * @param {string} params.username       - The user's display name
 * @param {string} params.verifyUrl      - The unique verification link
 * @param {number} [params.expiresInHrs] - Link expiry in hours (default: 24)
 * @returns {{ subject: string, html: string }}
 */
function emailVerificationTemplate({ username, verifyUrl, expiresInHrs = 24 }) {
  const subject = "Verify your email address";

  const bodyContent = /* html */ `
    <h2>Confirm your email</h2>
    <p>Hi ${username}, please verify your email address by clicking the button below.</p>
    <p>This link expires in <strong>${expiresInHrs} hour${expiresInHrs !== 1 ? "s" : ""}</strong>.</p>
    <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#6b7280;">
      Or paste this link in your browser:<br/>
      <a href="${verifyUrl}" style="color:#4F46E5;">${verifyUrl}</a>
    </p>
  `;

  return {
    subject,
    html: baseLayout({
      title: subject,
      previewText: "Tap to verify your email address and activate your account.",
      bodyContent,
    }),
  };
}

module.exports = { emailVerificationTemplate };
