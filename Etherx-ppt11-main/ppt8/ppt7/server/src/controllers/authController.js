import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import emailService from '../services/emailService.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!process.env.MONGODB_URI) {
      return res.status(503).json({ message: 'Database not configured. Please use production server.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!process.env.MONGODB_URI) {
      return res.status(503).json({ message: 'Database not configured. Please use production server.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Forgot password - Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Check rate limiting (max 3 requests per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (user.lastOTPRequest && user.lastOTPRequest > oneHourAgo && user.otpAttempts >= 3) {
      return res.status(429).json({ 
        message: 'Too many OTP requests. Please try again after 1 hour.' 
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();

    // Send OTP via email
    const emailResult = await emailService.sendOTP(email, otp, user.name);
    
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    res.json({
      message: 'OTP sent successfully to your email address',
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email for security
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error while sending OTP' });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    const isOTPValid = user.verifyOTP(otp);
    if (!isOTPValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({
      message: 'OTP verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP one more time
    const isOTPValid = user.verifyOTP(otp);
    if (!isOTPValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Update password
    user.password = newPassword;
    user.clearOTP();
    await user.save();

    // Send confirmation email
    await emailService.sendPasswordResetConfirmation(email, user.name);

    res.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -resetPasswordOTP -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};