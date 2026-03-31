import jwt from 'jsonwebtoken';
import ApiError from './ApiError.js';
import logger from '../config/logger.js';
import { config } from '../config/config.index.js';
import User from '../models/userModel.js';

export const genAuthToken = (userId, email) => {
  if (!userId || !email) {
    throw new ApiError(404, 'Credentials required to generate token.');
  }

  const options = {
    expiresIn: config.EXPIN,
  };

  const token = jwt.sign(
    {
      userId: userId,
      email: email,
    },
    config.JWT_SECRET,
    options,
  );

  return token;
};

export const tokenVerification = async (req, res, next) => {
  try {
    const authHeaders = req.headers.authorization;

    if (!authHeaders || !authHeaders.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Authorization token missing or invalid.'));
    }

    const token = authHeaders.split(' ')[1];

    if (!token) {
      return next(new ApiError(401, 'Token not found in authorization header.'));
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (!decoded) {
      return next(new ApiError(401, 'Token is not verified. Please try again later.'));
    }

    // Check if this is an impersonation token
    if (decoded.isImpersonating) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        adminId: decoded.adminId,
        isImpersonating: true,
      };
    } else {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        isImpersonating: false,
      };
    }

    // Get user role from database (optional, for role-based checks)
    const user = await User.findById(req.user.userId).select('role isBlocked');

    if (user) {
      req.user.role = user.role;
      req.user.isBlocked = user.isBlocked;

      // Check if user is blocked
      if (user.isBlocked && !req.user.isImpersonating) {
        return next(new ApiError(403, 'Your account has been blocked. Please contact admin.'));
      }
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token has expired.'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token.'));
    }
    logger.error('JWT Verification error:', error);
    next(new ApiError(500, 'Token verification failed.'));
  }
};

// Admin only middleware
export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Access denied. Admin only.'));
  }
  next();
};

// Optional: Check if user is impersonating
export const checkImpersonation = (req, res, next) => {
  if (req.user.isImpersonating) {
    res.setHeader('X-Impersonating', 'true');
    res.setHeader('X-Original-Admin', req.user.adminId);
  }
  next();
};