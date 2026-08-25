import { Response } from 'express';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getSuppliers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { data, error } = await supabase
      .from(TABLES.SUPPLIERS)
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal mengambil data supplier.' });
      return;
    }
    res.status(200).json({ suppliers: data || [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const createSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { name, phone, address, contact_person, email } = req.body;

    const supplierName = name?.trim() || 'Supplier Tanpa Nama';

    const { data, error } = await supabase
      .from(TABLES.SUPPLIERS)
      .insert([
        {
          user_id: userId,
          name: supplierName,
          company_name: supplierName,
          phone: phone || null,
          address: address || null,
          contact_person: contact_person || null,
          email: email || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supplier Save Error:', error);
      res.status(500).json({ message: error.message });
      return;
    }

    res.status(201).json({ message: 'Supplier berhasil ditambahkan.', supplier: data });
  } catch (error: any) {
    console.error('Supplier Save Error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const updateSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;
    const { name, phone, address, contact_person, email } = req.body;

    const supplierName = name?.trim() || 'Supplier Tanpa Nama';

    const { data, error } = await supabase
      .from(TABLES.SUPPLIERS)
      .update({
        name: supplierName,
        company_name: supplierName,
        phone: phone || null,
        address: address || null,
        contact_person: contact_person || null,
        email: email || null,
        updated_at: new Date(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supplier Save Error:', error);
      res.status(500).json({ message: error.message });
      return;
    }

    res.status(200).json({ message: 'Supplier berhasil diubah.', supplier: data });
  } catch (error: any) {
    console.error('Supplier Save Error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const deleteSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const { error } = await supabase
      .from(TABLES.SUPPLIERS)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal menghapus supplier.' });
      return;
    }

    res.status(200).json({ message: 'Supplier berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
