import http from 'http';
import logger from './src/config/logger.js';
import { connectDB } from './src/config/connectDB.js';
import app from './app.js';

const createServer = async () => {
    try {
        await connectDB();
        // await initializeRedis();
        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            console.log(`Server is running on port ${PORT}`);
        });
        logger.error('Failed to start server:', error);
        console.log('Failed to start server:', error);
        process.exit(1);
    }
};

createServer();