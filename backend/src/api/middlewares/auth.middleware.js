import jwt from 'jsonwebtoken';
import User from '../models/user.model';

const protect = (req, res, next) => {
  try {
    const authHeaders = req.headers.authorization;

    let token = req.cookies?.token || (authHeaders && authHeaders.startsWith('Bearer ') ? authHeaders.split(' ')[1] : null);

    if(!token) return res.status(401).json({ message: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('name email role');

    if (!req.user) {
      return res.status(401).json({message: 'User not found'})
    }

    next();

  } catch(error) {
     return res.status(401).json({ message: "Not authorized, token failed" });
  }
}


export default protect;