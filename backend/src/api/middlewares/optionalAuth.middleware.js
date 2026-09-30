import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) req.user = user;
  } catch (err) {
    // invalid/expired token — treat as guest, don't throw
  }
  next();
};
