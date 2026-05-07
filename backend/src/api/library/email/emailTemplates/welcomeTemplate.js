import baseLayout from "./baseLayout";
/**
 * WELCOME EMAIL TEMPLATE
 * Sent when a new user successfully registers.
 *
 * @param {Object} params
 * @param {string} params.username    - The new user's display name
 * @param {string} params.loginUrl    - Direct link to the login page
 * @returns {{ subject: string, html: string }}
 */
function welcomeTemplate({ username, loginUrl }) {
  const subject = `Welcome to ${process.env.APP_NAME || "MyApp"} 🎉`;

  const bodyContent = /* html */ `
    <h2>Welcome aboard, ${username}!</h2>
    <p>We're thrilled to have you. Your account is all set up and ready to go.</p>
    <p>Click below to log in and get started:</p>
    <a href="${loginUrl}" class="btn">Go to My Account</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#6b7280;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${loginUrl}" style="color:#4F46E5;">${loginUrl}</a>
    </p>
  `;

  return {
    subject,
    html: baseLayout({
      title: subject,
      previewText: `Welcome, ${username}! Your account is ready.`,
      bodyContent,
    }),
  };
}

export default welcomeTemplate;
