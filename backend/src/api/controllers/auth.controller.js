import User from '../models/user.model.js';
import { 
  generateToken, 
  setAuthCookie, 
  generateSecureToken, 
  hashToken } from '../library/token.js';
import bcrypt from 'bcryptjs';
import { sendResponse } from '../library/utils.js';
import { sendEmail }  from '../library/email/emailService';
import EMAIL_TYPES from '../library/email/emailTypes/index.js';

// Used incase of later update
const sendVerifictionComms = async ({ email, phone, subject, html, rawToken}) => {
  try{
    // await sendEmail({to: email, subject, html});

    // 🔐 DEBUG — token/OTP visible in server console for testing
    console.log("🔐 DEBUG Token/OTP :", rawToken);
    console.log("📡 Delivery Target :", email || phone);

  } catch(err){
       console.error("[Auth]  email failed:", err.message);
  }
} 

// Register controller
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
      role = "user"
    } = req.body;

    if (!name || !email || !password || !phone) {
      return res
        .status(400)
        .json({ message: 'Please fill all required fields' });
    }

    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be created via this endpoint' });
    }

    const validateRoles = ['user', 'seller'];
    if (!validateRoles.includes(role)){
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`
      });
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

    // Email verification token
    const { raw: rawEmailToken, hashed: hashedEmailToken} = generateSecureToken();

    const user = await User.create({
      name,
      email,
      password,
      phone,
      username,
      bio,
      whatsappNumber,
      role,
      emailVerificationToken: hashedEmailToken,
      emailVerificationTokenExpire: Date.now() + 30 * 60 * 1000, // 30 mins expiration time
    });

    await sendVerifictionComms({
      email: user.email,
      phone: user.phone,
      subject: "Verify your email address",
      html: EMAIL_TYPES.EMAIL_VERIFICATION,
      rawToken: rawEmailToken
    });

    
    const token = generateToken(user, rememberMe === true);
    setAuthCookie(res, token, rememberMe === true);


    sendResponse(res, 201, true, 'Account created', { token, user: user.toPublic() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
