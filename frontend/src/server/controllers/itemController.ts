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

    const items = (data || []).map((item: any) => ({
      ...item,
      buy_price: Number(item.buy_price) || 0,
      price: Number(item.price) || 0,
      sell_price: Number(item.price) || 0,
    }));

    res.status(200).json({ items });
  } catch (error: any) {
    console.error('Fetch Items Exception:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// POST /api/items - Create new item with duplicate name + category check
export const createItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, category_id, unit, price, sell_price, buy_price, stock, description } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ message: 'Nama barang wajib diisi' });
      return;
    }

    const trimmedName = name.trim();
    const validCategoryId = isValidUUID(category_id) ? category_id : null;
    const finalPrice = Number(sell_price ?? price) || 0;
    const finalBuyPrice = Number(buy_price) || 0;

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

    const itemPayload: any = {
      user_id: userId,
      category_id: validCategoryId,
      name: trimmedName,
      unit: unit?.trim() || 'Batang',
      price: finalPrice,
      buy_price: finalBuyPrice,
      stock: Number(stock) || 0,
      description: description?.trim() || '',
    };

    let { data, error } = await supabase
      .from(TABLES.ITEMS)
      .insert([itemPayload])
      .select(`
        *,
        category:karuna_categories(id, name)
      `)
      .single();

    if (error) {
      console.warn('DB Insert Item with buy_price warning, trying fallback without buy_price if column is missing:', error.message);
      // Fallback if buy_price column does not exist yet
      const fallbackPayload = { ...itemPayload };
      delete fallbackPayload.buy_price;

      const { data: fbData, error: fbError } = await supabase
        .from(TABLES.ITEMS)
        .insert([fallbackPayload])
        .select(`
          *,
          category:karuna_categories(id, name)
        `)
        .single();

      if (fbError) {
        console.error('DB Insert Item Error:', fbError);
        res.status(500).json({ message: fbError.message || 'Gagal menambahkan barang', error: fbError.message });
        return;
      }
      data = fbData;
    }

    const enriched = data ? {
      ...data,
      buy_price: Number(data.buy_price) || finalBuyPrice,
      price: Number(data.price) || finalPrice,
      sell_price: Number(data.price) || finalPrice,
    } : data;

    res.status(201).json({ message: 'Barang berhasil ditambahkan', item: enriched });
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
    const { name, category_id, unit, price, sell_price, buy_price, stock, description } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ message: 'Nama barang wajib diisi' });
      return;
    }

    const trimmedName = name.trim();
    const validCategoryId = isValidUUID(category_id) ? category_id : null;
    const finalPrice = Number(sell_price ?? price) || 0;
    const finalBuyPrice = Number(buy_price) || 0;

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

    const updatePayload: any = {
      category_id: validCategoryId,
      name: trimmedName,
      unit: unit?.trim() || 'Batang',
      price: finalPrice,
      buy_price: finalBuyPrice,
      stock: Number(stock) || 0,
      description: description?.trim() || '',
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from(TABLES.ITEMS)
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        category:karuna_categories(id, name)
      `)
      .single();

    if (error) {
      console.warn('DB Update Item with buy_price warning, trying fallback without buy_price:', error.message);
      const fallbackPayload = { ...updatePayload };
      delete fallbackPayload.buy_price;

      const { data: fbData, error: fbError } = await supabase
        .from(TABLES.ITEMS)
        .update(fallbackPayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select(`
          *,
          category:karuna_categories(id, name)
        `)
        .single();

      if (fbError) {
        console.error('DB Update Item Error:', fbError);
        res.status(500).json({ message: fbError.message || 'Gagal memperbarui barang', error: fbError.message });
        return;
      }
      data = fbData;
    }

    if (!data) {
      res.status(404).json({ message: 'Barang tidak ditemukan atau tidak memiliki akses' });
      return;
    }

    const enriched = {
      ...data,
      buy_price: Number(data.buy_price) || finalBuyPrice,
      price: Number(data.price) || finalPrice,
      sell_price: Number(data.price) || finalPrice,
    };

    res.status(200).json({ message: 'Barang berhasil diperbarui', item: enriched });
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
