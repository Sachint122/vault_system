const crypto = require('crypto');
const User = require('../models/userModel');
const { asyncHandler } = require('devil-backend-nodejs');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { generateAccessToken, generateRefreshToken, setTokenCookies } = require('../utils/generateToken');
const constants = require('../config/constants');

// ======================
// @route   POST /api/auth/register 
// @access  Public
// ======================
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, 'Email already registered');

  const user = await User.create({ name, email, password });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refreshToken in DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  res.status(constants.STATUS.CREATED).json(
    new ApiResponse(constants.STATUS.CREATED, {
      message: 'Registration successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      accessToken,
    })
  );
});

// ======================
// @route   POST /api/auth/login
// @access  Public
// ======================
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const isMatch = await user.matchPassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  res.status(constants.STATUS.OK).json(
    new ApiResponse(constants.STATUS.OK, {
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      accessToken,
    })
  );
});

// ======================
// @route   POST /api/auth/logout
// @access  Private
// ======================
exports.logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(constants.STATUS.OK).json(
    new ApiResponse(constants.STATUS.OK, { message: 'Logged out successfully' })
  );
});

// ======================
// @route   GET /api/auth/me
// @access  Private
// ======================
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  res.status(constants.STATUS.OK).json(
    new ApiResponse(constants.STATUS.OK, { user })
  );
});

// ======================
// @route   POST /api/auth/refresh-token
// @access  Public
// ======================
exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token provided');

  const user = await User.findOne({ refreshToken: token }).select('+refreshToken');
  if (!user) throw new ApiError(401, 'Invalid refresh token');

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, newRefreshToken);

  res.status(constants.STATUS.OK).json(
    new ApiResponse(constants.STATUS.OK, {
      message: 'Token refreshed successfully',
      accessToken,
    })
  );
});

// ======================
// @route   POST /api/auth/forgot-password
// @access  Public
// ======================
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'No user found with this email');

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + constants.PASSWORD.RESET_TOKEN_EXPIRES;
  await user.save({ validateBeforeSave: false });

  // TODO: Send resetToken via email
  // For now return token in response (remove in production)
  res.status(constants.STATUS.OK).json(
    new ApiResponse(constants.STATUS.OK, {
      message: 'Password reset token generated',
      resetToken, // ⚠️ Remove this in production, send via email
    })
  );
});

// ======================
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ======================
exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(constants.STATUS.OK).json(
    new ApiResponse(constants.STATUS.OK, { message: 'Password reset successful' })
  );
});

// ======================
// @route   PUT /api/auth/change-password
// @access  Private
// ======================
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) throw new ApiError(401, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();

  res.status(constants.STATUS.OK).json(
    new ApiResponse(constants.STATUS.OK, { message: 'Password changed successfully' })
  );
});

// ======================
// @route   PUT /api/auth/update-profile
// @access  Private
// ======================
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
  if (existingUser) throw new ApiError(409, 'Email already in use');

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true, runValidators: true }
  );

  res.status(constants.STATUS.OK).json(
    new ApiResponse(constants.STATUS.OK, {
      message: 'Profile updated successfully',
      user,
    })
  );
});
