import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  updateProfile,
  changePassword,
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;
