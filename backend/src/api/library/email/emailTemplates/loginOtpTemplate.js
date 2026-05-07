import baseLayout from "./baseLayout";
/**
 * LOGIN OTP TEMPLATE
 * Sent when a user requests a one-time password for authentication.
 *
 * @param {Object} params
 * @param {string} params.username       - The user's display name
 * @param {string} params.otp            - The one-time password code
 * @param {number} [params.expiresInMins] - OTP expiry in minutes (default: 10)
 * @returns {{ subject: string, html: string }}
 */
function loginOtpTemplate({ username, otp, expiresInMins = 10 }) {
  const subject = "Your one-time login code";

  const bodyContent = /* html */ `
    <h2>Your login code</h2>
    <p>Hi ${username}, use the code below to complete your sign-in.</p>
    <p>It expires in <strong>${expiresInMins} minutes</strong>. Do not share it with anyone.</p>
    <div class="otp-box">${otp}</div>
    <hr class="divider" />
    <p style="font-size:13px;color:#6b7280;">
      If you didn't try to log in, you can safely ignore this email.
      Someone may have typed your email address by mistake.
    </p>
  `;

  return {
    subject,
    html: baseLayout({
      title: subject,
      previewText: `Your login code is ${otp}. Expires in ${expiresInMins} minutes.`,
      bodyContent,
    }),
  };
}

export default loginOtpTemplate;
