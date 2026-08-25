import { Router } from 'express';
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

// Expense Categories Direct Routes
router.get('/categories', getExpenseCategories);
router.post('/categories', createExpenseCategory);
router.put('/categories/:id', updateExpenseCategory);
router.delete('/categories/:id', deleteExpenseCategory);

// Direct /api/expense-categories routes
router.get('/expense-categories', getExpenseCategories);
router.post('/expense-categories', createExpenseCategory);
router.put('/expense-categories/:id', updateExpenseCategory);
router.delete('/expense-categories/:id', deleteExpenseCategory);

// Expenses Routes
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

export default router;
