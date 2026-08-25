import { Response } from 'express';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// GET /api/categories - Fetch all categories ordered by name ASC
export const getCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select('id, name, created_at')
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

// POST /api/categories - Create new category
export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ message: 'Nama kategori wajib diisi' });
      return;
    }

    const trimmedName = name.trim();
    const slug = generateSlug(trimmedName);

    // Check if category name exists
    const { data: existing } = await supabase
      .from(TABLES.CATEGORIES)
      .select('id')
      .ilike('name', trimmedName)
      .maybeSingle();

    if (existing) {
      res.status(400).json({ message: `Kategori '${trimmedName}' sudah ada` });
      return;
    }

    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .insert([{ name: trimmedName, slug }])
      .select('id, name, slug, created_at')
      .single();

    if (error) {
      console.error('DB Create Category Error:', error);
      res.status(500).json({ message: 'Gagal membuat kategori', error: error.message });
      return;
    }

    res.status(201).json({ message: 'Kategori berhasil dibuat', category: data });
  } catch (error: any) {
    console.error('Create Category Exception:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// PUT /api/categories/:id - Update category
export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ message: 'Nama kategori wajib diisi' });
      return;
    }

    const trimmedName = name.trim();
    const slug = generateSlug(trimmedName);

    // Check if another category has same name
    const { data: existing } = await supabase
      .from(TABLES.CATEGORIES)
      .select('id')
      .ilike('name', trimmedName)
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      res.status(400).json({ message: `Kategori '${trimmedName}' sudah ada` });
      return;
    }

    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .update({ name: trimmedName, slug })
      .eq('id', id)
      .select('id, name, slug, created_at')
      .single();

    if (error || !data) {
      console.error('DB Update Category Error:', error);
      res.status(404).json({ message: 'Kategori tidak ditemukan' });
      return;
    }

    res.status(200).json({ message: 'Kategori berhasil diperbarui', category: data });
  } catch (error: any) {
    console.error('Update Category Exception:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// DELETE /api/categories/:id - Delete category
export const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from(TABLES.CATEGORIES)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DB Delete Category Error:', error);
      res.status(500).json({ message: 'Gagal menghapus kategori', error: error.message });
      return;
    }

    res.status(200).json({ message: 'Kategori berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete Category Exception:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
