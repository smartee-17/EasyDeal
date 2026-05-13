import User from '../models/user.model.js';
import { generateToken, setAuthCookie } from '../library/generateJwtToken.js';
import bcrypt from 'bcryptjs';
import { sendResponse } from '../library/utils.js';

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      username,
      bio,
      whatsappNumber,
      rememberMe,
    } = req.body;

    if (!name || !email || !password || !phone) {
      return res
        .status(400)
        .json({ message: 'Please fill all required fields' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { phone }],
    });
    if (existingUser) {
      const field =
        existingUser.email === email
          ? 'Email'
          : existingUser.username === username
            ? 'Username'
            : 'Phone';
      return res.status(400).json({ message: `${field} already in use` });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      username,
      bio,
      whatsappNumber,
      role: 'user',
    });

    const token = generateToken(user, rememberMe === true);
    setAuthCookie(res, token, rememberMe === true);

    const userObj = user.toObject();
    delete userObj.password;

    return sendResponse(res, 201, true, 'Account created', { token, user: userObj });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
