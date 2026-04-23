// const protect = (req, res, next) => {
//   // Hardcoded fake user
//   req.user = {
//     _id: '64fa2b3c1e0000abc1234567', // agree on this ID with Starlore
//     role: 'seller',
//     name: 'Test Seller',
//   };
//   next();
// };

import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) token = req.headers.authorization.split(" ")[1];

    if(!token) return res.status(401).json({ message: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch(error) {
     return res.status(401).json({ message: "Not authorized, token failed" });
  }
}

// const protect = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ message: 'No token' });

//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
//   req.user = decoded; // same shape you already used
//   next();
// };

export default protect;