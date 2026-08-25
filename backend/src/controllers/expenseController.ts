import { Response } from 'express';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { createExpenseSchema } from '../utils/validators';
import { createJournalEntries, deleteJournalEntries, ACCOUNTS } from '../helpers/journalHelper';

// ─────────────────────────────────────────────
// EXPENSE CATEGORIES CONTROLLER
// ─────────────────────────────────────────────

// GET /api/expense-categories
export const getExpenseCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;

    const { data, error } = await supabase
      .from(TABLES.EXPENSE_CATEGORIES)
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal mengambil kategori pengeluaran.' });
      return;
    }

    res.status(200).json({ categories: data || [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// POST /api/expense-categories
export const createExpenseCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const rollbackActions: (() => Promise<void>)[] = [];
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Nama kategori pengeluaran wajib diisi.' });
      return;
    }

    const { data, error } = await supabase
      .from(TABLES.EXPENSE_CATEGORIES)
      .insert([
        {
          user_id: userId,
          name: name.trim(),
          description: description?.trim() || null,
        },
      ])
      .select()
      .single();

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal membuat kategori pengeluaran.' });
      return;
    }

    res.status(201).json({ message: 'Kategori pengeluaran berhasil ditambahkan.', category: data });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// PUT /api/expense-categories/:id
export const updateExpenseCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Nama kategori pengeluaran wajib diisi.' });
      return;
    }

    const { data, error } = await supabase
      .from(TABLES.EXPENSE_CATEGORIES)
      .update({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal memperbarui kategori pengeluaran.' });
      return;
    }

    res.status(200).json({ message: 'Kategori pengeluaran berhasil diperbarui.', category: data });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// DELETE /api/expense-categories/:id
export const deleteExpenseCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;

    // Cek apakah kategori digunakan di transaksi pengeluaran
    const { data: linkedExpenses } = await supabase
      .from(TABLES.EXPENSES)
      .select('id')
      .eq('category_id', id)
      .eq('user_id', userId)
      .limit(1);

    if (linkedExpenses && linkedExpenses.length > 0) {
      res.status(400).json({
        message: 'Kategori tidak dapat dihapus karena masih digunakan pada data transaksi pengeluaran.',
      });
      return;
    }

    const { error } = await supabase
      .from(TABLES.EXPENSE_CATEGORIES)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal menghapus kategori pengeluaran.' });
      return;
    }

    res.status(200).json({ message: 'Kategori pengeluaran berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────
// EXPENSES CONTROLLER
// ─────────────────────────────────────────────

// GET /api/expenses
export const getExpenses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { startDate, endDate } = req.query;

    const startStr = typeof startDate === 'string' && startDate.trim() ? startDate.trim() : null;
    const endStr = typeof endDate === 'string' && endDate.trim() ? endDate.trim() : null;

    let query = supabase
      .from(TABLES.EXPENSES)
      .select('*')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false });

    if (startStr) {
      const startIso = startStr.includes('T') ? startStr : `${startStr}T00:00:00.000Z`;
      query = query.gte('expense_date', startIso);
    }
    if (endStr) {
      const endIso = endStr.includes('T') ? endStr : `${endStr}T23:59:59.999Z`;
      query = query.lte('expense_date', endIso);
    }

    const { data: rawExpenses, error: expErr } = await query;
    if (expErr) {
      res.status(500).json({ message: expErr.message || 'Gagal mengambil riwayat pengeluaran.' });
      return;
    }

    const expensesList = rawExpenses || [];

    // Batch enrich category info
    const categoryIds = Array.from(new Set(expensesList.map((e: any) => e.category_id).filter(Boolean)));
    let categoryMap = new Map<string, any>();
    if (categoryIds.length > 0) {
      const { data: dbCategories } = await supabase
        .from(TABLES.EXPENSE_CATEGORIES)
        .select('id, name, description')
        .in('id', categoryIds);
      categoryMap = new Map((dbCategories || []).map((c: any) => [c.id, c]));
    }

    const enrichedExpenses = expensesList.map((e: any) => {
      const cat = e.category_id ? categoryMap.get(e.category_id) || null : null;
      return {
        ...e,
        category: cat,
        category_name: cat?.name || e.category_name || 'Lain-lain',
      };
    });

    res.status(200).json({ expenses: enrichedExpenses });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// POST /api/expenses
export const createExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { category_id, amount, payment_method, expense_date, notes } = req.body;

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      res.status(400).json({ message: 'Nominal pengeluaran valid wajib diisi.' });
      return;
    }

    const formattedDate = expense_date ? new Date(expense_date).toISOString() : new Date().toISOString();

    const payload: any = {
      user_id: userId,
      category_id: category_id || null,
      amount: amountNum,
      payment_method: payment_method || 'Cash',
      expense_date: formattedDate,
      notes: notes?.trim() || '',
    };

    const { data, error } = await supabase
      .from(TABLES.EXPENSES)
      .insert([payload])
      .select()
      .single();

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal mencatat transaksi pengeluaran.' });
      return;
    }

    // Ambil nama kategori untuk deskripsi jurnal
    let categoryName = 'Operasional';
    if (category_id) {
      const { data: catData } = await supabase
        .from(TABLES.EXPENSE_CATEGORIES)
        .select('name')
        .eq('id', category_id)
        .single();
      if (catData?.name) categoryName = catData.name;
    }

    // ── Pencatatan Jurnal Otomatis (Direct Hardcode Insert ke karuna_journals) ──
    const expenseJournals = [
      {
        user_id: userId,
        transaction_type: 'EXPENSE',
        reference_id: data.id,
        journal_date: formattedDate,
        account_code: '6001',
        account_name: `Beban ${categoryName}`,
        debit: amountNum,
        credit: 0,
        notes: notes?.trim() || `Pengeluaran ${categoryName}`,
      },
      {
        user_id: userId,
        transaction_type: 'EXPENSE',
        reference_id: data.id,
        journal_date: formattedDate,
        account_code: '1001',
        account_name: 'Kas & Bank',
        debit: 0,
        credit: amountNum,
        notes: `Kas keluar untuk ${categoryName}`,
      },
    ];

    const { error: expJournalErr } = await supabase
      .from(TABLES.JOURNALS)
      .insert(expenseJournals);

    if (expJournalErr) {
      console.error("GAGAL INSERT JURNAL PENGELUARAN:", expJournalErr);
    } else {
      console.log(`[Journal] 2 ayat jurnal pengeluaran berhasil dicatat untuk ${categoryName}`);
    }

    res.status(201).json({ message: 'Pengeluaran operasional berhasil dicatat.', expense: data });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// PUT /api/expenses/:id
export const updateExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;
    const { category_id, amount, payment_method, expense_date, notes } = req.body;

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      res.status(400).json({ message: 'Nominal pengeluaran valid wajib diisi.' });
      return;
    }

    const formattedDate = expense_date ? new Date(expense_date).toISOString() : new Date().toISOString();

    const payload: any = {
      category_id: category_id || null,
      amount: amountNum,
      payment_method: payment_method || 'Cash',
      expense_date: formattedDate,
      notes: notes?.trim() || '',
    };

    const { data, error } = await supabase
      .from(TABLES.EXPENSES)
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal memperbarui transaksi pengeluaran.' });
      return;
    }

    // Perbarui jurnal: hapus yang lama & buat yang baru secara langsung
    await deleteJournalEntries(userId, id);
    let categoryName = 'Operasional';
    if (category_id) {
      const { data: catData } = await supabase
        .from(TABLES.EXPENSE_CATEGORIES)
        .select('name')
        .eq('id', category_id)
        .single();
      if (catData?.name) categoryName = catData.name;
    }

    const updateJournals = [
      {
        user_id: userId,
        transaction_type: 'EXPENSE',
        reference_id: id,
        journal_date: formattedDate,
        account_code: '6001',
        account_name: `Beban ${categoryName}`,
        debit: amountNum,
        credit: 0,
        notes: notes?.trim() || `Pengeluaran ${categoryName}`,
      },
      {
        user_id: userId,
        transaction_type: 'EXPENSE',
        reference_id: id,
        journal_date: formattedDate,
        account_code: '1001',
        account_name: 'Kas & Bank',
        debit: 0,
        credit: amountNum,
        notes: `Kas keluar untuk ${categoryName}`,
      },
    ];

    const { error: updJournalErr } = await supabase
      .from(TABLES.JOURNALS)
      .insert(updateJournals);

    if (updJournalErr) {
      console.error("GAGAL UPDATE JURNAL PENGELUARAN:", updJournalErr);
    }

    res.status(200).json({ message: 'Transaksi pengeluaran berhasil diperbarui.', expense: data });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// DELETE /api/expenses/:id
export const deleteExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;

    const { error } = await supabase
      .from(TABLES.EXPENSES)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal menghapus data pengeluaran.' });
      return;
    }

    // Hapus jurnal pengeluaran terkait
    await deleteJournalEntries(userId, id);

    res.status(200).json({ message: 'Data pengeluaran berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

