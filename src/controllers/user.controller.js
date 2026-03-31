import logger from '../config/logger.js';
import ApiError from '../middlewares/ApiError.js';
import User from '../models/userModel.js';
import { successResponse } from '../utils/successResponse.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Upload Profile Picture (for logged-in user)
export const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ApiError(400, 'Please select an image to upload'));
    }

    const userId = req.user.userId; // Get user ID from token

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      try {
        // Get the full path of the old picture
        const oldPicturePath = path.join(process.cwd(), user.profilePicture);

        // Check if file exists and delete it
        if (fs.existsSync(oldPicturePath)) {
          fs.unlinkSync(oldPicturePath);
          logger.info(`Deleted old profile picture: ${oldPicturePath}`);
        }
      } catch (err) {
        logger.error('Error deleting old profile picture:', err);
        // Continue even if old picture deletion fails
      }
    }

    // Save relative path to database
    const relativePath = path.join('src', 'uploads', 'profiles', req.file.filename);
    user.profilePicture = relativePath;
    await user.save();

    // Generate URL for the uploaded image
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;

    return successResponse(res, true, 200, 'Profile picture uploaded successfully', {
      profilePicture: imageUrl,
      filename: req.file.filename,
    });

  } catch (error) {
    logger.error('Upload profile picture error:', error);

    // Delete uploaded file if database operation fails
    if (req.file) {
      try {
        const filePath = path.join(process.cwd(), 'src', 'uploads', 'profiles', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkErr) {
        logger.error('Error deleting uploaded file:', unlinkErr);
      }
    }

    next(error);
  }
};

// Delete Profile Picture (for logged-in user)
export const deleteProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    if (!user.profilePicture) {
      return next(new ApiError(404, 'No profile picture to delete'));
    }

    // Delete the file
    const picturePath = path.join(process.cwd(), user.profilePicture);
    try {
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath);
        logger.info(`Deleted profile picture: ${picturePath}`);
      }
    } catch (err) {
      logger.error('Error deleting profile picture file:', err);
    }

    // Remove from database
    user.profilePicture = null;
    await user.save();

    return successResponse(res, true, 200, 'Profile picture deleted successfully');

  } catch (error) {
    logger.error('Delete profile picture error:', error);
    next(error);
  }
};

// Get Own Profile (for logged-in user)
export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .select('-password -__v')
      .lean();

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    // Generate full URL for profile picture if exists
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    if (user.profilePicture) {
      const filename = path.basename(user.profilePicture);
      user.profilePictureUrl = `${baseUrl}/uploads/profiles/${filename}`;
    }

    return successResponse(res, true, 200, 'Profile fetched successfully', {
      user,
    });

  } catch (error) {
    logger.error('Get my profile error:', error);
    next(error);
  }
};

// Get User Profile by ID (for viewing other users' profiles)
export const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ApiError(400, 'Invalid user ID format'));
    }

    const user = await User.findById(userId)
      .select('-password -__v')
      .lean();

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    // Generate full URL for profile picture if exists
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    if (user.profilePicture) {
      const filename = path.basename(user.profilePicture);
      user.profilePictureUrl = `${baseUrl}/uploads/profiles/${filename}`;
    }

    return successResponse(res, true, 200, 'User profile fetched successfully', {
      user,
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    next(error);
  }
};

// Update Own Profile
export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Remove sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates.isBlocked;
    delete updates._id;
    delete updates.email; // Prevent email update through this route

    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    // Handle profile picture removal
    if (updates.removeProfilePicture === 'true' && user.profilePicture) {
      try {
        const picturePath = path.join(process.cwd(), user.profilePicture);
        if (fs.existsSync(picturePath)) {
          fs.unlinkSync(picturePath);
        }
        updates.profilePicture = null;
      } catch (err) {
        logger.error('Error deleting profile picture:', err);
      }
      delete updates.removeProfilePicture;
    }

    // Update user
    Object.assign(user, updates);
    await user.save();

    // Generate response with image URL
    const userResponse = user.toJSON();
    if (userResponse.profilePicture) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const filename = path.basename(userResponse.profilePicture);
      userResponse.profilePictureUrl = `${baseUrl}/uploads/profiles/${filename}`;
    }

    return successResponse(res, true, 200, 'Profile updated successfully', {
      user: userResponse,
    });

  } catch (error) {
    logger.error('Update user profile error:', error);
    next(error);
  }
};

// Get All Users (with profile picture URLs)
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = '1', limit = '10', search = '', role, isBlocked } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter query
    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (isBlocked !== undefined && isBlocked !== '') {
      filter.isBlocked = isBlocked === 'true';
    }

    // Add search functionality
    if (search && search.trim() !== '') {
      filter.$or = [
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -__v')
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(filter),
    ]);

    // Add full URLs for profile pictures
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const usersWithUrls = users.map((user) => {
      if (user.profilePicture) {
        const filename = path.basename(user.profilePicture);
        user.profilePictureUrl = `${baseUrl}/uploads/profiles/${filename}`;
      }
      return user;
    });

    successResponse(res, true, 200, 'Users fetched successfully', {
      users: usersWithUrls,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber < Math.ceil(total / limitNumber),
        hasPrevPage: pageNumber > 1,
      },
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    next(error);
  }
};

// Delete User (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ApiError(400, 'Invalid user ID format'));
    }

    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return next(new ApiError(403, 'Only admins can delete users'));
    }

    const user = await User.findById(userId);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    // Delete profile picture if exists
    if (user.profilePicture) {
      try {
        const picturePath = path.join(process.cwd(), user.profilePicture);
        if (fs.existsSync(picturePath)) {
          fs.unlinkSync(picturePath);
          logger.info(`Deleted profile picture: ${picturePath}`);
        }
      } catch (err) {
        logger.error('Error deleting profile picture:', err);
        // Continue with user deletion even if picture deletion fails
      }
    }

    await User.findByIdAndDelete(userId);

    successResponse(res, true, 200, 'User deleted successfully');
  } catch (error) {
    logger.error('Delete user error:', error);
    next(error);
  }
};