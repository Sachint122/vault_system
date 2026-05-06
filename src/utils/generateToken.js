const jwt = require('jsonwebtoken');
const constants = require('../config/constants');

// ======================
// Generate Access Token (Short-lived)
// ======================
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: constants.JWT.ACCESS_EXPIRES_IN } // 15m
  );
};

// ======================
// Generate Refresh Token (Long-lived)
// ======================
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: constants.JWT.REFRESH_EXPIRES_IN } // 7d
  );
};

// ======================
// Set Both Tokens in Cookies
// ======================
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Access Token Cookie (15 minutes)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh Token Cookie (7 days)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies,
};
