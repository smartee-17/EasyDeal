import jwt from 'jsonwebtoken';

export const generateToken = (user, rememberMe) => {
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