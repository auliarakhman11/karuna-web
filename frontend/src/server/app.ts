import express, { Request, Response } from 'express';

import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import itemRoutes from './routes/itemRoutes';
import categoryRoutes from './routes/categoryRoutes';
import saleRoutes from './routes/saleRoutes';
import customerRoutes from './routes/customerRoutes';
import supplierRoutes from './routes/supplierRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import expenseRoutes from './routes/expenseRoutes';
import investorRoutes from './routes/investorRoutes';
import reportRoutes from './routes/reportRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', expenseRoutes);
app.use('/api', inventoryRoutes);

if (process.env.STANDALONE_SERVER === 'true') {
  app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
  });
}

export default app;

