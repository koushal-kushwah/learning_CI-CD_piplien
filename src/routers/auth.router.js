import express from 'express';
import passport from 'passport';
import { rateLimiter } from '../middlewares/rateLimiter.js';
import {
  registerValidator,
  validate,
} from '../validators/validators.js';
import {
  registerController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  changePasswordController,
  logoutController,
  googleOAuthCallback,
} from '../controllers/auth.controller.js';
import { tokenVerification } from '../middlewares/auth.js';

const router = express.Router();

// Email/Password routes
router.post('/register', rateLimiter(5, 300), registerValidator(), validate, registerController);
router.post('/login', rateLimiter(10, 300), loginController);
router.post('/forgot-password', rateLimiter(3, 3600), forgotPasswordController);
router.post('/reset-password', rateLimiter(3, 3600), resetPasswordController);
router.post('/change-password', tokenVerification, changePasswordController);
router.post('/logout', tokenVerification, logoutController);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleOAuthCallback,
);

export default router;