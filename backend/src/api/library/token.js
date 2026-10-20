import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/* One definition of the auth cookie's attributes.

   `res.clearCookie` only succeeds if the cookie it expires matches the stored
   cookie on name, domain and path. Keeping the setting and clearing options in
   one place is what stops the two from drifting apart when the policy below
   changes, which is the failure that would leave a browser holding a live
   cookie after a successful logout. */
const AUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'Lax',
    // Not implied: a bare Set-Cookie would scope the cookie to the current
    // directory, while a later request to a sibling path would not carry it.
    path: '/'
};

export const generateAccessToken = (user, rememberMe) => {
    return jwt.sign(
        { id: user._id},
        process.env.JWT_SECRET,
        { expiresIn: rememberMe ? '30d' : '1d'}
    );

};

export const setAuthCookie = (res, token, rememberMe) => {
    res.cookie('token', token, {
        ...AUTH_COOKIE_OPTIONS,
        maxAge: rememberMe
            ? 30 * 24 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000
    });
}

/* Mirrors setAuthCookie's attributes so the browser is guaranteed to expire
   the cookie this server actually issued. */
export const clearAuthCookie = (res) => {
    res.clearCookie('token', AUTH_COOKIE_OPTIONS);
}

// Non JWt Helpers

export const generateSecureToken = (byteLength = 32) => {

  const raw    = crypto.randomBytes(byteLength).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };

}

export const hashToken = (raw) => {
  return crypto.createHash("sha256").update(raw).digest("hex");
}