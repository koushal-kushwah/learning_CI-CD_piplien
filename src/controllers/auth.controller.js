import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from "../models/userModel.js";
import OAuthProvider from "../models/oauthProviderModel.js";
import PasswordReset from "../models/passwordResetModel.js";
import { genAuthToken } from "../middlewares/auth.js";
import ApiError from "../middlewares/ApiError.js";
import { successResponse } from "../utils/successResponse.js";
import logger from "../config/logger.js";
import { sendEmail } from "../utils/emailService.js";

// Email/Password Registration
export const registerController = async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ApiError(409, "User with this email already exists"));
        }

        // Create new user
        const user = await User.create({
            fullName,
            email,
            password
        });

        // Generate token
        const token = genAuthToken(user._id, user.email);

        const userResponse = {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified
        };

        return successResponse(res, true, 201, "User registered successfully", {
            user: userResponse,
            token
        });

    } catch (error) {
        // Log the error for debugging
        console.error('Registration error:', error);

        // Check for MongoDB duplicate key error
        if (error.code === 11000) {
            return next(new ApiError(409, "User with this email already exists"));
        }

        // Pass other errors to Express error handler
        next(error);
    }
};

// Email/Password Login
export const loginController = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user with password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return next(new ApiError(401, "Invalid email or password"));
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return next(new ApiError(403, "Your account has been blocked. Please contact admin."));
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return next(new ApiError(401, "Invalid email or password"));
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = genAuthToken(user._id, user.email);

        const userResponse = {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
            isEmailVerified: user.isEmailVerified
        };

        return successResponse(res, true, 200, "Login successful", {
            user: userResponse,
            token
        });

    } catch (error) {
        logger.error("Login controller error:", error);
        next(error);
    }
};

// Google OAuth Callback
export const googleOAuthCallback = async (req, res, next) => {
    try {
        // This will be called by Passport after successful Google authentication
        const user = req.user;

        const token = genAuthToken(user._id, user.email);

        const userResponse = {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture
        };

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONT_END_URL;
        res.redirect(`${frontendUrl}/oauth-redirect?token=${token}&user=${encodeURIComponent(JSON.stringify(userResponse))}`);

    } catch (error) {
        logger.error("Google OAuth callback error:", error);
        next(error);
    }
};

// Forgot Password
export const forgotPasswordController = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Validate email format
        if (!email || !isValidEmail(email)) {
            return successResponse(res, true, 200, "If your email is registered, you will receive a password reset link");
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Always return same message for security
            return successResponse(res, true, 200, "If your email is registered, you will receive a password reset link");
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Delete any existing reset tokens for this user
        await PasswordReset.deleteMany({ userId: user._id });

        // Save reset token (expires in 1 hour)
        await PasswordReset.create({
            userId: user._id,
            token: hashedToken,
            expiresAt: new Date(Date.now() + 3600000) // 1 hour
        });

        // Create reset URL
        const resetUrl = `${process.env.FRONT_END_URL}/reset-password?token=${resetToken}`;

        // Send email with error handling
        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Password Reset</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #444;">Password Reset Request</h2>
                            <p>Hello ${user.fullName || 'User'},</p>
                            <p>You requested to reset your password. Click the button below to proceed:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" 
                                   style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 5px; display: inline-block;">
                                    Reset Password
                                </a>
                            </div>
                            <p>Or copy and paste this link in your browser:</p>
                            <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
                            <p><strong>This link will expire in 1 hour.</strong></p>
                            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
                            <hr style="border: 1px solid #eee; margin: 20px 0;">
                            <p style="color: #777; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
                        </div>
                    </body>
                    </html>
                `
            });

            logger.info(`Password reset email sent to: ${user.email}`);
        } catch (emailError) {
            // Log email error but don't expose it to user
            logger.error('Failed to send password reset email:', emailError);

            // Clean up the created token if email fails
            await PasswordReset.deleteMany({ userId: user._id });

            // Still return success to user for security
            return successResponse(res, true, 200, "If your email is registered, you will receive a password reset link");
        }

        return successResponse(res, true, 200, "If your email is registered, you will receive a password reset link");

    } catch (error) {
        logger.error("Forgot password controller error:", error);
        next(error);
    }
};

// Helper function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Reset Password
export const resetPasswordController = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        // Hash the token from request
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find valid reset token
        const passwordReset = await PasswordReset.findOne({
            token: hashedToken,
            expiresAt: { $gt: new Date() },
            used: false
        });

        if (!passwordReset) {
            return next(new ApiError(400, "Invalid or expired reset token"));
        }

        // Update user password
        const user = await User.findById(passwordReset.userId).select('+password');

        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        user.password = newPassword;
        await user.save();

        // Mark token as used
        passwordReset.used = true;
        await passwordReset.save();

        return successResponse(res, true, 200, "Password reset successfully");

    } catch (error) {
        logger.error("Reset password controller error:", error);
        next(error);
    }
};

// Change Password (authenticated users)
export const changePasswordController = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId).select('+password');

        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);

        if (!isPasswordValid) {
            return next(new ApiError(401, "Current password is incorrect"));
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return successResponse(res, true, 200, "Password changed successfully");

    } catch (error) {
        logger.error("Change password controller error:", error);
        next(error);
    }
};

// Logout (client-side only, but we keep for completeness)
export const logoutController = (req, res) => {
    return successResponse(res, true, 200, "Logged out successfully");
};