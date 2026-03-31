import app from './app.js';
import { connectDB } from './src/config/connectDB.js';
import logger from './src/config/logger.js';

let server;

const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3000;
        server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// ✅ Only start when this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}

export { server, startServer };