import { Router } from 'express';
import { createSale, getSales } from '../controllers/saleController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// All sales routes require authentication
router.use(authenticateToken);

router.get('/', getSales);
router.post('/', createSale);

export default router;
