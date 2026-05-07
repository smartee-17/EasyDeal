import User from '../models/user.model.js';
import { 
  generateAccessToken, 
  setAuthCookie, 
  generateSecureToken, 
  hashToken } from '../library/token.js';
import bcrypt from 'bcryptjs';
import { sendResponse } from '../library/utils.js';
import { sendEmail }  from '../library/email/emailService/index.js';
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

    const validRoles = ['user', 'seller'];
    if (!validRoles.includes(role)){
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${ validRoles.join(", ") }`
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
    const { raw: rawEmailToken, hashed: hashedEmailToken } = generateSecureToken();

    const user = await User.create({
      name,
      email: email.toLowerCase(),
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

    
    const token = generateAccessToken(user, rememberMe === true);
    setAuthCookie(res, token, rememberMe === true);


    sendResponse(
      res, 
      201, 
      true, 
      'Account created', 
      // delete token after test
      { token, user: user.toPublic() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login controller
export const login = async (req, res) => {
  try{
    const { emailOrUsername, password, rememberMe = false } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: "email or username and password are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if(user.isBlocked){
      return res.status(401).json({ message: "This account has been suspended. Contact support." });
    }

    const passwordMatch = await user.matchPassword(password);
    if(!passwordMatch){
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "admin") {
      user.lastLoginAt = new Date();
      user.loginCount  = (user.loginCount || 0) + 1;
      await user.save({ validateBeforeSave: false });
    }

    const token = generateAccessToken( user, Boolean(rememberMe));
    setAuthCookie(res, token, Boolean(rememberMe));

    return sendResponse(
      res, 
      201,
      true,
      "Login Successful",
      // delete token after test
      { token, user: user.toPublic()}
    );

 } catch (error){
    console.error("[Auth] login error:", error.message);
    return res.status(500).json({ message: "Server error during login" });
 }
}

// Verify Email 
export const verifyEmail = async (req, res) => {
  try {
    const hashed = hashToken(req.params.token);

    const user = await User.findOne({
      emailVerificationToken: hashed, 
      emailVerificationTokenExpire: { $gt: Date.now() }
    });

    if(!user){
      return res.status(400).json({ message: "Verification link is invalid or has expired" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json({ message: "Email verified successfully" });

  } catch (error) {
    console.error("[Auth] verifyEmail error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if(!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if(!user){
      return res.json({ message: "if an account exists, a new code has  been sent"});
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const { raw: rawEmailToken, hashed: hashedEmailToken } = generateSecureToken();

    user.emailVerificationToken = hashedEmailToken;
    user.emailVerificationTokenExpire= Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    await sendVerifictionComms({
      email: user.email,
      phone: user.phone,
      subject: "Verify your email address",
      html: EMAIL_TYPES.EMAIL_VERIFICATION,
      rawToken: rawEmailToken
    });

    return sendResponse(
      res,
      201,
      true,
      "Verification email sent",
      // delete token after test
      { token, user: user.toPublic()}
    )
  } catch (error) {
    console.error("[Auth] resendVerification error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
}