import baseLayout from "./baseLayout";

/**
 * NOTIFICATION TEMPLATE
 * Generic notification email — use for alerts, system messages, or any
 * one-off communication that doesn't fit a specific template.
 *
 * @param {Object} params
 * @param {string} params.username        - The recipient's display name
 * @param {string} params.heading         - Bold heading line inside the email
 * @param {string} params.message         - Main notification body text (HTML supported)
 * @param {string} [params.ctaLabel]      - Button label (omit to hide button)
 * @param {string} [params.ctaUrl]        - Button href (required if ctaLabel provided)
 * @returns {{ subject: string, html: string }}
 */
function notificationTemplate({ username, heading, message, ctaLabel, ctaUrl }) {
  const subject = heading;

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" class="btn">${ctaLabel}</a>`
      : "";

  const bodyContent = /* html */ `
    <h2>${heading}</h2>
    <p>Hi ${username},</p>
    <p>${message}</p>
    ${ctaBlock}
  `;

  return {
    subject,
    html: baseLayout({
      title: subject,
      previewText: heading,
      bodyContent,
    }),
  };
}

export default notificationTemplate;
