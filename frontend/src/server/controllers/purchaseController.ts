import { Response } from 'express';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { createPurchaseSchema } from '../utils/validators';
import { createJournalEntries, deleteJournalEntries, ACCOUNTS } from '../helpers/journalHelper';

const generatePoNumber = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PO-${dateStr}-${randomSuffix}`;
};

export const createPurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const rollbackActions: (() => Promise<void>)[] = [];
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { supplier_id, payment_type, paid_amount, due_date, notes, status, purchase_date } = req.body;

    const rawItems = req.body.items || req.body.cart || req.body.products || req.body.purchase_items || [];
    console.log("=== SIMPAN PO DEBUG ===");
    console.log("Raw Items Received Count:", rawItems.length);
    console.log("Raw Items Content:", JSON.stringify(rawItems));

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      res.status(400).json({ message: 'Daftar item pembelian tidak boleh kosong.' });
      return;
    }

    const itemIds: string[] = rawItems.map((i: any) => i.item_id || i.id || i.product_id).filter(Boolean);
    const { data: dbItems, error: fetchError } = await supabase
      .from(TABLES.ITEMS)
      .select('id, name, stock, cost_price')
      .in('id', itemIds)
      .eq('user_id', userId);

    if (fetchError) {
      res.status(500).json({ message: fetchError.message || 'Gagal memvalidasi barang.' });
      return;
    }

    const dbItemMap = new Map<string, any>(dbItems?.map((item) => [item.id, item]) ?? []);

    for (const line of rawItems) {
      const lineItemId = line.item_id || line.id || line.product_id;
      if (!dbItemMap.has(lineItemId)) {
        res.status(400).json({ message: `Barang ID ${lineItemId} tidak ditemukan.` });
        return;
      }
    }

    let totalAmount = 0;
    for (const line of rawItems) {
      const qty = Number(line.quantity || line.qty || 1);
      const unitPrice = Number(line.unit_price || line.price || line.harga || 0);
      totalAmount += qty * unitPrice;
    }

    const paidNum = Number(paid_amount) || 0;
    let paymentStatus = 'BELUM_LUNAS';
    if (paidNum >= totalAmount) {
      paymentStatus = 'LUNAS';
    } else if (paidNum > 0) {
      paymentStatus = 'CICILAN';
    }

    const dueAmount = Math.max(0, totalAmount - paidNum);
    const poNumber = generatePoNumber();
    const formattedPurchaseDate = purchase_date || new Date().toISOString();

    const { data: purchaseData, error: purchaseError } = await supabase
      .from(TABLES.PURCHASES)
      .insert([
        {
          user_id: userId,
          supplier_id: supplier_id || null,
          po_number: poNumber,
          invoice_number: poNumber,
          total_amount: totalAmount,
          payment_type: payment_type || 'CASH',
          payment_status: paymentStatus,
          paid_amount: paidNum,
          due_amount: dueAmount,
          due_date: due_date || null,
          purchase_date: formattedPurchaseDate,
          notes: notes?.trim() || '',
          status: status || 'COMPLETED',
        },
      ])
      .select()
      .single();

    if (purchaseError) {
      console.error('Purchase Insert Error:', purchaseError);
      res.status(500).json({ message: purchaseError.message || 'Gagal menyimpan pembelian.' });
      return;
    }

    const purchaseItemsToInsert = rawItems.map((it: any) => {
      const lineItemId = it.item_id || it.id || it.product_id;
      const qty = Number(it.quantity || it.qty || 1);
      const unitPrice = Number(it.unit_price || it.price || it.harga || 0);
      const subtotal = Number(it.subtotal || (qty * unitPrice));
      return {
        purchase_id: purchaseData.id,
        item_id: lineItemId,
        quantity: qty,
        unit_price: unitPrice,
        subtotal: subtotal,
      };
    });

    if (purchaseItemsToInsert.length > 0) {
      const { error: itemsError } = await supabase
        .from(TABLES.PURCHASE_ITEMS)
        .insert(purchaseItemsToInsert);

      if (itemsError) {
        console.error('Error inserting purchase items:', itemsError);
        await supabase.from(TABLES.PURCHASES).delete().eq('id', purchaseData.id);
        res.status(500).json({ message: itemsError.message || 'Gagal menyimpan detail pembelian.' });
        return;
      }
    }

    // Auto Add Stock, Record Mutation, & Price History
    for (const line of rawItems) {
      const lineItemId = line.item_id || line.id || line.product_id;
      const qty = Number(line.quantity || line.qty || 1);
      const unitPrice = Number(line.unit_price || line.price || line.harga || 0);
      const dbItem = dbItemMap.get(lineItemId);
      const stockBefore = Number(dbItem.stock) || 0;
      const qtyChange = Number(qty);
      const stockAfter = stockBefore + qtyChange;
      const newCostPrice = unitPrice || Number(dbItem.cost_price) || 0;

      await supabase
        .from(TABLES.ITEMS)
        .update({
          stock: stockAfter,
          cost_price: newCostPrice,
          buy_price: unitPrice || newCostPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lineItemId)
        .eq('user_id', userId);

      await supabase.from(TABLES.STOCK_MUTATIONS).insert([
        {
          user_id: userId,
          item_id: lineItemId,
          type: 'PURCHASE',
          qty_change: qtyChange,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_id: purchaseData.id,
        },
      ]);

      await supabase.from(TABLES.PRICE_HISTORIES).insert([
        {
          user_id: userId,
          item_id: lineItemId,
          cost_price: newCostPrice,
          reference_id: purchaseData.id,
        },
      ]);
    }

    // Simpan Log Pembayaran Awal jika paid_amount > 0
    if (paidNum > 0) {
      try {
        const pInitial = {
          user_id: userId,
          purchase_id: purchaseData.id,
          supplier_id: supplier_id || null,
          amount: paidNum,
          amount_paid: paidNum,
          payment_method: payment_type || 'CASH',
          payment_date: formattedPurchaseDate,
          notes: 'Pembayaran Awal Transaksi',
          created_at: new Date().toISOString(),
        };

        const resInit = await supabase.from(TABLES.SUPPLIER_DEBT_PAYMENTS).insert([pInitial]);
        if (resInit.error) {
          // Coba amount_paid saja
          await supabase.from(TABLES.SUPPLIER_DEBT_PAYMENTS).insert([{
            user_id: userId,
            purchase_id: purchaseData.id,
            supplier_id: supplier_id || null,
            amount_paid: paidNum,
            payment_method: payment_type || 'CASH',
            payment_date: formattedPurchaseDate,
            notes: 'Pembayaran Awal Transaksi',
            created_at: new Date().toISOString(),
          }]);
        }
        console.log('Initial Payment Log inserted for PO:', purchaseData.id, 'Amount:', paidNum);
      } catch (logErr) {
        console.warn('Initial payment log insert error (non-fatal):', logErr);
      }
    }

    // ── Pencatatan Jurnal Otomatis (Direct Hardcode Insert ke karuna_journals) ──
    const journalEntries: any[] = [
      {
        user_id: userId,
        transaction_type: 'PURCHASE',
        reference_id: purchaseData.id,
        journal_date: formattedPurchaseDate,
        account_code: '1003',
        account_name: 'Persediaan Barang Dagang',
        debit: totalAmount,
        credit: 0,
        description: `Persediaan masuk dari pembelian ${poNumber}`,
      },
    ];

    if (paidNum > 0) {
      journalEntries.push({
        user_id: userId,
        transaction_type: 'PURCHASE',
        reference_id: purchaseData.id,
        journal_date: formattedPurchaseDate,
        account_code: '1001',
        account_name: 'Kas & Bank',
        debit: 0,
        credit: paidNum,
        description: `Pembayaran kas pembelian ${poNumber}`,
      });
    }

    if (dueAmount > 0) {
      journalEntries.push({
        user_id: userId,
        transaction_type: 'PURCHASE',
        reference_id: purchaseData.id,
        journal_date: formattedPurchaseDate,
        account_code: '2001',
        account_name: 'Hutang Supplier',
        debit: 0,
        credit: dueAmount,
        description: `Hutang supplier pembelian ${poNumber}`,
      });
    }

    if (journalEntries.length > 0) {
      const { error: journalErr } = await supabase
        .from(TABLES.JOURNALS)
        .insert(journalEntries);

      if (journalErr) {
        console.error("GAGAL INSERT JURNAL PEMBELIAN:", journalErr);
      } else {
        console.log(`[Journal] ${journalEntries.length} ayat jurnal pembelian berhasil dicatat untuk ${poNumber}`);
      }
    }

    res.status(201).json({
      message: 'Pembelian barang berhasil disimpan dan stok bertambah.',
      purchase: {
        ...purchaseData,
        items: purchaseItemsToInsert,
        purchase_items: purchaseItemsToInsert,
      },
    });
  } catch (error: any) {
    console.error('Purchase Error:', error);
    res.status(500).json({ message: error.message || 'Gagal memproses pembelian.' });
  }
};

export const getPurchases = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { startDate, endDate } = req.query;

    console.log('=== FETCH PURCHASES DEBUG ===');
    console.log('User ID:', userId);
    console.log('Query Params:', req.query);

    let query = supabase
      .from(TABLES.PURCHASES)
      .select(`
        *,
        supplier:${TABLES.SUPPLIERS}(id, name, company_name, phone, address, email),
        purchase_items:${TABLES.PURCHASE_ITEMS}(
          id,
          quantity,
          unit_price,
          subtotal,
          item:${TABLES.ITEMS}(id, code, name, unit)
        ),
        debt_payments:${TABLES.SUPPLIER_DEBT_PAYMENTS}(
          id,
          amount,
          payment_method,
          payment_date,
          notes,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const startStr = typeof startDate === 'string' && startDate.trim() ? startDate.trim() : null;
    const endStr = typeof endDate === 'string' && endDate.trim() ? endDate.trim() : null;

    if (startStr) {
      const startIso = startStr.includes('T') ? startStr : `${startStr}T00:00:00.000Z`;
      query = query.or(`purchase_date.gte.${startIso},and(purchase_date.is.null,created_at.gte.${startIso})`);
    }
    if (endStr) {
      const endIso = endStr.includes('T') ? endStr : `${endStr}T23:59:59.999Z`;
      query = query.or(`purchase_date.lte.${endIso},and(purchase_date.is.null,created_at.lte.${endIso})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Join Query Error, Fallback to Manual Join Query:', error);
      let fallbackQuery = supabase
        .from(TABLES.PURCHASES)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (startStr) {
        const startIso = startStr.includes('T') ? startStr : `${startStr}T00:00:00.000Z`;
        fallbackQuery = fallbackQuery.or(`purchase_date.gte.${startIso},and(purchase_date.is.null,created_at.gte.${startIso})`);
      }
      if (endStr) {
        const endIso = endStr.includes('T') ? endStr : `${endStr}T23:59:59.999Z`;
        fallbackQuery = fallbackQuery.or(`purchase_date.lte.${endIso},and(purchase_date.is.null,created_at.lte.${endIso})`);
      }

      const fallback = await fallbackQuery;
      const rawPurchases = fallback.data || [];

      // Manually join suppliers
      const supplierIds = Array.from(new Set(rawPurchases.map((p: any) => p.supplier_id).filter(Boolean)));
      let supplierMap = new Map<string, any>();
      if (supplierIds.length > 0) {
        const { data: supData } = await supabase
          .from(TABLES.SUPPLIERS)
          .select('id, name, company_name, phone, address, email')
          .in('id', supplierIds);
        if (supData) {
          supplierMap = new Map(supData.map((s) => [s.id, s]));
        }
      }

      const enrichedPurchases = rawPurchases.map((p: any) => ({
        ...p,
        supplier: p.supplier_id ? supplierMap.get(p.supplier_id) || null : null,
      }));

      console.log('Fetched Data Count (Fallback Enriched):', enrichedPurchases.length);
      res.status(200).json({ purchases: enrichedPurchases, data: enrichedPurchases });
      return;
    }

    // Double check if some suppliers didn't join properly
    const missingSupplierIds = (data || [])
      .filter((p: any) => p.supplier_id && !p.supplier)
      .map((p: any) => p.supplier_id);

    let finalData = data || [];
    if (missingSupplierIds.length > 0) {
      const { data: supData } = await supabase
        .from(TABLES.SUPPLIERS)
        .select('id, name, company_name, phone, address, email')
        .in('id', missingSupplierIds);
      if (supData) {
        const supMap = new Map(supData.map((s) => [s.id, s]));
        finalData = finalData.map((p: any) => ({
          ...p,
          supplier: p.supplier || (p.supplier_id ? supMap.get(p.supplier_id) || null : null),
        }));
      }
    }

    console.log('Fetched Data Count:', finalData.length);
    res.status(200).json({ purchases: finalData, data: finalData });
  } catch (error: any) {
    console.error('Fetch Purchases Exception:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const getPurchaseById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;

    console.log('=== GET PURCHASE BY ID ===');
    console.log('User ID:', userId, 'Purchase ID:', id);

    // 1. Ambil Header Purchase dengan supplier
    let purchase: any = null;
    const { data: pWithSupplier, error: pError } = await supabase
      .from(TABLES.PURCHASES)
      .select(`*, supplier:${TABLES.SUPPLIERS}(*)`)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (pError || !pWithSupplier) {
      console.warn('Get purchase with join supplier warning/error:', pError?.message);
      // Fallback tanpa join supplier
      const { data: pSimple, error: pSimpleErr } = await supabase
        .from(TABLES.PURCHASES)
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (pSimpleErr || !pSimple) {
        res.status(404).json({ message: 'Data pembelian tidak ditemukan.' });
        return;
      }
      purchase = pSimple;

      // Jika ada supplier_id, ambil manual supplier
      if (purchase.supplier_id) {
        const { data: sData } = await supabase
          .from(TABLES.SUPPLIERS)
          .select('*')
          .eq('id', purchase.supplier_id)
          .single();
        purchase.supplier = sData || null;
      }
    } else {
      purchase = pWithSupplier;
    }

    // 2. Ambil Items (Join dengan karuna_items)
    let purchaseItems: any[] = [];
    const { data: itemsJoined, error: itemsError } = await supabase
      .from(TABLES.PURCHASE_ITEMS)
      .select(`*, item:${TABLES.ITEMS}(id, name, code, unit)`)
      .eq('purchase_id', id);

    if (itemsError) {
      console.warn('Fetch purchase_items joined error, fallback to simple select:', itemsError.message);
      const { data: itemsSimple } = await supabase
        .from(TABLES.PURCHASE_ITEMS)
        .select('*')
        .eq('purchase_id', id);
      
      if (itemsSimple && itemsSimple.length > 0) {
        const itemIds = itemsSimple.map((it) => it.item_id).filter(Boolean);
        const { data: masterItems } = await supabase
          .from(TABLES.ITEMS)
          .select('id, name, code, unit')
          .in('id', itemIds);
        
        const itemMap = new Map((masterItems || []).map((m) => [m.id, m]));
        purchaseItems = itemsSimple.map((it) => ({
          ...it,
          item: itemMap.get(it.item_id) || null,
        }));
      }
    } else {
      purchaseItems = itemsJoined || [];
    }

    // 3. Ambil Payments (semua catatan pembayaran cicilan & pembayaran awal)
    let paymentLogs: any[] = [];
    const { data: payData, error: payError } = await supabase
      .from(TABLES.SUPPLIER_DEBT_PAYMENTS)
      .select('*')
      .eq('purchase_id', id)
      .order('payment_date', { ascending: false });

    if (payError) {
      console.warn('Fetch debt payments ordered error, fallback simple:', payError.message);
      const { data: paySimple } = await supabase
        .from(TABLES.SUPPLIER_DEBT_PAYMENTS)
        .select('*')
        .eq('purchase_id', id);
      paymentLogs = paySimple || [];
    } else {
      paymentLogs = payData || [];
    }

    console.log('Detail PO Items Count:', purchaseItems?.length);
    console.log('Detail PO Payments Count:', paymentLogs.length);
    console.log('Detail PO Payments Data:', JSON.stringify(paymentLogs));

    // 4. Return JSON dengan alias 'items', 'purchase_items', 'karuna_purchase_items', 'payments', 'debt_payments'
    res.status(200).json({
      data: {
        ...purchase,
        items: purchaseItems || [],
        purchase_items: purchaseItems || [],
        karuna_purchase_items: purchaseItems || [],
        payments: paymentLogs || [],
        debt_payments: paymentLogs || [],
        karuna_supplier_debt_payments: paymentLogs || [],
      },
    });
  } catch (error: any) {
    console.error('getPurchaseById Exception:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/purchases/:id — Cancel / Void Transaksi Pembelian PO
// ─────────────────────────────────────────────
export const cancelPurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;

    const { data: purchase, error: purchaseErr } = await supabase
      .from(TABLES.PURCHASES)
      .select('id, status, payment_status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (purchaseErr || !purchase) {
      res.status(404).json({ message: 'Transaksi pembelian tidak ditemukan.' });
      return;
    }

    if (purchase.status === 'CANCELLED') {
      res.status(400).json({ message: 'Transaksi ini sudah dibatalkan sebelumnya.' });
      return;
    }

    // ── Pengaman Hapus / Batal Transaksi: Cek apakah sudah ada pembayaran cicilan lanjutan ──
    const { data: existingPayments, error: paymentCheckErr } = await supabase
      .from(TABLES.SUPPLIER_DEBT_PAYMENTS)
      .select('id')
      .eq('purchase_id', id)
      .eq('user_id', userId);

    // Transaksi HANYA diblokir jika status BELUM_LUNAS dan ada lebih dari 1 riwayat pembayaran (sudah ada DP + cicilan lanjutan)
    if (!paymentCheckErr && existingPayments && existingPayments.length > 1 && purchase.payment_status === 'BELUM_LUNAS') {
      res.status(400).json({
        message: 'Transaksi kredit dengan beberapa kali cicilan tidak dapat langsung dibatalkan. Hapus riwayat cicilan lanjutan terlebih dahulu.',
      });
      return;
    }

    // Jika ada 1 record pembayaran awal (DP/Cash), otomatis hapus record pembayarannya
    if (existingPayments && existingPayments.length > 0) {
      await supabase
        .from(TABLES.SUPPLIER_DEBT_PAYMENTS)
        .delete()
        .eq('purchase_id', id)
        .eq('user_id', userId);
    }

    const { data: purchaseItems, error: itemsErr } = await supabase
      .from(TABLES.PURCHASE_ITEMS)
      .select('item_id, quantity')
      .eq('purchase_id', id);

    if (itemsErr) {
      res.status(500).json({ message: 'Gagal mengambil detail item pembelian.' });
      return;
    }

    // Revert / kurangi kembali stok barang yang pernah masuk
    if (purchaseItems && purchaseItems.length > 0) {
      for (const line of purchaseItems) {
        const { item_id, quantity } = line;
        const qtyToReduce = Number(quantity) || 0;

        const { data: dbItem } = await supabase
          .from(TABLES.ITEMS)
          .select('stock')
          .eq('id', item_id)
          .eq('user_id', userId)
          .single();

        if (dbItem) {
          const stockBefore = Number(dbItem.stock) || 0;
          const stockAfter = Math.max(0, stockBefore - qtyToReduce);

          await supabase
            .from(TABLES.ITEMS)
            .update({ stock: stockAfter, updated_at: new Date() })
            .eq('id', item_id)
            .eq('user_id', userId);

          await supabase.from(TABLES.STOCK_MUTATIONS).insert([
            {
              user_id: userId,
              item_id,
              type: 'CANCEL_PURCHASE',
              qty_change: -qtyToReduce,
              stock_before: stockBefore,
              stock_after: stockAfter,
              reference_id: id,
            },
          ]);
        }
      }
    }

    const { error: updateErr } = await supabase
      .from(TABLES.PURCHASES)
      .update({ status: 'CANCELLED', updated_at: new Date() })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateErr) {
      res.status(500).json({ message: updateErr.message || 'Gagal membatalkan transaksi pembelian.' });
      return;
    }

    // Hapus jurnal transaksi pembelian yang dibatalkan
    await deleteJournalEntries(userId, id);

    res.status(200).json({ message: 'Transaksi pembelian berhasil dibatalkan dan stok telah disesuaikan kembali.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/purchases/:id/pay-debt — Pembayaran / Cicilan Hutang Supplier
// ─────────────────────────────────────────────
export const paySupplierDebt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;
    const { amount, payment_method, notes, payment_date } = req.body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      res.status(400).json({ message: 'Nominal pembayaran tidak valid.' });
      return;
    }

    const { data: purchase, error: purchaseErr } = await supabase
      .from(TABLES.PURCHASES)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (purchaseErr || !purchase) {
      res.status(404).json({ message: 'Transaksi pembelian tidak ditemukan.' });
      return;
    }

    if (purchase.status === 'CANCELLED') {
      res.status(400).json({ message: 'Transaksi pembelian yang dibatalkan tidak dapat dibayar.' });
      return;
    }

    const currentPaid = Number(purchase.paid_amount) || 0;
    const totalAmount = Number(purchase.total_amount) || 0;
    const currentDue = Number(purchase.due_amount) ?? (totalAmount - currentPaid);

    if (currentDue <= 0 && purchase.payment_status === 'LUNAS') {
      res.status(400).json({ message: 'Hutang untuk transaksi ini sudah lunas.' });
      return;
    }

    if (paymentAmount > currentDue) {
      res.status(400).json({
        message: `Nominal pembayaran (Rp ${paymentAmount}) melebihi sisa hutang (Rp ${currentDue})`,
      });
      return;
    }

    const newPaidAmount = currentPaid + paymentAmount;
    const newDueAmount = Math.max(0, totalAmount - newPaidAmount);
    const newPaymentStatus = newDueAmount <= 0 ? 'LUNAS' : 'CICILAN';
    const formattedPaymentDate = payment_date || new Date().toISOString();

    // 1. Simpan log pembayaran ke karuna_supplier_debt_payments
    const finalUserId = userId || (req.user as any)?.id || req.user?.userId;
    const finalNotes = notes?.trim() || 'Pembayaran Cicilan Hutang';
    const finalPaymentMethod = payment_method || 'Transfer';
    const finalPaymentDate = payment_date ? new Date(payment_date).toISOString() : new Date().toISOString();

    let insertedPayment: any = null;
    let logErr: any = null;

    // Coba dengan amount_paid (sesuai schema Supabase aktif & Prompt #28)
    const resPaid = await supabase
      .from(TABLES.SUPPLIER_DEBT_PAYMENTS)
      .insert([{
        user_id: finalUserId,
        purchase_id: id,
        supplier_id: purchase.supplier_id || null,
        amount_paid: paymentAmount,
        payment_method: finalPaymentMethod,
        payment_date: finalPaymentDate,
        notes: finalNotes,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (resPaid.error) {
      console.warn('Insert with amount_paid failed, trying amount:', resPaid.error.message);
      // Fallback coba kolom amount
      const resAmount = await supabase
        .from(TABLES.SUPPLIER_DEBT_PAYMENTS)
        .insert([{
          user_id: finalUserId,
          purchase_id: id,
          supplier_id: purchase.supplier_id || null,
          amount: paymentAmount,
          payment_method: finalPaymentMethod,
          payment_date: finalPaymentDate,
          notes: finalNotes,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      insertedPayment = resAmount.data;
      logErr = resAmount.error;
    } else {
      insertedPayment = resPaid.data;
      logErr = null;
    }

    if (logErr) {
      console.error('Supplier debt payment log error:', logErr);
      res.status(500).json({ message: 'Gagal mencatat riwayat cicilan: ' + logErr.message });
      return;
    }
    console.log('Supplier Debt Payment log recorded:', insertedPayment?.id, 'Amount:', paymentAmount);

    // 2. Update tabel karuna_purchases
    const { data: updatedPurchase, error: updateErr } = await supabase
      .from(TABLES.PURCHASES)
      .update({
        paid_amount: newPaidAmount,
        due_amount: newDueAmount,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateErr) {
      console.error('Update purchase debt error:', updateErr);
      res.status(500).json({ message: updateErr.message || 'Gagal memperbarui data hutang pembelian.' });
      return;
    }

    // Pencatatan Jurnal Otomatis (Debit Hutang Supplier, Kredit Kas/Bank)
    if (insertedPayment) {
      await createJournalEntries({
        userId,
        transactionType: 'DEBT_PAYMENT',
        referenceId: insertedPayment.id,
        transactionDate: finalPaymentDate,
        entries: [
          {
            accountCode: ACCOUNTS.HUTANG_SUPPLIER.code,
            accountName: ACCOUNTS.HUTANG_SUPPLIER.name,
            debit: paymentAmount,
            credit: 0,
            description: `Pelunasan hutang supplier PO #${purchase.po_number || id}`,
          },
          {
            accountCode: ACCOUNTS.KAS_BANK.code,
            accountName: ACCOUNTS.KAS_BANK.name,
            debit: 0,
            credit: paymentAmount,
            description: `Pengeluaran kas bayar hutang PO #${purchase.po_number || id}`,
          },
        ],
      });
    }

    res.status(200).json({
      message: 'Pembayaran hutang supplier berhasil dicatat.',
      purchase: updatedPurchase,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/purchases/debt-payments/:paymentId — Hapus / Batal Cicilan Pembayaran
// ─────────────────────────────────────────────
export const deleteSupplierDebtPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { paymentId } = req.params;

    console.log('=== DELETE SUPPLIER DEBT PAYMENT ===');
    console.log('User ID:', userId, 'Payment ID:', paymentId);

    // 1. Dapatkan info cicilan yang akan dihapus
    const { data: payment, error: paymentErr } = await supabase
      .from(TABLES.SUPPLIER_DEBT_PAYMENTS)
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', userId)
      .single();

    if (paymentErr || !payment) {
      console.warn('Payment record not found:', paymentErr?.message);
      res.status(404).json({ message: 'Data riwayat cicilan tidak ditemukan.' });
      return;
    }

    const { purchase_id } = payment;
    const paymentAmount = Number(payment.amount_paid ?? payment.amount ?? 0);

    // 2. Dapatkan data pembelian/PO terkait
    const { data: purchase, error: purchaseErr } = await supabase
      .from(TABLES.PURCHASES)
      .select('*')
      .eq('id', purchase_id)
      .eq('user_id', userId)
      .single();

    if (purchaseErr || !purchase) {
      res.status(404).json({ message: 'Transaksi pembelian terkait tidak ditemukan.' });
      return;
    }

    // 3. Hapus log cicilan terlebih dahulu
    const { error: deleteErr } = await supabase
      .from(TABLES.SUPPLIER_DEBT_PAYMENTS)
      .delete()
      .eq('id', paymentId)
      .eq('user_id', userId);

    if (deleteErr) {
      console.error('Delete supplier debt payment error:', deleteErr);
      res.status(500).json({ message: deleteErr.message || 'Gagal menghapus log riwayat cicilan.' });
      return;
    }

    // 4. Hitung ulang total yang sudah dibayar berdasarkan sisa log pembayaran di database (lebih aman & presisi)
    const { data: remainingPayments } = await supabase
      .from(TABLES.SUPPLIER_DEBT_PAYMENTS)
      .select('amount, amount_paid')
      .eq('purchase_id', purchase_id);

    let recalculatedPaid = 0;
    if (remainingPayments && remainingPayments.length > 0) {
      recalculatedPaid = remainingPayments.reduce((sum, p) => sum + Number(p.amount_paid ?? p.amount ?? 0), 0);
    } else {
      // Jika semua log terhapus, kurangi manual dari oldPaid
      const oldPaid = Number(purchase.paid_amount) || 0;
      recalculatedPaid = Math.max(0, oldPaid - paymentAmount);
    }

    const totalAmount = Number(purchase.total_amount) || 0;
    const newPaidAmount = recalculatedPaid;
    const newDueAmount = Math.max(0, totalAmount - newPaidAmount);
    const newPaymentStatus = newPaidAmount >= totalAmount ? 'LUNAS' : newPaidAmount > 0 ? 'CICILAN' : 'BELUM_LUNAS';

    // 5. Update data pembelian
    const { error: updateErr } = await supabase
      .from(TABLES.PURCHASES)
      .update({
        paid_amount: newPaidAmount,
        due_amount: newDueAmount,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchase_id)
      .eq('user_id', userId);

    if (updateErr) {
      console.error('Update purchase after payment delete error:', updateErr);
      res.status(500).json({ message: updateErr.message || 'Gagal memperbarui data transaksi pembelian.' });
      return;
    }

    // Hapus jurnal cicilan terkait
    await deleteJournalEntries(userId, paymentId);

    console.log(`Payment deleted: ID ${paymentId}, newPaid: ${newPaidAmount}, newDue: ${newDueAmount}, status: ${newPaymentStatus}`);

    res.status(200).json({
      message: 'Riwayat cicilan berhasil dihapus dan nominal sisa hutang telah bertambah kembali.',
      purchase: {
        id: purchase_id,
        paid_amount: newPaidAmount,
        due_amount: newDueAmount,
        payment_status: newPaymentStatus,
      },
    });
  } catch (error: any) {
    console.error('deleteSupplierDebtPayment Exception:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
