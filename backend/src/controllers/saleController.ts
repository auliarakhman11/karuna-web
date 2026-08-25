import { Response } from 'express';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { createJournalEntries, deleteJournalEntries, ACCOUNTS } from '../helpers/journalHelper';

// Helper: generate invoice number e.g. INV-1700000000000
const generateInvoiceNumber = (): string => {
  return `INV-${Date.now()}`;
};

// ─────────────────────────────────────────────
// POST /api/sales — Create a new sale transaction
// ─────────────────────────────────────────────
export const createSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const {
      items,
      customer_id,
      payment_type,
      paid_amount,
      due_date,
      sale_date,
      shipping_cost,
      notes,
    } = req.body;

    // Basic validation
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Keranjang tidak boleh kosong.' });
      return;
    }

    const shippingFee = Math.max(0, Number(shipping_cost) || 0);

    // ── Step 1: Validate stock for all items before touching the database ──
    const itemIds: string[] = items.map((i: any) => i.item_id || i.id);

    const { data: dbItems, error: fetchError } = await supabase
      .from(TABLES.ITEMS)
      .select('id, name, stock, price, buy_price, cost_price, unit')
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
      const itId = orderLine.item_id || orderLine.id;
      const { quantity } = orderLine;
      const dbItem = dbItemMap.get(itId);

      if (!dbItem) {
        res.status(400).json({ message: `Barang dengan ID ${itId} tidak ditemukan.` });
        return;
      }

      if (dbItem.stock < quantity) {
        res.status(400).json({
          message: `Stok ${dbItem.name} tidak mencukupi (Sisa: ${dbItem.stock})`,
        });
        return;
      }
    }

    // ── Step 2: Calculate total amount, total discount, and total cost ──
    let subtotalItems = 0;
    let totalDiscount = 0;
    let totalCost = 0;

    for (const line of items) {
      const itId = line.item_id || line.id;
      const dbItem = dbItemMap.get(itId);
      const qty = Number(line.quantity) || 1;
      const sellPrice = Number(line.price ?? dbItem?.price ?? 0);
      // HPP per unit: prioritaskan buy_price dari master items
      const costPrice = Number(dbItem?.buy_price ?? line.cost_price ?? dbItem?.cost_price ?? 0);
      const discount = Math.max(0, Number(line.discount) || 0);

      const itemTotalPrice = sellPrice * qty;
      if (discount > itemTotalPrice) {
        res.status(400).json({ message: 'Diskon tidak boleh melebihi total harga barang.' });
        return;
      }

      const subtotal = itemTotalPrice - discount;
      totalDiscount += discount;
      subtotalItems += subtotal;
      totalCost += costPrice * qty;
    }

    const grandTotal = subtotalItems + shippingFee;
    const paidAmount = Number(paid_amount) || 0;
    let paymentStatus = 'BELUM_LUNAS';
    if (paidAmount >= grandTotal) {
      paymentStatus = 'LUNAS';
    } else if (paidAmount > 0) {
      paymentStatus = 'CICILAN';
    }

    const dueAmount = Math.max(0, grandTotal - paidAmount);
    const invoiceNumber = generateInvoiceNumber();
    const formattedSaleDate = sale_date ? new Date(sale_date).toISOString() : new Date().toISOString();

    // ── Step 3: Insert into karuna_sales (with fallback if columns like shipping_cost/sale_date missing) ──
    const salePayload: any = {
      user_id: userId,
      customer_id: customer_id || null,
      invoice_number: invoiceNumber,
      total_amount: grandTotal,
      shipping_cost: shippingFee,
      total_discount: totalDiscount,
      total_cost: totalCost,
        shipping_cost: shippingFee,
        sale_date: formattedSaleDate,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_type: payment_type || 'CASH',
      payment_method: payment_type || 'CASH',
      payment_status: paymentStatus,
      due_date: due_date || null,
      sale_date: formattedSaleDate,
      status: 'completed',
      notes: notes?.trim() || '',
    };

    let saleData: any = null;
    const { data: insertedSale, error: saleError } = await supabase
      .from(TABLES.SALES)
      .insert([salePayload])
      .select()
      .single();

    if (saleError) {
      console.warn('Insert sale with full fields failed, trying fallback:', saleError.message);
      const fallbackPayload: any = {
        user_id: userId,
        customer_id: customer_id || null,
        invoice_number: invoiceNumber,
        total_amount: grandTotal,
        total_discount: totalDiscount,
        total_cost: totalCost,
        shipping_cost: shippingFee,
        sale_date: formattedSaleDate,
        paid_amount: paidAmount,
        due_amount: dueAmount,
        payment_type: payment_type || 'CASH',
        payment_method: payment_type || 'CASH',
        payment_status: paymentStatus,
        due_date: due_date || null,
        status: 'completed',
        notes: notes?.trim() || '',
      };

      const { data: fbSale, error: fbError } = await supabase
        .from(TABLES.SALES)
        .insert([fallbackPayload])
        .select()
        .single();

      if (fbError) {
        console.error('Sale Error Detail:', fbError);
        res.status(500).json({ message: fbError.message || 'Gagal menyimpan transaksi.' });
        return;
      }
      saleData = fbSale;
    } else {
      saleData = insertedSale;
    }

    // ── Step 4: Insert sale items ──
    const saleItemsToInsert = items.map((item: any) => {
      const itId = item.item_id || item.id;
      const dbItem = dbItemMap.get(itId);
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.price ?? dbItem?.price ?? 0);
      // HPP per unit: prioritaskan buy_price dari master items
      const costPrice = Number(dbItem?.buy_price ?? item.cost_price ?? item.buy_price ?? dbItem?.cost_price ?? 0);
      const discount = Math.max(0, Number(item.discount) || 0);
      const subtotal = (qty * unitPrice) - discount;

      return {
        sale_id: saleData.id,
        item_id: itId,
        quantity: qty,
        unit_price: unitPrice,
        cost_price: costPrice,
        price: unitPrice,
        discount: discount,
        subtotal: subtotal,
      };
    });

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

    // ── Step 5: Deduct stock for each item & Record Stock Mutation ──
    for (const orderLine of items) {
      const itId = orderLine.item_id || orderLine.id;
      const { quantity } = orderLine;
      const dbItem = dbItemMap.get(itId);
      const stockBefore = Number(dbItem.stock) || 0;
      const qtyChange = Number(quantity);
      const stockAfter = stockBefore - qtyChange;

      // Update stock in karuna_items
      await supabase
        .from(TABLES.ITEMS)
        .update({ stock: stockAfter, updated_at: new Date().toISOString() })
        .eq('id', itId)
        .eq('user_id', userId);

      // Insert log to karuna_stock_mutations
      await supabase
        .from(TABLES.STOCK_MUTATIONS)
        .insert([
          {
            user_id: userId,
            item_id: itId,
            type: 'SALE',
            qty_change: -qtyChange,
            stock_before: stockBefore,
            stock_after: stockAfter,
            reference_id: saleData.id,
          },
        ]);
    }

    // ── Step 6: Pencatatan Jurnal Otomatis (Direct Hardcode Insert ke karuna_journals) ──
    const journalEntries: any[] = [];

    // 1. Pendapatan Penjualan
    if (paidAmount > 0) {
      journalEntries.push({
        user_id: userId,
        transaction_type: 'SALE',
        reference_id: saleData.id,
        transaction_date: formattedSaleDate,
        account_code: '1001',
        account_name: 'Kas & Bank',
        debit: paidAmount,
        credit: 0,
        description: `Penerimaan kas penjualan ${invoiceNumber}`,
      });
    }
    if (dueAmount > 0) {
      journalEntries.push({
        user_id: userId,
        transaction_type: 'SALE',
        reference_id: saleData.id,
        transaction_date: formattedSaleDate,
        account_code: '1002',
        account_name: 'Piutang Usaha',
        debit: dueAmount,
        credit: 0,
        description: `Piutang penjualan ${invoiceNumber}`,
      });
    }
    journalEntries.push({
      user_id: userId,
      transaction_type: 'SALE',
      reference_id: saleData.id,
      transaction_date: formattedSaleDate,
      account_code: '4001',
      account_name: 'Pendapatan Penjualan',
      debit: 0,
      credit: grandTotal,
      description: `Pendapatan penjualan ${invoiceNumber}`,
    });

    // 2. HPP (Harga Pokok Penjualan)
    if (totalCost > 0) {
      journalEntries.push({
        user_id: userId,
        transaction_type: 'SALE',
        reference_id: saleData.id,
        transaction_date: formattedSaleDate,
        account_code: '5001',
        account_name: 'Harga Pokok Penjualan (HPP)',
        debit: totalCost,
        credit: 0,
        description: `HPP penjualan ${invoiceNumber}`,
      });
      journalEntries.push({
        user_id: userId,
        transaction_type: 'SALE',
        reference_id: saleData.id,
        transaction_date: formattedSaleDate,
        account_code: '1003',
        account_name: 'Persediaan Barang Dagang',
        debit: 0,
        credit: totalCost,
        description: `Pengurangan persediaan penjualan ${invoiceNumber}`,
      });
    }

    if (journalEntries.length > 0) {
      const { error: journalErr } = await supabase
        .from(TABLES.JOURNALS)
        .insert(journalEntries);

      if (journalErr) {
        console.error("GAGAL INSERT JURNAL PENJUALAN:", journalErr);
      } else {
        console.log(`[Journal] ${journalEntries.length} ayat jurnal penjualan berhasil dicatat untuk ${invoiceNumber}`);
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
// GET /api/sales — Fetch all sales with date range & details
// ─────────────────────────────────────────────
export const getSales = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { startDate, endDate } = req.query;

    const startStr = typeof startDate === 'string' && startDate.trim() ? startDate.trim() : null;
    const endStr = typeof endDate === 'string' && endDate.trim() ? endDate.trim() : null;

    let salesQuery = supabase
      .from(TABLES.SALES)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (startStr) {
      const startIso = startStr.includes('T') ? startStr : `${startStr}T00:00:00.000Z`;
      salesQuery = salesQuery.or(`sale_date.gte.${startIso},and(sale_date.is.null,created_at.gte.${startIso})`);
    }
    if (endStr) {
      const endIso = endStr.includes('T') ? endStr : `${endStr}T23:59:59.999Z`;
      salesQuery = salesQuery.or(`sale_date.lte.${endIso},and(sale_date.is.null,created_at.lte.${endIso})`);
    }

    const { data: rawSales, error: salesErr } = await salesQuery;
    if (salesErr) {
      res.status(500).json({ message: salesErr.message || 'Gagal mengambil riwayat transaksi.' });
      return;
    }

    const salesList = rawSales || [];
    const saleIds = salesList.map((s: any) => s.id);

    // 1. Fetch sale_items for all sales
    let saleItemsMap = new Map<string, any[]>();
    let allItemIds: string[] = [];

    if (saleIds.length > 0) {
      const { data: dbSaleItems } = await supabase
        .from(TABLES.SALE_ITEMS)
        .select('*')
        .in('sale_id', saleIds);

      (dbSaleItems || []).forEach((si: any) => {
        if (si.item_id) allItemIds.push(si.item_id);
        const arr = saleItemsMap.get(si.sale_id) || [];
        arr.push(si);
        saleItemsMap.set(si.sale_id, arr);
      });
    }

    // 2. Fetch unique items from karuna_items to map name, code, unit
    const uniqueItemIds = Array.from(new Set(allItemIds.filter(Boolean)));
    let itemMap = new Map<string, any>();
    if (uniqueItemIds.length > 0) {
      const { data: dbItems } = await supabase
        .from(TABLES.ITEMS)
        .select('id, name, code, unit')
        .in('id', uniqueItemIds);
      itemMap = new Map((dbItems || []).map((i: any) => [i.id, i]));
    }

    // 3. Fetch customers
    const customerIds = Array.from(new Set(salesList.map((s: any) => s.customer_id).filter(Boolean)));
    let customerMap = new Map<string, any>();
    if (customerIds.length > 0) {
      const { data: dbCustomers } = await supabase
        .from(TABLES.CUSTOMERS)
        .select('id, name, phone, address')
        .in('id', customerIds);
      customerMap = new Map((dbCustomers || []).map((c: any) => [c.id, c]));
    }

    // 4. Fetch payments
    let paymentsMap = new Map<string, any[]>();
    if (saleIds.length > 0) {
      const { data: dbPayments } = await supabase
        .from(TABLES.CUSTOMER_DEBT_PAYMENTS)
        .select('*')
        .in('sale_id', saleIds)
        .order('payment_date', { ascending: false });

      (dbPayments || []).forEach((p: any) => {
        const arr = paymentsMap.get(p.sale_id) || [];
        arr.push(p);
        paymentsMap.set(p.sale_id, arr);
      });
    }

    // Assemble final response
    const enrichedSales = salesList.map((s: any) => {
      const rawLines = saleItemsMap.get(s.id) || [];
      const enrichedLines = rawLines.map((si: any) => {
        const it = itemMap.get(si.item_id) || null;
        return {
          ...si,
          item: it,
          item_name: it?.name || si.item_name || 'Barang',
        };
      });

      return {
        ...s,
        customer: s.customer_id ? customerMap.get(s.customer_id) || null : null,
        sale_items: enrichedLines,
        items: enrichedLines, // fallback alias
        payments: paymentsMap.get(s.id) || [],
      };
    });

    res.status(200).json({ sales: enrichedSales, data: enrichedSales });
  } catch (error: any) {
    console.error('Sale Error Detail:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/sales/:id/pay-debt — Customer Debt Payment
// ─────────────────────────────────────────────
export const payCustomerDebt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;
    const { amount, payment_method, notes, payment_date } = req.body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      res.status(400).json({ message: 'Nominal pembayaran tidak valid.' });
      return;
    }

    const { data: sale, error: saleErr } = await supabase
      .from(TABLES.SALES)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (saleErr || !sale) {
      res.status(404).json({ message: 'Transaksi penjualan tidak ditemukan.' });
      return;
    }

    if (sale.status === 'CANCELLED') {
      res.status(400).json({ message: 'Transaksi yang telah dibatalkan tidak dapat dibayar.' });
      return;
    }

    const currentPaid = Number(sale.paid_amount) || 0;
    const totalAmount = Number(sale.total_amount) || 0;
    const currentDue = Number(sale.due_amount) ?? (totalAmount - currentPaid);

    if (currentDue <= 0 && sale.payment_status === 'LUNAS') {
      res.status(400).json({ message: 'Piutang untuk transaksi ini sudah lunas.' });
      return;
    }

    if (paymentAmount > currentDue) {
      res.status(400).json({
        message: `Nominal pembayaran (Rp ${paymentAmount}) melebihi sisa piutang (Rp ${currentDue})`,
      });
      return;
    }

    const newPaidAmount = currentPaid + paymentAmount;
    const newDueAmount = Math.max(0, totalAmount - newPaidAmount);
    const newPaymentStatus = newDueAmount <= 0 ? 'LUNAS' : 'CICILAN';
    const formattedPaymentDate = payment_date ? new Date(payment_date).toISOString() : new Date().toISOString();

    // 1. Insert record ke karuna_customer_debt_payments
    const finalUserId = userId || (req.user as any)?.id || req.user?.userId;
    const paymentPayload: any = {
      user_id: finalUserId,
      sale_id: id,
      customer_id: sale.customer_id || null,
      amount_paid: paymentAmount,
      payment_method: payment_method || 'Tunai',
      payment_date: formattedPaymentDate,
      notes: notes?.trim() || 'Pembayaran Cicilan Piutang Pelanggan',
    };

    const { data: insertedPayment, error: logErr } = await supabase
      .from(TABLES.CUSTOMER_DEBT_PAYMENTS)
      .insert([paymentPayload])
      .select()
      .single();

    if (logErr) {
      console.warn('Customer debt payment insert error, trying amount column fallback:', logErr.message);
      // Fallback if table uses column name 'amount' instead of 'amount_paid'
      const fallbackPayload: any = {
        user_id: finalUserId,
        sale_id: id,
        customer_id: sale.customer_id || null,
        amount: paymentAmount,
        amount_paid: paymentAmount,
        payment_method: payment_method || 'Tunai',
        payment_date: formattedPaymentDate,
        notes: notes?.trim() || 'Pembayaran Cicilan Piutang Pelanggan',
      };
      const { data: fbPayment, error: fbErr } = await supabase
        .from(TABLES.CUSTOMER_DEBT_PAYMENTS)
        .insert([fallbackPayload])
        .select()
        .single();

      if (fbErr) {
        res.status(500).json({ message: fbErr.message || 'Gagal mencatat riwayat cicilan piutang.' });
        return;
      }
    }

    // 2. Update sale record (try with updated_at, fallback without updated_at if schema cache lacks it)
    const updatePayload: any = {
      paid_amount: newPaidAmount,
      due_amount: newDueAmount,
      payment_status: newPaymentStatus,
      updated_at: new Date(),
    };

    const { error: updateErr } = await supabase
      .from(TABLES.SALES)
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId);

    if (updateErr) {
      console.warn('Update sale with updated_at failed, trying fallback without updated_at:', updateErr.message);
      const { error: fbUpdateErr } = await supabase
        .from(TABLES.SALES)
        .update({
          paid_amount: newPaidAmount,
          due_amount: newDueAmount,
          payment_status: newPaymentStatus,
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (fbUpdateErr) {
        res.status(500).json({ message: fbUpdateErr.message || 'Gagal memperbarui status piutang.' });
        return;
      }
    }

    // Pencatatan Jurnal Otomatis (Debit Kas, Kredit Piutang)
    if (insertedPayment) {
      await createJournalEntries({
        userId,
        transactionType: 'DEBT_PAYMENT',
        referenceId: insertedPayment.id,
        transactionDate: formattedPaymentDate,
        entries: [
          {
            accountCode: ACCOUNTS.KAS_BANK.code,
            accountName: ACCOUNTS.KAS_BANK.name,
            debit: paymentAmount,
            credit: 0,
            description: `Pelunasan piutang INV #${sale.invoice_number || id}`,
          },
          {
            accountCode: ACCOUNTS.PIUTANG_USAHA.code,
            accountName: ACCOUNTS.PIUTANG_USAHA.name,
            debit: 0,
            credit: paymentAmount,
            description: `Pengurangan piutang INV #${sale.invoice_number || id}`,
          },
        ],
      });
    }

    res.status(200).json({
      message: 'Pembayaran piutang berhasil dicatat.',
      paid_amount: newPaidAmount,
      due_amount: newDueAmount,
      payment_status: newPaymentStatus,
      payment: insertedPayment,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/sales/debt-payments/:paymentId — Delete customer debt payment & revert
// ─────────────────────────────────────────────
export const deleteCustomerDebtPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { paymentId } = req.params;

    // 1. Dapatkan info cicilan yang akan dihapus
    const { data: payment, error: paymentErr } = await supabase
      .from(TABLES.CUSTOMER_DEBT_PAYMENTS)
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', userId)
      .single();

    if (paymentErr || !payment) {
      res.status(404).json({ message: 'Data riwayat cicilan tidak ditemukan.' });
      return;
    }

    const { sale_id } = payment;

    // 2. Dapatkan data penjualan terkait
    const { data: sale, error: saleErr } = await supabase
      .from(TABLES.SALES)
      .select('*')
      .eq('id', sale_id)
      .eq('user_id', userId)
      .single();

    if (saleErr || !sale) {
      res.status(404).json({ message: 'Transaksi penjualan terkait tidak ditemukan.' });
      return;
    }

    // 3. Hapus log cicilan
    const { error: deleteErr } = await supabase
      .from(TABLES.CUSTOMER_DEBT_PAYMENTS)
      .delete()
      .eq('id', paymentId)
      .eq('user_id', userId);

    if (deleteErr) {
      res.status(500).json({ message: deleteErr.message || 'Gagal menghapus catatan cicilan.' });
      return;
    }

    // 4. Hitung ulang total cicilan yang tersisa
    const { data: remainingPayments } = await supabase
      .from(TABLES.CUSTOMER_DEBT_PAYMENTS)
      .select('amount_paid, amount')
      .eq('sale_id', sale_id)
      .eq('user_id', userId);

    const totalInstallmentsPaid = (remainingPayments || []).reduce((acc: number, curr: any) => {
      return acc + (Number(curr.amount_paid ?? curr.amount) || 0);
    }, 0);

    const totalAmount = Number(sale.total_amount) || 0;
    // Sisa hutang = Total Transaksi - Total Cicilan yang tersisa
    // (Jika transaksi awal cash/credit DP, perhitungkan apakah ada DP awal atau semua dari payments)
    const newPaid = Math.min(totalAmount, totalInstallmentsPaid);
    const newDue = Math.max(0, totalAmount - newPaid);
    const newPaymentStatus = newDue <= 0 ? 'LUNAS' : newPaid > 0 ? 'CICILAN' : 'BELUM_LUNAS';

    await supabase
      .from(TABLES.SALES)
      .update({
        paid_amount: newPaid,
        due_amount: newDue,
        payment_status: newPaymentStatus,
      })
      .eq('id', sale_id)
      .eq('user_id', userId);

    // Hapus jurnal cicilan terkait
    await deleteJournalEntries(userId, paymentId);

    res.status(200).json({
      message: 'Riwayat cicilan berhasil dihapus dan status piutang diperbarui.',
      paid_amount: newPaid,
      due_amount: newDue,
      payment_status: newPaymentStatus,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/sales/:id — Void / Pembatalan Transaksi Penjualan
// ─────────────────────────────────────────────
export const voidSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;

    const { data: sale, error: saleErr } = await supabase
      .from(TABLES.SALES)
      .select('id, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (saleErr || !sale) {
      res.status(404).json({ message: 'Transaksi penjualan tidak ditemukan.' });
      return;
    }

    if (sale.status === 'CANCELLED') {
      res.status(400).json({ message: 'Transaksi ini sudah dibatalkan sebelumnya.' });
      return;
    }

    // VOID GUARD: Periksa apakah ada riwayat cicilan pelanggan
    const { data: existingPayments } = await supabase
      .from(TABLES.CUSTOMER_DEBT_PAYMENTS)
      .select('id')
      .eq('sale_id', id)
      .eq('user_id', userId);

    if (existingPayments && existingPayments.length > 0) {
      res.status(400).json({
        message: 'Transaksi tidak dapat dibatalkan karena memiliki riwayat pembayaran cicilan. Harap hapus seluruh riwayat cicilan terlebih dahulu.',
      });
      return;
    }

    const { data: saleItems, error: itemsErr } = await supabase
      .from(TABLES.SALE_ITEMS)
      .select('item_id, quantity')
      .eq('sale_id', id);

    if (itemsErr) {
      res.status(500).json({ message: 'Gagal mengambil detail item penjualan.' });
      return;
    }

    // Revert stock for each item & add stock mutation VOID_SALE
    if (saleItems && saleItems.length > 0) {
      for (const line of saleItems) {
        const { item_id, quantity } = line;
        const qtyToReturn = Number(quantity) || 0;

        const { data: dbItem } = await supabase
          .from(TABLES.ITEMS)
          .select('stock')
          .eq('id', item_id)
          .eq('user_id', userId)
          .single();

        if (dbItem) {
          const stockBefore = Number(dbItem.stock) || 0;
          const stockAfter = stockBefore + qtyToReturn;

          await supabase
            .from(TABLES.ITEMS)
            .update({ stock: stockAfter, updated_at: new Date().toISOString() })
            .eq('id', item_id)
            .eq('user_id', userId);

          await supabase.from(TABLES.STOCK_MUTATIONS).insert([
            {
              user_id: userId,
              item_id,
              type: 'VOID_SALE',
              qty_change: qtyToReturn,
              stock_before: stockBefore,
              stock_after: stockAfter,
              reference_id: id,
            },
          ]);
        }
      }
    }

    const { error: updateErr } = await supabase
      .from(TABLES.SALES)
      .update({ status: 'CANCELLED' })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateErr) {
      res.status(500).json({ message: updateErr.message || 'Gagal membatalkan transaksi.' });
      return;
    }

    // Hapus jurnal transaksi penjualan yang dibatalkan
    await deleteJournalEntries(userId, id);

    res.status(200).json({ message: 'Transaksi berhasil dibatalkan dan stok dikembalikan.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

