import User from "../models/userModel.js";
import ImpersonationLog from "../models/impersonationLogModel.js";
import ApiError from "../middlewares/ApiError.js";
import { successResponse } from "../utils/successResponse.js";
import logger from "../config/logger.js";
import mongoose from "mongoose";

// Get all users with advanced filtering
export const adminGetAllUsers = async (req, res, next) => {
    try {
        const {
            page = "1",
            limit = "10",
            search = "",
            role,
            isBlocked,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Build filter query
        let filter = {};

        if (role) {
            filter.role = role;
        }

        if (isBlocked !== undefined) {
            filter.isBlocked = isBlocked === 'true';
        }

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-password -__v")
                .skip(skip)
                .limit(limitNumber)
                .sort(sort)
                .lean(),
            User.countDocuments(filter),
        ]);

        successResponse(res, true, 200, 'Users fetched successfully', {
            users,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
                hasNextPage: pageNumber < Math.ceil(total / limitNumber),
                hasPrevPage: pageNumber > 1
            }
        });

    } catch (error) {
        logger.error("Admin get all users error:", error);
        next(error);
    }
};

// Create user (admin only)
export const adminCreateUser = async (req, res, next) => {
    try {
        const { fullName, email, password, role, age, address, phone, bio } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ApiError(409, "User with this email already exists"));
        }

        // Create new user
        const user = await User.create({
            fullName,
            email,
            password,
            role: role || 'user',
            age,
            address,
            phone,
            bio,
            isEmailVerified: true // Admin created users are auto-verified
        });

        const userResponse = {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked,
            createdAt: user.createdAt
        };

        return successResponse(res, true, 201, "User created successfully", {
            user: userResponse
        });

    } catch (error) {
        logger.error("Admin create user error:", error);
        next(error);
    }
};

// Edit user (admin only)
export const adminEditUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return next(new ApiError(400, "Invalid user ID"));
        }

        const updates = req.body;

        // Remove sensitive fields
        delete updates.password;
        delete updates.__v;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password -__v");

        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        return successResponse(res, true, 200, "User updated successfully", {
            user
        });

    } catch (error) {
        logger.error("Admin edit user error:", error);
        next(error);
    }
};

// Block/Unblock user
export const adminToggleBlockUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return next(new ApiError(400, "Invalid user ID"));
        }

        const user = await User.findById(userId);

        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        // Toggle block status
        user.isBlocked = !user.isBlocked;
        await user.save();

        const message = user.isBlocked ? "User blocked successfully" : "User unblocked successfully";

        return successResponse(res, true, 200, message, {
            isBlocked: user.isBlocked
        });

    } catch (error) {
        logger.error("Admin toggle block user error:", error);
        next(error);
    }
};

// Start impersonating user
export const adminStartImpersonation = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.userId;

        if (!mongoose.isValidObjectId(userId)) {
            return next(new ApiError(400, "Invalid user ID"));
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        // Check if trying to impersonate another admin
        if (user.role === 'admin') {
            return next(new ApiError(403, "Cannot impersonate another admin"));
        }

        // Create impersonation token (you can implement JWT with special claims)
        const impersonationToken = generateImpersonationToken(adminId, userId);

        // Log impersonation start
        await ImpersonationLog.create({
            adminId,
            userId,
            action: 'impersonate_start',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        return successResponse(res, true, 200, "Impersonation started", {
            impersonationToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        logger.error("Admin start impersonation error:", error);
        next(error);
    }
};

// Stop impersonating
export const adminStopImpersonation = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.userId; // This would be the original admin ID from impersonation token

        // Log impersonation end
        await ImpersonationLog.create({
            adminId,
            userId,
            action: 'impersonate_end',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        return successResponse(res, true, 200, "Impersonation stopped");

    } catch (error) {
        logger.error("Admin stop impersonation error:", error);
        next(error);
    }
};

// Get impersonation logs
export const adminGetImpersonationLogs = async (req, res, next) => {
    try {
        const { page = "1", limit = "10", adminId, userId } = req.query;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        let filter = {};
        if (adminId) filter.adminId = adminId;
        if (userId) filter.userId = userId;

        const [logs, total] = await Promise.all([
            ImpersonationLog.find(filter)
                .populate('adminId', 'fullName email')
                .populate('userId', 'fullName email')
                .skip(skip)
                .limit(limitNumber)
                .sort({ timestamp: -1 })
                .lean(),
            ImpersonationLog.countDocuments(filter)
        ]);

        return successResponse(res, true, 200, "Impersonation logs fetched", {
            logs,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber)
            }
        });

    } catch (error) {
        logger.error("Admin get impersonation logs error:", error);
        next(error);
    }
};

// Helper function to generate impersonation token
const generateImpersonationToken = (adminId, userId) => {
    // In production, use JWT with special claims
    // This is a simplified version
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        {
            adminId,
            userId,
            isImpersonating: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};