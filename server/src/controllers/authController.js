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
