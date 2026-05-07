/**
 * BASE LAYOUT
 * Shared HTML shell wrapping every email template.
 * Keeps branding, fonts, and structure consistent across all emails.
 */

/**
 * @param {Object} params
 * @param {string} params.title        - Browser/client tab title
 * @param {string} params.previewText  - Inbox preview snippet
 * @param {string} params.bodyContent  - Inner HTML content (injected per template)
 * @param {string} [params.brandName]  - Defaults to APP_NAME env var
 * @param {string} [params.brandColor] - Hex color for accents/buttons
 * @returns {string} Full HTML email string
 */
function baseLayout({ title, previewText, bodyContent, brandName, brandColor = "#4F46E5" }) {
  const brand = brandName || process.env.APP_NAME || "MyApp";

  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { width: 100%; background-color: #f4f4f5; padding: 40px 0; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header { background-color: ${brandColor}; padding: 28px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .body { padding: 36px 40px; color: #374151; font-size: 15px; line-height: 1.7; }
    .body h2 { color: #111827; font-size: 20px; margin-top: 0; }
    .body p { margin: 0 0 16px; }
    .btn { display: inline-block; margin: 8px 0 20px; padding: 13px 28px; background-color: ${brandColor}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
    .otp-box { display: inline-block; margin: 12px 0 20px; padding: 14px 36px; background-color: #f3f4f6; border-radius: 6px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827; border: 1px dashed #d1d5db; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .footer { padding: 20px 40px 28px; text-align: center; font-size: 12px; color: #9ca3af; }
    .footer a { color: #9ca3af; text-decoration: underline; }
  </style>
</head>
<body>
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${previewText}&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;
  </div>

  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>${brand}</h1>
      </div>
      <div class="body">
        ${bodyContent}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${brand}. All rights reserved.</p>
        <p>If you didn't request this email, you can safely ignore it.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

module.exports = { baseLayout };
