// config/email.config.js
import nodemailer from 'nodemailer';
import { config } from './config.index.js';

const createTransporter = () => {
    // Check if all required env variables are present
    if (!config.EMAIL_HOST || !config.EMAIL_PORT || !config.EMAIL_USER || !config.EMAIL_PASS) {
        throw new Error('Email configuration is missing');
    }

    const transporter = nodemailer.createTransport({
        host: config.EMAIL_HOST, // Should be like 'smtp.gmail.com' or 'smtp.mailtrap.io'
        port: config.EMAIL_PORT, // 587 for TLS, 465 for SSL
        secure: config.EMAIL_PORT === 465, // true for 465, false for other ports
        auth: {
            user: config.EMAIL_USER, // Your email address (e.g., 'your-email@gmail.com')
            pass: config.EMAIL_PASS, // Your password or app-specific password
        },
        // Add this to prevent DNS issues
        tls: {
            rejectUnauthorized: false // Only for development, remove in production
        }
    });

    return transporter;
};

export const sendEmail = async ({ email, subject, html }) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"Your App Name" <${config.EMAIL_FROM || config.EMAIL_USER}>`, // Make sure this is properly formatted
            to: email, // This should be the recipient email
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email send error:', error);
        throw error;
    }
};