import { Router } from 'express';
import {
  getCategories,
  getItems,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/itemController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Apply authMiddleware to all routes in itemRoutes
router.use(authenticateToken);

router.get('/categories', getCategories);
router.get('/', getItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
