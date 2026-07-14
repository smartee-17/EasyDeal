# Email Module

Modular, production-ready email system built on **Resend**.

---

## Folder Structure

```
email/
├── index.js                          ← Root export (import from here)
│
├── emailTypes/
│   └── index.js                      ← EMAIL_TYPES enum
│
├── emailTemplates/
│   ├── index.js                      ← Barrel export for all templates
│   ├── baseLayout.js                 ← Shared HTML wrapper
│   ├── welcomeTemplate.js
│   ├── emailVerificationTemplate.js
│   ├── passwordResetTemplate.js
│   ├── passwordChangedTemplate.js
│   ├── loginOtpTemplate.js
│   ├── inviteUserTemplate.js
│   └── notificationTemplate.js
│
└── emailService/
    └── index.js                      ← Resend send logic + convenience wrappers
```

---

## Environment Variables

Add these to your `.env` file:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=MyApp <no-reply@myapp.com>
APP_NAME=MyApp
```

---

## Usage

### Using convenience wrappers (recommended)

```js
const {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendLoginOtpEmail,
  sendInviteEmail,
  sendNotificationEmail,
} = require("./email");

// Welcome
await sendWelcomeEmail(user.email, {
  username: user.name,
  loginUrl: "https://myapp.com/login",
});

// Email verification
await sendVerificationEmail(user.email, {
  username: user.name,
  verifyUrl: "https://myapp.com/verify?token=abc123",
  expiresInHrs: 24,
});

// Password reset
await sendPasswordResetEmail(user.email, {
  username: user.name,
  resetUrl: "https://myapp.com/reset?token=xyz",
  expiresInMins: 30,
});

// Password changed confirmation
await sendPasswordChangedEmail(user.email, {
  username: user.name,
  supportUrl: "https://myapp.com/support",
});

// OTP login
await sendLoginOtpEmail(user.email, {
  username: user.name,
  otp: "847291",
  expiresInMins: 10,
});

// Team invite
await sendInviteEmail(invitee.email, {
  invitedBy: inviter.name,
  inviteUrl: "https://myapp.com/invite?token=def456",
  expiresInDays: 7,
});

// Generic notification
await sendNotificationEmail(user.email, {
  username: user.name,
  heading: "Your export is ready",
  message: "Your CSV export has been generated and is ready to download.",
  ctaLabel: "Download CSV",
  ctaUrl: "https://myapp.com/exports/123",
});
```

### Using the core `sendEmail` function (advanced)

```js
const { sendEmail, EMAIL_TYPES } = require("./email");

await sendEmail({
  to: "user@example.com",
  type: EMAIL_TYPES.LOGIN_OTP,
  payload: { username: "Alice", otp: "512847", expiresInMins: 10 },
  cc: ["audit@myapp.com"],   // optional
  bcc: ["logs@myapp.com"],   // optional
});
```

---

## Adding a New Email Type

1. **`emailTypes/index.js`** — add a new key to `EMAIL_TYPES`
2. **`emailTemplates/`** — create `myNewTemplate.js` exporting `myNewTemplate(payload)`
3. **`emailTemplates/index.js`** — add it to the barrel export
4. **`emailService/index.js`** — add a `case` in `resolveTemplate()` and an optional convenience wrapper
