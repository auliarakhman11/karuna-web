import { Router } from 'express';
import { getCustomers, createCustomer } from '../controllers/customerController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getCustomers);
router.post('/', createCustomer);

export default router;
