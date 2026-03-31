import express from 'express';
import { tokenVerification, adminOnly } from '../middlewares/auth.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';
import {
  adminGetAllUsers,
  adminCreateUser,
  adminEditUser,
  adminToggleBlockUser,
  adminStartImpersonation,
  adminStopImpersonation,
  adminGetImpersonationLogs,
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(tokenVerification);
router.use(adminOnly);

// User management
router.get('/users', rateLimiter(30, 60), adminGetAllUsers);
router.post('/users', rateLimiter(10, 60), adminCreateUser);
router.put('/users/:userId', rateLimiter(10, 60), adminEditUser);
router.patch('/users/:userId/toggle-block', rateLimiter(10, 60), adminToggleBlockUser);

// Impersonation
router.post('/impersonate/:userId/start', rateLimiter(5, 60), adminStartImpersonation);
router.post('/impersonate/:userId/stop', rateLimiter(5, 60), adminStopImpersonation);
router.get('/impersonation-logs', rateLimiter(20, 60), adminGetImpersonationLogs);

export default router;