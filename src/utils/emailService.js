import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export const sendEmail = async ({ email, subject, html }) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error('Email send error:', error);
        throw error;
    }
};