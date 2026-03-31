import helmet from 'helmet';
import passport from 'passport';
import './src/config/passport.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path'; // Add this import
import { config } from './src/config/config.index.js';
import router from './src/routers/index.router.js';
import ErrorHandler from './src/middlewares/ErrorHandler.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createApp = () => {
  const app = express();

  // Security middlewares
  app.use(helmet()); // Adds various HTTP headers for security

  app.use(cors({
    origin: config.FRONT_END_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-ADMIN', 'X-Impersonating'],
  }));

  // Body parsers with size limits
  app.use(express.json({ limit: '10MB' })); // Reduced from 500MB for security
  app.use(express.urlencoded({ extended: true, limit: '10MB' }));

  // Data sanitization against NoSQL injection
  const sanitizeMongoQuery = (req, res, next) => {
    // Function to recursively sanitize objects
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;

      Object.keys(obj).forEach((key) => {
        const value = obj[key];

        // Check for MongoDB operators
        if (key.startsWith('$')) {
          delete obj[key];
        } else if (typeof value === 'object') {
          sanitize(value);
        }
      });

      return obj;
    };

    try {
      // Sanitize different parts of the request
      if (req.body) req.body = sanitize(req.body);
      if (req.query) {
        // Create a new object instead of trying to modify the getter
        const sanitizedQuery = sanitize({ ...req.query });
        // Replace the query object (this works because we're not modifying the getter directly)
        Object.keys(req.query).forEach((key) => delete req.query[key]);
        Object.assign(req.query, sanitizedQuery);
      }
      if (req.params) {
        const sanitizedParams = sanitize({ ...req.params });
        Object.keys(req.params).forEach((key) => delete req.params[key]);
        Object.assign(req.params, sanitizedParams);
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  // Use it in your app
  app.use(sanitizeMongoQuery);

  app.use(cookieParser());

  // Initialize Passport
  app.use(passport.initialize());

  // Routes
  app.use('/api/v1', router);
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // Error handler (should be last)
  app.use(ErrorHandler);

  return app;
};

export default createApp;