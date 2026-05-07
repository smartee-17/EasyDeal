import jwt from 'jsonwebtoken';
import crypto from 'cyrpto';

export const generateAccessToken = (user, rememberMe) => {
    return jwt.sign(
        { id: user._id},
        process.env.JWT_SECRET,
        { expiresIn: rememberMe ? '30d' : '1d'}
    );

};

export const setAuthCookie = (res, token, rememberMe) => {
    res.cookie('token', token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'Lax',
        maxAge: rememberMe 
            ? 30 * 24 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000
    });
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