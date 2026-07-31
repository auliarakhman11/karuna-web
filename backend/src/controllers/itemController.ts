import { Response } from 'express';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const isValidUUID = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// GET /api/items/categories or /api/categories - Fetch all categories
export const getCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('DB Fetch Categories Error:', error);
      res.status(500).json({ message: 'Gagal mengambil data kategori', error: error.message });
      return;
    }

    res.status(200).json(data || []);
  } catch (error: any) {
    console.error('Fetch Categories Exception:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// GET /api/items - Fetch all items for current user
export const getItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const { data, error } = await supabase
      .from(TABLES.ITEMS)
      .select(`
        *,
        category:karuna_categories(id, name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('DB Fetch Items Error:', error);
      res.status(500).json({ message: 'Gagal mengambil data barang', error: error.message });
      return;
    }

    res.status(200).json({ items: data });
  } catch (error: any) {
    console.error('Fetch Items Exception:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// POST /api/items - Create new item with duplicate name + category check
export const createItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, category_id, unit, price, stock, description } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ message: 'Nama barang wajib diisi' });
      return;
    }

    const trimmedName = name.trim();
    const validCategoryId = isValidUUID(category_id) ? category_id : null;

    // Check duplicate item by user_id + LOWER(name) + category_id
    let duplicateQuery = supabase
      .from(TABLES.ITEMS)
      .select('id')
      .eq('user_id', userId)
      .ilike('name', trimmedName);

    if (validCategoryId) {
      duplicateQuery = duplicateQuery.eq('category_id', validCategoryId);
    } else {
      duplicateQuery = duplicateQuery.is('category_id', null);
    }

    const { data: existingItem } = await duplicateQuery.maybeSingle();

    if (existingItem) {
      res.status(400).json({
        message: `Barang dengan nama '${trimmedName}' dan kategori yang sama sudah terdaftar!`,
      });
      return;
    }

    const { data, error } = await supabase
      .from(TABLES.ITEMS)
      .insert([
        {
          user_id: userId,
          category_id: validCategoryId,
          name: trimmedName,
          unit: unit?.trim() || 'Batang',
          price: Number(price) || 0,
          stock: Number(stock) || 0,
          description: description?.trim() || '',
        },
      ])
      .select(`
        *,
        category:karuna_categories(id, name)
      `)
      .single();

    if (error) {
      console.error('DB Insert Item Error:', error);
      res.status(500).json({ message: error.message || 'Gagal menambahkan barang', error: error.message });
      return;
    }

    res.status(201).json({ message: 'Barang berhasil ditambahkan', item: data });
  } catch (error: any) {
    console.error('Create Item Exception:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// PUT /api/items/:id - Update item with duplicate name + category check
export const updateItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { name, category_id, unit, price, stock, description } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ message: 'Nama barang wajib diisi' });
      return;
    }

    const trimmedName = name.trim();
    const validCategoryId = isValidUUID(category_id) ? category_id : null;

    // Check duplicate item excluding current item ID
    let duplicateQuery = supabase
      .from(TABLES.ITEMS)
      .select('id')
      .eq('user_id', userId)
      .ilike('name', trimmedName)
      .neq('id', id);

    if (validCategoryId) {
      duplicateQuery = duplicateQuery.eq('category_id', validCategoryId);
    } else {
      duplicateQuery = duplicateQuery.is('category_id', null);
    }

    const { data: existingItem } = await duplicateQuery.maybeSingle();

    if (existingItem) {
      res.status(400).json({
        message: `Barang dengan nama '${trimmedName}' dan kategori yang sama sudah terdaftar!`,
      });
      return;
    }

    const { data, error } = await supabase
      .from(TABLES.ITEMS)
      .update({
        category_id: validCategoryId,
        name: trimmedName,
        unit: unit?.trim() || 'Batang',
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        description: description?.trim() || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        category:karuna_categories(id, name)
      `)
      .single();

    if (error) {
      console.error('DB Update Item Error:', error);
      res.status(500).json({ message: error.message || 'Gagal memperbarui barang', error: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ message: 'Barang tidak ditemukan atau tidak memiliki akses' });
      return;
    }

    res.status(200).json({ message: 'Barang berhasil diperbarui', item: data });
  } catch (error: any) {
    console.error('Update Item Exception:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// DELETE /api/items/:id - Delete item
export const deleteItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const { error } = await supabase
      .from(TABLES.ITEMS)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('DB Delete Item Error:', error);
      res.status(500).json({ message: 'Gagal menghapus barang', error: error.message });
      return;
    }

    res.status(200).json({ message: 'Barang berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete Item Exception:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
