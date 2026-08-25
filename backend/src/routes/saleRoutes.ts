import { Router } from 'express';
import {
  createSale,
  getSales,
  voidSale,
  payCustomerDebt,
  deleteCustomerDebtPayment,
} from '../controllers/saleController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// All sales routes require authentication
router.use(authenticateToken);

router.get('/', getSales);
router.post('/', createSale);
router.delete('/:id', voidSale);
router.post('/:id/pay-debt', payCustomerDebt);
router.delete('/debt-payments/:paymentId', deleteCustomerDebtPayment);

export default router;
