import baseLayout from "./baseLayout";

/**
 * INVITE USER TEMPLATE
 * Sent when an admin or team member invites someone to join the platform.
 *
 * @param {Object} params
 * @param {string} params.invitedBy      - Display name of the person sending the invite
 * @param {string} params.inviteUrl      - The unique invite acceptance link
 * @param {number} [params.expiresInDays] - Invite expiry in days (default: 7)
 * @returns {{ subject: string, html: string }}
 */
function inviteUserTemplate({ invitedBy, inviteUrl, expiresInDays = 7 }) {
  const appName = process.env.APP_NAME || "MyApp";
  const subject = `You've been invited to join ${appName}`;

  const bodyContent = /* html */ `
    <h2>You're invited!</h2>
    <p><strong>${invitedBy}</strong> has invited you to join <strong>${appName}</strong>.</p>
    <p>Click below to accept the invitation and create your account. This invite expires in <strong>${expiresInDays} days</strong>.</p>
    <a href="${inviteUrl}" class="btn">Accept Invitation</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#6b7280;">
      If you weren't expecting an invitation, you can safely ignore this email.<br/><br/>
      Or paste this link in your browser:<br/>
      <a href="${inviteUrl}" style="color:#4F46E5;">${inviteUrl}</a>
    </p>
  `;

  return {
    subject,
    html: baseLayout({
      title: subject,
      previewText: `${invitedBy} invited you to join ${appName}.`,
      bodyContent,
    }),
  };
}

export default inviteUserTemplate
