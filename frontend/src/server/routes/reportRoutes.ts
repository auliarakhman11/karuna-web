import { Router } from 'express';
import {
  getFinancialReport,
  getJournalEntries,
  getDashboardSummary,
  getShippingReport,
} from '../controllers/reportController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/financial', getFinancialReport);
router.get('/journals', getJournalEntries);
router.get('/dashboard', getDashboardSummary);
router.get('/shipping', getShippingReport);

export default router;

