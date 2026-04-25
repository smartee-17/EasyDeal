import User from "../models/user.model";
import { generateToken, setAuthCookie} from "../library/generateJwtToken";
import bcrypt from "bcryptjs";
import { sendResponse } from "../library/utils";

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
      rememberMe
    } = req.body;


    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Upload avatar when cloudinary is set up and create it then too


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

    const token = generateToken(user, rememberMe);

    setAuthCookie(res, token, rememberMe);

    sendResponse(
        res,
        201,
        true,
        'Account created',
        user
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};