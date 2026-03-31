import { body, validationResult } from "express-validator";
import User from "../models/userModel.js";

export const registerValidator = () => [
    body("fullName")
        .trim()
        .notEmpty().withMessage("Full name is required.")
        .isLength({ min: 5, max: 50 }).withMessage("Full name must be between 5 and 50 characters.")
        .matches(/^[a-zA-Z\s]+$/).withMessage("Full name can only contain letters and spaces.")
        .escape(),
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required.")
        .isEmail().withMessage("Invalid email address.")
        .normalizeEmail()
        .custom(async (email) => {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error("Email already in use");
            }
            return true;
        }),
    body("password")
        .trim()
        .notEmpty().withMessage("Password is required.")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
        .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
        .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter.")
        .matches(/[0-9]/).withMessage("Password must contain at least one number.")
        .matches(/[@$!%*?&#]/).withMessage("Password must contain at least one special character."),
];

export const updatedUserValidation = () => [
    body("fullName")
        .optional()
        .trim()
        .notEmpty().withMessage("Full name cannot be empty if provided.")
        .isLength({ min: 2, max: 50 }).withMessage("Full name must be between 2 and 50 characters.")
        .matches(/^[a-zA-Z\s]+$/).withMessage("Full name can only contain letters and spaces.")
        .escape(),
    body("phone")
        .optional()
        .trim()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).withMessage("Invalid phone number format.")
        .isLength({ min: 10, max: 15 }).withMessage("Phone number must be between 10 and 15 digits."),
    body("bio")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Bio cannot exceed 500 characters.")
        .escape(),
    body("age")
        .optional()
        .isInt({ min: 18, max: 100 }).withMessage("Age must be between 18 and 100.")
        .toInt(),
    body("address")
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage("Address cannot exceed 200 characters.")
        .escape(),
];

export const profilePictureValidator = () => [
    body('profilePicture')
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error('Profile picture is required');
            }

            // Check file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed');
            }

            // Check file size (5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (req.file.size > maxSize) {
                throw new Error('File size must be less than 5MB');
            }

            return true;
        })
];

export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map((error) => ({
            field: error.path,
            message: error.msg,
        }));

        return res.status(422).json({
            success: false,
            message: "Validation failed",
            errors: formattedErrors,
        });
    }

    next();
};