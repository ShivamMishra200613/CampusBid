import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import User from '../models/User.js';

export const generateToken = (user) => {
  return jwt.sign(
    { sub: user.id || user._id.toString(), role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

export const register = async (req, res, next) => {
  try {
    const { fullName, email, password, classBranch, rollNo, phone, bio } = req.body;

    if (!fullName || !email || !password) {
      const err = new Error('Full name, email, and password are required.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      return next(err);
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.endsWith('@ves.ac.in')) {
      const err = new Error('Registration is restricted to @ves.ac.in institutional emails.');
      err.statusCode = 400;
      err.code = 'INVALID_EMAIL_DOMAIN';
      return next(err);
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const err = new Error('An account with this email already exists.');
      err.statusCode = 409;
      err.code = 'USER_ALREADY_EXISTS';
      return next(err);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'student', // Enforce student role
      classBranch: classBranch || '',
      rollNo: rollNo || '',
      phone: phone || '',
      bio: bio || '',
      isVerifiedStudent: true
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error('Email and password are required.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      return next(err);
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');

    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      return next(err);
    }

    if (user.isSuspended) {
      const err = new Error('Your account has been suspended by an administrator.');
      err.statusCode = 403;
      err.code = 'ACCOUNT_SUSPENDED';
      return next(err);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      return next(err);
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: cleanEmail });

      if (user) {
        const resetToken = jwt.sign(
          { sub: user.id, type: 'password_reset' },
          config.jwtSecret,
          { expiresIn: '15m' }
        );

        if (config.nodeEnv !== 'production') {
          console.log(`[PASSWORD RESET LINK] For ${user.email}: http://localhost:5173/reset-password/${resetToken}`);
        }
      }
    }

    // Always return 200 to prevent user enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been generated.'
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      const err = new Error('Token and new password are required.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      return next(err);
    }

    if (newPassword.length < 8) {
      const err = new Error('Password must be at least 8 characters long.');
      err.statusCode = 400;
      err.code = 'WEAK_PASSWORD';
      return next(err);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (tokenErr) {
      const err = new Error('Invalid or expired password reset token.');
      err.statusCode = 400;
      err.code = 'INVALID_RESET_TOKEN';
      return next(err);
    }

    if (decoded.type !== 'password_reset') {
      const err = new Error('Invalid token type.');
      err.statusCode = 400;
      err.code = 'INVALID_RESET_TOKEN';
      return next(err);
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      return next(err);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You may now log in.'
    });
  } catch (err) {
    next(err);
  }
};
