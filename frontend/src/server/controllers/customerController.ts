import { Response } from 'express';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

// GET /api/customers - Get all customers for logged-in user
export const getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch Customers Error:', error);
      res.status(500).json({ message: 'Gagal mengambil data pelanggan.', error: error.message });
      return;
    }

    res.status(200).json({ customers: data || [] });
  } catch (error: any) {
    console.error('Fetch Customers Exception:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// POST /api/customers - Create new customer
export const createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, phone, address } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ message: 'Nama pelanggan wajib diisi.' });
      return;
    }

    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .insert([
        {
          user_id: userId,
          name: name.trim(),
          phone: phone?.trim() || '',
          address: address?.trim() || '',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Create Customer Error:', error);
      res.status(500).json({ message: error.message || 'Gagal menambahkan pelanggan.', error: error.message });
      return;
    }

    res.status(201).json({ message: 'Pelanggan berhasil ditambahkan.', customer: data });
  } catch (error: any) {
    console.error('Create Customer Exception:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
