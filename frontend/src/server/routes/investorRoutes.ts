import { Router } from 'express';
import {
  getInvestors,
  createInvestor,
  updateInvestor,
  deleteInvestor,
  getInvestorDividends,
} from '../controllers/investorController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getInvestors);
router.get('/dividends', getInvestorDividends);
router.post('/', createInvestor);
router.put('/:id', updateInvestor);
router.delete('/:id', deleteInvestor);

export default router;
