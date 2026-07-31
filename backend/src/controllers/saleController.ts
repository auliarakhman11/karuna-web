import { Response } from 'express';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

// Helper: generate invoice number e.g. INV-1700000000000
const generateInvoiceNumber = (): string => {
  return `INV-${Date.now()}`;
};

// ─────────────────────────────────────────────
// POST /api/sales — Create a new sale transaction
// ─────────────────────────────────────────────
export const createSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { items, payment_method, notes } = req.body;

    // Basic validation
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Keranjang tidak boleh kosong.' });
      return;
    }

    // ── Step 1: Validate stock for all items before touching the database ──
    const itemIds: string[] = items.map((i: any) => i.item_id);

    const { data: dbItems, error: fetchError } = await supabase
      .from(TABLES.ITEMS)
      .select('id, name, stock, price, unit')
      .in('id', itemIds)
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Sale Error Detail:', fetchError);
      res.status(500).json({ message: fetchError.message || 'Gagal memvalidasi stok barang.' });
      return;
    }

    // Build a lookup map
    const dbItemMap = new Map<string, any>(dbItems?.map((item) => [item.id, item]) ?? []);

    for (const orderLine of items) {
      const { item_id, quantity } = orderLine;
      const dbItem = dbItemMap.get(item_id);

      if (!dbItem) {
        res.status(400).json({ message: `Barang dengan ID ${item_id} tidak ditemukan.` });
        return;
      }

      if (dbItem.stock < quantity) {
        res.status(400).json({
          message: `Stok ${dbItem.name} tidak mencukupi (Sisa: ${dbItem.stock})`,
        });
        return;
      }
    }

    // ── Step 2: Calculate total amount ──
    const totalAmount = items.reduce((sum: number, line: any) => {
      return sum + Number(line.price) * Number(line.quantity);
    }, 0);

    const invoiceNumber = generateInvoiceNumber();

    // ── Step 3: Insert into karuna_sales ──
    const { data: saleData, error: saleError } = await supabase
      .from(TABLES.SALES)
      .insert([
        {
          user_id: userId,
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          payment_method: payment_method || 'Tunai',
          status: 'completed',
          notes: notes?.trim() || '',
        },
      ])
      .select()
      .single();

    if (saleError) {
      console.error('Sale Error Detail:', saleError);
      res.status(500).json({ message: saleError.message || 'Gagal menyimpan transaksi.' });
      return;
    }

    // ── Step 4: Insert sale items ──
    const saleItemsToInsert = items.map((item: any) => ({
      sale_id: saleData.id,
      item_id: item.item_id || item.id,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.price) || 0,
      price: Number(item.price) || 0,
      subtotal: (Number(item.quantity) || 1) * (Number(item.price) || 0),
    }));

    const { error: itemsError } = await supabase
      .from(TABLES.SALE_ITEMS)
      .insert(saleItemsToInsert);

    if (itemsError) {
      console.error('Sale Items Insert Error:', itemsError);
      // Rollback: delete the sale header
      await supabase.from(TABLES.SALES).delete().eq('id', saleData.id);
      res.status(500).json({ message: itemsError.message || 'Gagal menyimpan detail transaksi.' });
      return;
    }

    // ── Step 5: Deduct stock for each item ──
    for (const orderLine of items) {
      const { item_id, quantity } = orderLine;
      const dbItem = dbItemMap.get(item_id);
      const newStock = dbItem.stock - Number(quantity);

      const { error: stockError } = await supabase
        .from(TABLES.ITEMS)
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', item_id)
        .eq('user_id', userId);

      if (stockError) {
        console.error('Sale Error Detail (Stock Deduct):', stockError);
      }
    }

    res.status(201).json({
      message: 'Transaksi berhasil disimpan.',
      sale: {
        ...saleData,
        items: saleItemsToInsert,
      },
    });
  } catch (error: any) {
    console.error('Sale Error Detail:', error);
    res.status(500).json({ message: error.message || 'Gagal menyimpan transaksi' });
  }
};

// ─────────────────────────────────────────────
// GET /api/sales — Fetch all sales for current user
// ─────────────────────────────────────────────
export const getSales = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const { data, error } = await supabase
      .from(TABLES.SALES)
      .select(`
        id,
        user_id,
        invoice_number,
        total_amount,
        payment_method,
        status,
        notes,
        created_at,
        sale_items:karuna_sale_items(
          id,
          quantity,
          unit_price,
          subtotal,
          item:karuna_items(id, name, unit)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Sale Error Detail:', error);
      res.status(500).json({ message: error.message || 'Gagal mengambil riwayat transaksi.', error: error.message });
      return;
    }

    res.status(200).json({ sales: data || [] });
  } catch (error: any) {
    console.error('Sale Error Detail:', error);
    res.status(500).json({ message: error.message || 'Internal server error', error: error.message });
  }
};
