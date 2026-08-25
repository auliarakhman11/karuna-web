import { Response } from 'express';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const createReturn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { return_type, reference_id, item_id, quantity, reason, return_date, supplier_id, customer_id, customer_name } = req.body;

    const qty = Number(quantity);
    if (!item_id || !qty || qty <= 0) {
      res.status(400).json({ message: 'ID barang dan jumlah retur valid wajib diisi.' });
      return;
    }

    if (return_type !== 'TO_SUPPLIER' && return_type !== 'FROM_CUSTOMER') {
      res.status(400).json({ message: 'Tipe retur harus TO_SUPPLIER atau FROM_CUSTOMER.' });
      return;
    }

    const { data: dbItem, error: fetchError } = await supabase
      .from(TABLES.ITEMS)
      .select('id, name, stock')
      .eq('id', item_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !dbItem) {
      res.status(400).json({ message: 'Barang tidak ditemukan.' });
      return;
    }

    // Resolve customer name if customer_id is provided
    let finalCustomerName = customer_name?.trim() || null;
    if (return_type === 'FROM_CUSTOMER' && customer_id) {
      const { data: dbCustomer } = await supabase
        .from(TABLES.CUSTOMERS)
        .select('id, name')
        .eq('id', customer_id)
        .single();
      if (dbCustomer?.name) {
        finalCustomerName = dbCustomer.name;
      }
    }

    const stockBefore = Number(dbItem.stock) || 0;
    let qtyChange = 0;
    let mutationType = '';

    if (return_type === 'TO_SUPPLIER') {
      if (stockBefore < qty) {
        res.status(400).json({ message: `Stok tidak mencukupi untuk retur ke supplier (Stok: ${stockBefore}).` });
        return;
      }
      qtyChange = -qty;
      mutationType = 'RETURN_SUPPLIER';
    } else {
      qtyChange = qty;
      mutationType = 'RETURN_CUSTOMER';
    }

    const stockAfter = stockBefore + qtyChange;
    const formattedReturnDate = return_date || new Date().toISOString();

    const returnPayload: any = {
      user_id: userId,
      return_type,
      reference_id: reference_id || null,
      item_id,
      quantity: qty,
      reason: reason?.trim() || '',
      return_date: formattedReturnDate,
      supplier_id: return_type === 'TO_SUPPLIER' ? supplier_id || null : null,
      customer_id: return_type === 'FROM_CUSTOMER' ? customer_id || null : null,
      customer_name: return_type === 'FROM_CUSTOMER' ? finalCustomerName : null,
    };

    let returnData: any = null;
    const { data: insertedData, error: returnError } = await supabase
      .from(TABLES.RETURNS)
      .insert([returnPayload])
      .select()
      .single();

    if (returnError) {
      console.warn('Insert return with extra fields failed, trying fallback:', returnError.message);
      // Fallback if some new columns (like customer_id) don't exist yet
      const fallbackPayload: any = {
        user_id: userId,
        return_type,
        reference_id: reference_id || null,
        item_id,
        quantity: qty,
        reason: reason?.trim() || '',
        return_date: formattedReturnDate,
        supplier_id: return_type === 'TO_SUPPLIER' ? supplier_id || null : null,
        customer_name: return_type === 'FROM_CUSTOMER' ? finalCustomerName : null,
      };
      const { data: fbData, error: fbErr } = await supabase
        .from(TABLES.RETURNS)
        .insert([fallbackPayload])
        .select()
        .single();

      if (fbErr) {
        // Fallback minimal
        const minPayload = {
          user_id: userId,
          return_type,
          reference_id: reference_id || null,
          item_id,
          quantity: qty,
          reason: reason?.trim() || '',
        };
        const { data: minData, error: minErr } = await supabase
          .from(TABLES.RETURNS)
          .insert([minPayload])
          .select()
          .single();

        if (minErr) {
          res.status(500).json({ message: minErr.message || 'Gagal menyimpan data retur.' });
          return;
        }
        returnData = minData;
      } else {
        returnData = fbData;
      }
    } else {
      returnData = insertedData;
    }

    await supabase
      .from(TABLES.ITEMS)
      .update({ stock: stockAfter, updated_at: new Date().toISOString() })
      .eq('id', item_id)
      .eq('user_id', userId);

    await supabase.from(TABLES.STOCK_MUTATIONS).insert([
      {
        user_id: userId,
        item_id,
        type: mutationType,
        qty_change: qtyChange,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reference_id: returnData.id,
      },
    ]);

    res.status(201).json({
      message: 'Retur barang berhasil diproses dan stok diperbarui.',
      return: returnData,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const getReturns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;

    // Ambil data raw returns terlebih dahulu
    const { data: rawReturns, error } = await supabase
      .from(TABLES.RETURNS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal mengambil riwayat retur.' });
      return;
    }

    const returnsList = rawReturns || [];

    // Ambil item unik
    const itemIds = Array.from(new Set(returnsList.map((r: any) => r.item_id).filter(Boolean)));
    let itemMap = new Map();
    if (itemIds.length > 0) {
      const { data: dbItems } = await supabase
        .from(TABLES.ITEMS)
        .select('id, name, code, unit')
        .in('id', itemIds);
      itemMap = new Map((dbItems || []).map((i) => [i.id, i]));
    }

    // Ambil supplier unik
    const supplierIds = Array.from(new Set(returnsList.map((r: any) => r.supplier_id).filter(Boolean)));
    let supplierMap = new Map();
    if (supplierIds.length > 0) {
      const { data: dbSuppliers } = await supabase
        .from(TABLES.SUPPLIERS)
        .select('id, name, company_name')
        .in('id', supplierIds);
      supplierMap = new Map((dbSuppliers || []).map((s) => [s.id, s]));
    }

    // Ambil customer unik
    const customerIds = Array.from(new Set(returnsList.map((r: any) => r.customer_id).filter(Boolean)));
    let customerMap = new Map();
    if (customerIds.length > 0) {
      const { data: dbCustomers } = await supabase
        .from(TABLES.CUSTOMERS)
        .select('id, name, phone')
        .in('id', customerIds);
      customerMap = new Map((dbCustomers || []).map((c) => [c.id, c]));
    }

    const enriched = returnsList.map((r: any) => {
      const itemObj = itemMap.get(r.item_id) || null;
      const supplierObj = r.supplier_id ? supplierMap.get(r.supplier_id) || null : null;
      const customerObj = r.customer_id ? customerMap.get(r.customer_id) || null : null;

      return {
        ...r,
        item: itemObj,
        item_name: itemObj?.name || r.item_name || null,
        supplier: supplierObj,
        customer: customerObj,
      };
    });

    res.status(200).json({ returns: enriched });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const deleteReturn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;

    const { data: ret, error: fetchErr } = await supabase
      .from(TABLES.RETURNS)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !ret) {
      res.status(404).json({ message: 'Data retur tidak ditemukan.' });
      return;
    }

    const { item_id, quantity, return_type } = ret;
    const qty = Number(quantity) || 0;

    // Ambil data item
    const { data: dbItem } = await supabase
      .from(TABLES.ITEMS)
      .select('id, stock')
      .eq('id', item_id)
      .eq('user_id', userId)
      .single();

    if (dbItem) {
      const stockBefore = Number(dbItem.stock) || 0;
      // Revert stock:
      // TO_SUPPLIER sebelumnya mengurangi stok (-qty), maka saat dibatalkan stok dikembalikan (+qty)
      // FROM_CUSTOMER sebelumnya menambah stok (+qty), maka saat dibatalkan stok ditarik kembali (-qty)
      const qtyRevert = return_type === 'TO_SUPPLIER' ? qty : -qty;
      const stockAfter = Math.max(0, stockBefore + qtyRevert);

      await supabase
        .from(TABLES.ITEMS)
        .update({ stock: stockAfter, updated_at: new Date().toISOString() })
        .eq('id', item_id)
        .eq('user_id', userId);

      await supabase.from(TABLES.STOCK_MUTATIONS).insert([
        {
          user_id: userId,
          item_id,
          type: 'CANCEL_RETURN',
          qty_change: qtyRevert,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_id: id,
        },
      ]);
    }

    const { error: delErr } = await supabase
      .from(TABLES.RETURNS)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (delErr) {
      res.status(500).json({ message: delErr.message || 'Gagal menghapus transaksi retur.' });
      return;
    }

    res.status(200).json({ message: 'Transaksi retur berhasil dibatalkan dan stok dikembalikan.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const createStockOpname = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { item_id, physical_stock, notes, opname_date } = req.body;

    const physical = Number(physical_stock);
    if (!item_id || isNaN(physical) || physical < 0) {
      res.status(400).json({ message: 'ID barang dan stok fisik valid wajib diisi.' });
      return;
    }

    const { data: dbItem, error: fetchError } = await supabase
      .from(TABLES.ITEMS)
      .select('id, name, stock')
      .eq('id', item_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !dbItem) {
      res.status(400).json({ message: 'Barang tidak ditemukan.' });
      return;
    }

    const systemStock = Number(dbItem.stock) || 0;
    const difference = physical - systemStock;
    const formattedOpnameDate = opname_date || new Date().toISOString();

    const opnamePayload: any = {
      user_id: userId,
      item_id,
      system_stock: systemStock,
      physical_stock: physical,
      difference,
      notes: notes?.trim() || '',
      opname_date: formattedOpnameDate,
    };

    let opnameData: any = null;
    const { data: insertedOpname, error: opnameError } = await supabase
      .from(TABLES.STOCK_OPNAMES)
      .insert([opnamePayload])
      .select()
      .single();

    if (opnameError) {
      console.warn('Insert opname with opname_date failed, trying fallback:', opnameError.message);
      const fallbackPayload: any = {
        user_id: userId,
        item_id,
        system_stock: systemStock,
        physical_stock: physical,
        difference,
        notes: notes?.trim() || '',
      };
      const { data: fbOpname, error: fbErr } = await supabase
        .from(TABLES.STOCK_OPNAMES)
        .insert([fallbackPayload])
        .select()
        .single();

      if (fbErr) {
        res.status(500).json({ message: fbErr.message || 'Gagal menyimpan stock opname.' });
        return;
      }
      opnameData = fbOpname;
    } else {
      opnameData = insertedOpname;
    }

    await supabase
      .from(TABLES.ITEMS)
      .update({ stock: physical, updated_at: new Date().toISOString() })
      .eq('id', item_id)
      .eq('user_id', userId);

    await supabase.from(TABLES.STOCK_MUTATIONS).insert([
      {
        user_id: userId,
        item_id,
        type: 'ADJUSTMENT',
        qty_change: difference,
        stock_before: systemStock,
        stock_after: physical,
        reference_id: opnameData.id,
      },
    ]);

    res.status(201).json({
      message: 'Stock opname berhasil disimpan dan stok disesuaikan.',
      opname: opnameData,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const getStockOpnames = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { data, error } = await supabase
      .from(TABLES.STOCK_OPNAMES)
      .select(`
        *,
        item:${TABLES.ITEMS}(id, name, unit)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Get stock opname join error, fallback simple:', error.message);
      const { data: simpleData, error: simpleErr } = await supabase
        .from(TABLES.STOCK_OPNAMES)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (simpleErr) {
        res.status(500).json({ message: simpleErr.message || 'Gagal mengambil riwayat stock opname.' });
        return;
      }

      const rawOpnames = simpleData || [];
      const itemIds = Array.from(new Set(rawOpnames.map((o: any) => o.item_id).filter(Boolean)));
      let itemMap = new Map();
      if (itemIds.length > 0) {
        const { data: dbItems } = await supabase.from(TABLES.ITEMS).select('id, name, unit').in('id', itemIds);
        itemMap = new Map((dbItems || []).map((i) => [i.id, i]));
      }

      const enriched = rawOpnames.map((o: any) => ({
        ...o,
        item: itemMap.get(o.item_id) || null,
      }));

      res.status(200).json({ opnames: enriched });
      return;
    }

    res.status(200).json({ opnames: data || [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const deleteStockOpname = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;

    const { data: opname, error: fetchErr } = await supabase
      .from(TABLES.STOCK_OPNAMES)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !opname) {
      res.status(404).json({ message: 'Data stock opname tidak ditemukan.' });
      return;
    }

    const { item_id, difference } = opname;
    const diff = Number(difference) || 0;

    // Ambil data item
    const { data: dbItem } = await supabase
      .from(TABLES.ITEMS)
      .select('id, stock')
      .eq('id', item_id)
      .eq('user_id', userId)
      .single();

    if (dbItem) {
      const stockBefore = Number(dbItem.stock) || 0;
      // Revert stock: stock_baru = stock - difference (membalikkan selisih opname)
      const stockAfter = Math.max(0, stockBefore - diff);

      await supabase
        .from(TABLES.ITEMS)
        .update({ stock: stockAfter, updated_at: new Date().toISOString() })
        .eq('id', item_id)
        .eq('user_id', userId);

      await supabase.from(TABLES.STOCK_MUTATIONS).insert([
        {
          user_id: userId,
          item_id,
          type: 'CANCEL_OPNAME',
          qty_change: -diff,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_id: id,
        },
      ]);
    }

    const { error: delErr } = await supabase
      .from(TABLES.STOCK_OPNAMES)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (delErr) {
      res.status(500).json({ message: delErr.message || 'Gagal menghapus catatan stock opname.' });
      return;
    }

    res.status(200).json({ message: 'Catatan stock opname berhasil dibatalkan dan stok dikembalikan ke sebelum opname.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
