import User from '../models/user.model.js';
import {
  generateAccessToken,
  setAuthCookie,
  clearAuthCookie,
  generateSecureToken,
  hashToken,
} from '../library/token.js';
import { sendResponse } from '../library/utils.js';
import { sendEmail } from '../library/email/emailService/index.js';
import EMAIL_TYPES from '../library/email/emailTypes/index.js';
import { generateUniqueUsername } from '../library/username.js';
import {
  ALLOWED_REGISTRATION_ROLES,
  FORBIDDEN_REGISTRATION_ROLE,
  isAllowedRegistrationRole,
  normalizeEmail,
  normalizeLoginIdentifier,
  normalizePhone,
  validatePassword,
} from '../library/validation.js';

// Used incase of later update
const sendVerifictionComms = async ({ email, type, payload }) => {
  try {
    await sendEmail({
      to: email,
      type,
      payload,
    });
  } catch (err) {
    console.error('[Auth] email failed:', err.message);
  }
};

// Register controller
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      bio,
      whatsappNumber,
      rememberMe,
      role = 'user',
    } = req.body;

    // `username` is intentionally absent: the signup design no longer
    // collects one, so any client-supplied value is ignored and the
    // backend generates a unique username instead.

    // Normalise before validating, so the duplicate check and the value
    // we persist are the same string. Previously the check ran on raw
    // input while the write lowercased, letting "Alice@x.com" slip past.
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!name || !normalizedEmail || !password || !normalizedPhone) {
      return sendResponse(res, 400, false, 'Please fill all required fields');
    }

    if (role === FORBIDDEN_REGISTRATION_ROLE) {
      return sendResponse(
        res,
        403,
        false,
        'Admin accounts cannot be created via this endpoint',
      );
      // return res.status(403).json({
      //   message: 'Admin accounts cannot be created via this endpoint',
      // });
    }

    if (!isAllowedRegistrationRole(role)) {
      return sendResponse(
        res,
        400,
        false,
        `Invalid role. Must be one of: ${ALLOWED_REGISTRATION_ROLES.join(', ')}`,
      );
      // return res.status(400).json({
      //   message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      // });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return sendResponse(res, 400, false, passwordError);
    }

    // Username is server-generated, so only email and phone can collide
    // with an existing account.
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    if (existingUser) {
      const field =
        normalizeEmail(existingUser.email) === normalizedEmail
          ? 'Email'
          : normalizePhone(existingUser.phone) === normalizedPhone
            ? 'Phone'
            : null;

      return sendResponse(
        res,
        400,
        false,
        field
          ? `${field} already in use`
          : 'An account with these details already exists',
      );
      // return res.status(400).json({ message: `${field} already in use` });
    }

    // Email verification token
    const { raw: rawEmailToken, hashed: hashedEmailToken } =
      generateSecureToken();

    const username = await generateUniqueUsername(name);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: normalizedPhone,
      username,
      bio,
      whatsappNumber,
      role,
      emailVerificationToken: hashedEmailToken,
      emailVerificationTokenExpire: Date.now() + 30 * 60 * 1000, // 30 mins expiration time
    });

    sendVerifictionComms({
      email: user.email,
      type: EMAIL_TYPES.EMAIL_VERIFICATION,
      payload: {
        username: user.username,
        verifyUrl: `${process.env.CLIENT_URL}/verify-email/${rawEmailToken}`,
      },
    });

    const token = generateAccessToken(user, rememberMe === true);
    setAuthCookie(res, token, rememberMe === true);

    // Mirrors the login response: the JWT is delivered only via the
    // HttpOnly cookie, never in the body for a browser to store.
    return sendResponse(res, 201, true, 'Account created', {
      user: user.toPublic(),
    });
  } catch (error) {
    // Two concurrent registrations can both pass the check above; the
    // unique index is the real arbiter. Report it as the same controlled
    // validation failure rather than leaking a 500 and an index name.
    if (error?.code === 11000) {
      return sendResponse(
        res,
        400,
        false,
        'An account with these details already exists',
      );
    }

    console.error('[Auth] register error:', error.message);
    return sendResponse(res, 500, false, 'Server error');
    // return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const { emailOrUsername, password, rememberMe = false } = req.body;

    const identifier = normalizeLoginIdentifier(emailOrUsername);

    if (!identifier || !password) {
      return sendResponse(
        res,
        400,
        false,
        'Email or username and password are required',
      );
      // return res
      //   .status(400)
      //   .json({ message: 'email or username and password are required' });
    }

    // Email is matched case-insensitively; usernames are stored lowercase
    // and compared as submitted, preserving the existing contract.
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    }).select('+password');

    if (!user) {
      return sendResponse(res, 401, false, 'Invalid credentials');
      // return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return sendResponse(
        res,
        401,
        false,
        'This account has been suspended. Contact support',
      );
      // return res
      //   .status(401)
      //   .json({ message: 'This account has been suspended. Contact support.' });
    }

    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch) {
      return sendResponse(res, 401, false, 'Invalid credentials');
      // return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = user.role === 'admin';

    if (admin) {
      user.lastLoginAt = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save({ validateBeforeSave: false });
    }

    const token = generateAccessToken(user, Boolean(rememberMe));
    setAuthCookie(res, token, Boolean(rememberMe));

    return sendResponse(res, 200, true, 'Login Successful', {
      user: user.toPublic(),
    });
  } catch (error) {
    console.error('[Auth] login error:', error.message);
    return sendResponse(res, 500, false, 'Server error during login');
    // return res.status(500).json({ message: 'Server error during login' });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    clearAuthCookie(res);

    return sendResponse(res, 200, true, 'Logged out successfully', null);
  } catch (error) {
    console.error('[Auth] logout error:', error.message);

    return sendResponse(res, 500, false, 'Server error during logout');
    // return res.status(500).json({
    //   message: 'Server error during logout',
    // });
  }
};

// Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const hashed = hashToken(req.params.token);

    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return sendResponse(
        res,
        400,
        false,
        'Verification link is invalid or has expired',
      );
      // return res
      //   .status(400)
      //   .json({ message: 'Verification link is invalid or has expired' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return sendResponse(res, 200, true, 'Email verified successfully');
    // return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('[Auth] verifyEmail error:', error.message);
    return sendResponse(res, 500, false, 'Server error');
    // return res.status(500).json({ message: 'Server error' });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendResponse(res, 400, false, 'email is required');
      // return res.status(400).json({ message: 'email is required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });

    if (!user) {
      return sendResponse(
        res,
        200,
        true,
        'If an account exists, a new code has been sent',
      );
      // return res
      //   .status(200)
      //   .json({ message: 'if an account exists, a new code has been sent' });
    }

    if (user.isEmailVerified) {
      return sendResponse(res, 400, false, 'Email is already verified');
      // return res.status(400).json({ message: 'Email is already verified' });
    }

    const { raw: rawEmailToken, hashed: hashedEmailToken } =
      generateSecureToken();

    user.emailVerificationToken = hashedEmailToken;
    user.emailVerificationTokenExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    sendVerifictionComms({
      email: user.email,
      type: EMAIL_TYPES.EMAIL_VERIFICATION,
      payload: {
        username: user.username,
        verifyUrl: `${process.env.CLIENT_URL}/verify-email/${rawEmailToken}`,
      },
    });

    return sendResponse(res, 200, true, 'Verification email sent', {
      resendKeyLoaded: !!process.env.RESEND_API_KEY,
    });
  } catch (error) {
    console.error('[Auth] resendVerification error:', error.message);
    return sendResponse(res, 500, false, 'Server error');
    // return res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendResponse(res, 400, false, 'Email is required');
      // return res.status(400).json({
      //   message: 'email is required',
      // });
    }

    const user = await User.findOne({
      email: normalizeEmail(email),
    });

    if (!user) {
      return sendResponse(
        res,
        200,
        true,
        'If an account exists for this email, a reset link has been sent',
      );
    }

    const { raw: rawToken, hashed } = generateSecureToken();

    user.resetPasswordToken = hashed;

    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    sendVerifictionComms({
      email: user.email,
      type: EMAIL_TYPES.PASSWORD_RESET,
      payload: {
        username: user.username,
        resetUrl: `${process.env.CLIENT_URL}/reset-password/${rawToken}`,
      },
    });

    return sendResponse(
      res,
      200,
      true,
      'If an account exists for this email, a reset link has been sent',
    );
  } catch (error) {
    console.error('[Auth] forgotPassword error:', error.message);
    return sendResponse(res, 500, false, 'Server error');
    // return res.status(500).json({ message: 'Server error' });
  }
};
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Shares the registration policy via PASSWORD_MIN_LENGTH so the two
    // write paths cannot drift apart.
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return sendResponse(
        res,
        400,
        false,
        `New password: ${passwordError.charAt(0).toLowerCase()}${passwordError.slice(1)}`,
      );
      // return res
      //   .status(400)
      //   .json({ message: 'New password must be at least 8 characters' });
    }

    const hashed = hashToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return sendResponse(
        res,
        400,
        false,
        'Reset link is invalid or has expired',
      );
      // return res
      //   .status(400)
      //   .json({ message: 'Reset link is invalid or has expired' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return sendResponse(
      res,
      200,
      true,
      'Password reset successful. You can now log in.',
    );
    // return res.json({
    //   message: 'Password reset successful. You can now log in.',
    // });
  } catch (error) {
    console.error('[Auth] resetPassword error:', error.message);
    return sendResponse(res, 500, false, 'Server error');
    // return res.status(500).json({ message: 'Server error' });
  }
};
