import baseLayout from "./baseLayout";

/**
 * PASSWORD CHANGED TEMPLATE
 * Sent as a security confirmation after a user's password is successfully changed.
 *
 * @param {Object} params
 * @param {string} params.username   - The user's display name
 * @param {string} params.supportUrl - Link to contact support if unauthorized
 * @returns {{ subject: string, html: string }}
 */
function passwordChangedTemplate({ username, supportUrl }) {
  const subject = "Your password has been changed";

  const bodyContent = /* html */ `
    <h2>Password updated</h2>
    <p>Hi ${username}, your account password was successfully changed.</p>
    <p>
      If you made this change, no further action is needed.
    </p>
    <p>
      If you did <strong>not</strong> authorize this change, please secure your account immediately:
    </p>
    <a href="${supportUrl}" class="btn">Contact Support</a>
  `;

  return {
    subject,
    html: baseLayout({
      title: subject,
      previewText: "Your password was recently changed. Didn't do this? Act now.",
      bodyContent,
    }),
  };
}

export default passwordChangedTemplate;
