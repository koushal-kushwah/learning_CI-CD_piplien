import mongoose from 'mongoose';
import { config } from './config.index.js';
import logger from './logger.js';

export const connectDB = async () => {
    try {
        const connect = await mongoose.connect(config.DB_STRING);
        logger.info(`MongoDB Connected: ${connect.connection.host}: ${config.DB_STRING}`);
        console.log(`MongoDB Connected: ${connect.connection.host}: ${config.DB_STRING}`);
    } catch (error) {
        logger.error('Database connection error:', error);
        console.log('Database connection error:', error);
        process.exit(1);
    }
};