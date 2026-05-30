<<<<<<< HEAD
const protect = (req, res, next) => {
  // Hardcoded fake user
  req.user = {
    _id: '64fa2b3c1e0000abc1234567', // agree on this ID with Starlore
    role: 'seller',
    name: 'Test Seller',
  };
  next();
};

export default protect;

// middleware/auth.js (STARLORE'S FINAL VERSION)
// import jwt from 'jsonwebtoken';

// const protect = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ message: 'No token' });

//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
//   req.user = decoded; // same shape you already used
//   next();
// };
=======
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const protect = async (req, res, next) => {
  try {
    const authHeaders = req.headers.authorization;

    let token =
      req.cookies?.token ||
      (authHeaders && authHeaders.startsWith('Bearer ')
        ? authHeaders.split(' ')[1]
        : null);

    if (!token)
      return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('name email role');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export default protect;
>>>>>>> 7d5f02507bc9b7e15747812fe41e9b69e1f3081b
