import express from 'express';
import { rateLimiter } from '../middlewares/rateLimiter.js';
import {
  getUserProfile,
  getMyProfile,
  updateUserProfile,
  deleteUser,
  getAllUsers,
  uploadProfilePicture,
  deleteProfilePicture,
} from '../controllers/user.controller.js';
import { tokenVerification } from '../middlewares/auth.js';
import { uploadSingle, handleMulterError } from '../middlewares/multer.js';
import { updatedUserValidation, validate } from '../validators/validators.js';

const router = express.Router();

// Protect all user routes
router.use(tokenVerification);

// Profile picture routes (for logged-in user)
router.post('/profile-picture',
  rateLimiter(5, 3600), // 5 uploads per hour
  uploadSingle,
  handleMulterError,
  uploadProfilePicture,
);

router.delete('/profile-picture',
  rateLimiter(5, 3600),
  deleteProfilePicture,
);

// Get own profile
router.get('/me',
  rateLimiter(30, 60),
  getMyProfile,
);

// User profile routes
router.get('/profile/:userId',
  rateLimiter(30, 60),
  getUserProfile,
);

// Update own profile
router.put('/profile',
  rateLimiter(10, 60),
  updatedUserValidation(),
  validate,
  updateUserProfile,
);

// User management routes
router.get('/all',
  rateLimiter(20, 60),
  getAllUsers,
);

// Delete user (admin only)
router.delete('/:userId',
  rateLimiter(5, 60),
  deleteUser,
);

export default router;