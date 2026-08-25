import { Response } from 'express';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

// ─────────────────────────────────────────────
// INVESTORS CONTROLLER
// ─────────────────────────────────────────────

// GET /api/investors
export const getInvestors = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;

    const { data, error } = await supabase
      .from(TABLES.INVESTORS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal mengambil data investor.' });
      return;
    }

    res.status(200).json({ investors: data || [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// POST /api/investors
export const createInvestor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { name, phone, email, investment_amount, share_percentage, notes } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Nama investor wajib diisi.' });
      return;
    }

    const payload: any = {
      user_id: userId,
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      investment_amount: Math.max(0, Number(investment_amount) || 0),
      share_percentage: Math.max(0, Number(share_percentage) || 0),
      notes: notes?.trim() || '',
    };

    const { data, error } = await supabase
      .from(TABLES.INVESTORS)
      .insert([payload])
      .select()
      .single();

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal menambahkan data investor.' });
      return;
    }

    res.status(201).json({ message: 'Data investor berhasil ditambahkan.', investor: data });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// PUT /api/investors/:id
export const updateInvestor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;
    const { name, phone, email, investment_amount, share_percentage, notes } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Nama investor wajib diisi.' });
      return;
    }

    const payload: any = {
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      investment_amount: Math.max(0, Number(investment_amount) || 0),
      share_percentage: Math.max(0, Number(share_percentage) || 0),
      notes: notes?.trim() || '',
    };

    const { data, error } = await supabase
      .from(TABLES.INVESTORS)
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal memperbarui data investor.' });
      return;
    }

    res.status(200).json({ message: 'Data investor berhasil diperbarui.', investor: data });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// DELETE /api/investors/:id
export const deleteInvestor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { id } = req.params;

    const { error } = await supabase
      .from(TABLES.INVESTORS)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({ message: error.message || 'Gagal menghapus data investor.' });
      return;
    }

    res.status(200).json({ message: 'Data investor berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/investors/dividends — Laporan Bagi Hasil / Dividen Investor
// ─────────────────────────────────────────────
export const getInvestorDividends = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { startDate, endDate } = req.query;

    const startStr = typeof startDate === 'string' && startDate.trim() ? startDate.trim() : null;
    const endStr = typeof endDate === 'string' && endDate.trim() ? endDate.trim() : null;

    const startIso = startStr ? (startStr.includes('T') ? startStr : `${startStr}T00:00:00.000Z`) : null;
    const endIso = endStr ? (endStr.includes('T') ? endStr : `${endStr}T23:59:59.999Z`) : null;

    // 1. Ambil Penjualan pada rentang tanggal untuk hitung Pendapatan
    let salesQuery = supabase
      .from(TABLES.SALES)
      .select('*')
      .eq('user_id', userId);

    if (startIso) {
      salesQuery = salesQuery.or(`sale_date.gte.${startIso},and(sale_date.is.null,created_at.gte.${startIso})`);
    }
    if (endIso) {
      salesQuery = salesQuery.or(`sale_date.lte.${endIso},and(sale_date.is.null,created_at.lte.${endIso})`);
    }

    const { data: periodSales } = await salesQuery;
    const validSales = (periodSales || []).filter((s: any) => {
      const st = String(s.status || '').toUpperCase();
      return st !== 'CANCELLED' && st !== 'VOID';
    });

    const totalRevenue = validSales.reduce((acc: number, s: any) => acc + (Number(s.total_amount) || 0), 0);
    const saleIds = validSales.map((s: any) => s.id);

    // 2. Hitung HPP (COGS)
    let totalCogs = 0;
    if (saleIds.length > 0) {
      const { data: saleItems } = await supabase
        .from(TABLES.SALE_ITEMS)
        .select('*')
        .in('sale_id', saleIds);

      if (saleItems && saleItems.length > 0) {
        const itemIds = Array.from(new Set(saleItems.map((si: any) => si.item_id).filter(Boolean)));
        let itemBuyPriceMap = new Map<string, number>();

        if (itemIds.length > 0) {
          const { data: dbItems } = await supabase
            .from(TABLES.ITEMS)
            .select('id, buy_price, price')
            .in('id', itemIds);

          (dbItems || []).forEach((it: any) => {
            itemBuyPriceMap.set(it.id, Number(it.buy_price) || 0);
          });
        }

        totalCogs = saleItems.reduce((acc: number, si: any) => {
          const recordedCost = Number(si.cost_price ?? si.buy_price);
          const buyPrice = !isNaN(recordedCost) && recordedCost > 0 ? recordedCost : (itemBuyPriceMap.get(si.item_id) || 0);
          return acc + (Number(si.quantity) || 0) * buyPrice;
        }, 0);
      }
    }

    const grossProfit = totalRevenue - totalCogs;

    // 3. Hitung Beban Pengeluaran
    let expQuery = supabase
      .from(TABLES.EXPENSES)
      .select('amount')
      .eq('user_id', userId);

    if (startIso) expQuery = expQuery.gte('expense_date', startIso);
    if (endIso) expQuery = expQuery.lte('expense_date', endIso);

    const { data: periodExpenses } = await expQuery;
    const totalOperatingExpenses = (periodExpenses || []).reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);

    // 4. Laba Bersih
    const netProfit = grossProfit - totalOperatingExpenses;

    // 4b. Hitung Posisi Kas & Piutang Berjalan
    const { data: allSales } = await supabase
      .from(TABLES.SALES)
      .select('paid_amount, total_amount, due_amount, payment_status, status')
      .eq('user_id', userId)
      .neq('status', 'CANCELLED');

    const totalSalesCashInflow = (allSales || []).reduce((acc: number, s: any) => acc + (Number(s.paid_amount) || 0), 0);

    const { data: allPurchases } = await supabase
      .from(TABLES.PURCHASES)
      .select('paid_amount, total_amount, due_amount, payment_status, status')
      .eq('user_id', userId)
      .neq('status', 'CANCELLED');

    const totalPurchasesCashOutflow = (allPurchases || []).reduce((acc: number, p: any) => acc + (Number(p.paid_amount) || 0), 0);

    const { data: allExpensesData } = await supabase
      .from(TABLES.EXPENSES)
      .select('amount')
      .eq('user_id', userId);

    const totalAllExpensesOutflow = (allExpensesData || []).reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);

    const { data: allInvestorsData } = await supabase
      .from(TABLES.INVESTORS)
      .select('investment_amount')
      .eq('user_id', userId);

    const totalInvestorCapitalAllTime = (allInvestorsData || []).reduce((acc: number, inv: any) => acc + (Number(inv.investment_amount) || 0), 0);

    const cashAndBank = (totalSalesCashInflow + totalInvestorCapitalAllTime) - (totalPurchasesCashOutflow + totalAllExpensesOutflow);

    const totalReceivables = (allSales || []).reduce((acc: number, s: any) => {
      if (s.payment_status !== 'LUNAS') {
        return acc + (Number(s.due_amount) || 0);
      }
      return acc;
    }, 0);

    // 5. Ambil Data Seluruh Investor
    const { data: dbInvestors, error: invErr } = await supabase
      .from(TABLES.INVESTORS)
      .select('*')
      .eq('user_id', userId)
      .order('share_percentage', { ascending: false });

    if (invErr) {
      res.status(500).json({ message: invErr.message || 'Gagal mengambil data investor.' });
      return;
    }

    const investors = dbInvestors || [];
    const totalCapital = investors.reduce((sum: number, inv: any) => sum + (Number(inv.investment_amount) || 0), 0);
    const totalSharePercentage = investors.reduce((sum: number, inv: any) => sum + (Number(inv.share_percentage) || 0), 0);

    // 6. Hitung Dividen / Bagi Hasil per Investor
    // Jika Laba Bersih > 0, bagi sesuai share_percentage
    const dividendList = investors.map((inv: any) => {
      const sharePct = Number(inv.share_percentage) || 0;
      const dividendAmount = netProfit > 0 ? Math.round(netProfit * (sharePct / 100)) : 0;

      return {
        id: inv.id,
        name: inv.name,
        phone: inv.phone,
        email: inv.email,
        investment_amount: Number(inv.investment_amount) || 0,
        share_percentage: sharePct,
        dividend_amount: dividendAmount,
        notes: inv.notes,
      };
    });

    const totalDistributedDividends = dividendList.reduce((sum: number, d: any) => sum + d.dividend_amount, 0);

    res.status(200).json({
      period: {
        startDate: startStr,
        endDate: endStr,
      },
      financial_summary: {
        revenue: totalRevenue,
        cogs: totalCogs,
        gross_profit: grossProfit,
        operating_expenses: totalOperatingExpenses,
        net_profit: netProfit,
        cash_and_bank: cashAndBank,
        receivables: totalReceivables,
      },
      investor_summary: {
        total_investors: investors.length,
        total_capital: totalCapital,
        total_share_percentage: totalSharePercentage,
        total_distributed_dividends: totalDistributedDividends,
      },
      dividends: dividendList,
    });
  } catch (error: any) {
    console.error('Investor Dividends Exception:', error);
    res.status(500).json({ message: error.message || 'Server error saat menghitung dividen investor.' });
  }
};

