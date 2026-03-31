import http from 'http';
import logger from './src/config/logger.js';
import { connectDB } from './src/config/connectDB.js';
import createApp from './app.js';
import { config } from './src/config/config.index.js';

const gracefulShutdown = (server) => {
    server.close(() => {
        logger.info("Server is shutting down gracefully.");
        console.log("Server is shutting down gracefully.");
        process.exit(0);
    });

    setTimeout(() => {
        logger.info("Server is shutting down force fully.");
        console.log("Server is shutting down force fully.");
        process.exit(1);
    }, 5000);
};

const createServer = async () => {
    try {
        const app = createApp();
        const server = http.createServer(app);

        await connectDB();
        // await initializeRedis();
        const PORT = process.env.PORT || 3000;

        server.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            console.log(`Server is running on port ${PORT}`);
        });

        process.on('SIGINT', () => gracefulShutdown(server));
        process.on('SIGTERM', () => gracefulShutdown(server));

    } catch (error) {
        logger.error('Failed to start server:', error);
        console.log('Failed to start server:', error);
        process.exit(1);
    }
};

createServer();