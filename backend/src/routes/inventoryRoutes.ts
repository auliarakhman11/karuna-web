import { Router } from 'express';
import {
  createReturn,
  getReturns,
  deleteReturn,
  createStockOpname,
  getStockOpnames,
  deleteStockOpname,
} from '../controllers/inventoryController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.post('/returns', createReturn);
router.get('/returns', getReturns);
router.delete('/returns/:id', deleteReturn);

router.post('/stock-opname', createStockOpname);
router.get('/stock-opname', getStockOpnames);
router.delete('/stock-opname/:id', deleteStockOpname);

export default router;
