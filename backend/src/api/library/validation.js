/* ============================================================
   EASYDEAL — AUTH INPUT NORMALISATION & PASSWORD POLICY
   Purpose: Single source of truth for the authentication rules
            that register, login and password reset all share, so
            they cannot drift apart again.
   ============================================================ */

/** Approved minimum password length. Applied to registration,
 *  password reset and the User schema so every write path agrees. */
export const PASSWORD_MIN_LENGTH = 8;

/** Roles a client is allowed to register itself as.
 *  Frontend labels map here: Buyer -> 'user', Seller -> 'seller'. */
export const ALLOWED_REGISTRATION_ROLES = ['user', 'seller'];

/** Registration can never mint an admin, even if a client asks for one. */
export const FORBIDDEN_REGISTRATION_ROLE = 'admin';

/**
 * Email is the only identifier treated case-insensitively.
 * Trimming matters too: the Mongoose schema trims, but the
 * duplicate check ran on the raw value before this existed.
 */
export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * Login accepts either an email or a username. Usernames are stored
 * lowercase and are matched exactly, so only whitespace is stripped
 * here and the caller lowercases for the email branch.
 */
export function normalizeLoginIdentifier(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** Phone is stored as a plain string and compared as one. */
export function normalizePhone(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * @returns {string|null} an error message, or null when the password is fine.
 */
export function validatePassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    return 'Password is required';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }
  return null;
}

export function isAllowedRegistrationRole(role) {
  return ALLOWED_REGISTRATION_ROLES.includes(role);
}