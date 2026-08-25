import { Router } from 'express';
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  cancelPurchase,
  paySupplierDebt,
  deleteSupplierDebtPayment,
} from '../controllers/purchaseController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.delete('/:id', cancelPurchase);
router.post('/:id/pay-debt', paySupplierDebt);
router.delete('/debt-payments/:paymentId', deleteSupplierDebtPayment);

export default router;
