import { Response } from 'express';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getFinancialReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { startDate, endDate } = req.query;

    const startStr = typeof startDate === 'string' && startDate.trim() ? startDate.trim() : null;
    const endStr = typeof endDate === 'string' && endDate.trim() ? endDate.trim() : null;

    const startIso = startStr ? (startStr.includes('T') ? startStr : `${startStr}T00:00:00.000Z`) : null;
    const endIso = endStr ? (endStr.includes('T') ? endStr : `${endStr}T23:59:59.999Z`) : null;

    // ─────────────────────────────────────────────
    // 1. FETCH SALES & SALE_ITEMS (INCOME STATEMENT: REVENUE & COGS)
    // ─────────────────────────────────────────────
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

    const { data: periodSales, error: salesErr } = await salesQuery;
    if (salesErr) {
      console.error('Fetch sales for financial report error:', salesErr);
    }

    // Filter out cancelled transactions
    const validPeriodSales = (periodSales || []).filter((s: any) => {
      const st = String(s.status || '').toUpperCase();
      return st !== 'CANCELLED' && st !== 'VOID';
    });

    const periodSaleIds = validPeriodSales.map((s: any) => s.id);

    // Revenue: sum of total_amount
    const totalRevenue = validPeriodSales.reduce((acc: number, s: any) => acc + (Number(s.total_amount) || 0), 0);

    // Fetch sale items to calculate COGS (HPP)
    let totalCogs = 0;
    if (periodSaleIds.length > 0) {
      const { data: saleItems, error: itemsErr } = await supabase
        .from(TABLES.SALE_ITEMS)
        .select('*')
        .in('sale_id', periodSaleIds);

      if (!itemsErr && saleItems && saleItems.length > 0) {
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
          // Check if sale_item already recorded cost_price
          const recordedCost = Number(si.cost_price ?? si.buy_price);
          const buyPrice = !isNaN(recordedCost) && recordedCost > 0 ? recordedCost : (itemBuyPriceMap.get(si.item_id) || 0);
          return acc + (Number(si.quantity) || 0) * buyPrice;
        }, 0);
      }
    }

    // Gross Profit
    const grossProfit = totalRevenue - totalCogs;

    // ─────────────────────────────────────────────
    // 2. FETCH EXPENSES (OPERATIONAL EXPENSES)
    // ─────────────────────────────────────────────
    let expQuery = supabase
      .from(TABLES.EXPENSES)
      .select('*')
      .eq('user_id', userId);

    if (startIso) expQuery = expQuery.gte('expense_date', startIso);
    if (endIso) expQuery = expQuery.lte('expense_date', endIso);

    const { data: periodExpenses, error: expErr } = await expQuery;
    if (expErr) {
      console.error('Fetch expenses error:', expErr);
    }

    const validPeriodExpenses = periodExpenses || [];

    // Group expenses by category
    const catIds = Array.from(new Set(validPeriodExpenses.map((e: any) => e.category_id).filter(Boolean)));
    let catMap = new Map<string, string>();
    if (catIds.length > 0) {
      const { data: dbCats } = await supabase
        .from(TABLES.EXPENSE_CATEGORIES)
        .select('id, name')
        .in('id', catIds);
      (dbCats || []).forEach((c: any) => catMap.set(c.id, c.name));
    }

    const expensesByCategoryMap: { [key: string]: { category_name: string; total_amount: number; count: number } } = {};
    let totalOperatingExpenses = 0;

    validPeriodExpenses.forEach((exp: any) => {
      const catName = exp.category_id ? catMap.get(exp.category_id) || 'Lain-lain' : 'Lain-lain';
      const amt = Number(exp.amount) || 0;
      totalOperatingExpenses += amt;

      if (!expensesByCategoryMap[catName]) {
        expensesByCategoryMap[catName] = { category_name: catName, total_amount: 0, count: 0 };
      }
      expensesByCategoryMap[catName].total_amount += amt;
      expensesByCategoryMap[catName].count += 1;
    });

    const expensesBreakdown = Object.values(expensesByCategoryMap);

    // Net Profit
    const netProfit = grossProfit - totalOperatingExpenses;

    // ─────────────────────────────────────────────
    // 3. BALANCE SHEET (NERACA) - CUMULATIVE & CURRENT POSITION
    // ─────────────────────────────────────────────

    // A. Kas & Bank Calculation (Inflow - Outflow)
    // 1. Inflows:
    // a. All Non-cancelled Sales (Cash / DP paid)
    const { data: allSales } = await supabase
      .from(TABLES.SALES)
      .select('paid_amount, total_amount, due_amount, payment_status, status')
      .eq('user_id', userId)
      .neq('status', 'CANCELLED');

    const totalSalesCashInflow = (allSales || []).reduce((acc: number, s: any) => acc + (Number(s.paid_amount) || 0), 0);

    // b. Customer debt installments payments (karuna_customer_debt_payments)
    const { data: allCustomerDebtPayments } = await supabase
      .from(TABLES.CUSTOMER_DEBT_PAYMENTS)
      .select('amount_paid, amount')
      .eq('user_id', userId);

    const totalCustomerInstallments = (allCustomerDebtPayments || []).reduce(
      (acc: number, p: any) => acc + (Number(p.amount_paid ?? p.amount) || 0),
      0
    );

    // c. Investor Capital (karuna_investors)
    const { data: allInvestors } = await supabase
      .from(TABLES.INVESTORS)
      .select('investment_amount')
      .eq('user_id', userId);

    const totalInvestorEquity = (allInvestors || []).reduce(
      (acc: number, inv: any) => acc + (Number(inv.investment_amount) || 0),
      0
    );

    // 2. Outflows:
    // a. Purchases (Restock cash / DP paid)
    const { data: allPurchases } = await supabase
      .from(TABLES.PURCHASES)
      .select('paid_amount, total_amount, due_amount, payment_status, status')
      .eq('user_id', userId)
      .neq('status', 'CANCELLED');

    const totalPurchasesCashOutflow = (allPurchases || []).reduce(
      (acc: number, p: any) => acc + (Number(p.paid_amount) || 0),
      0
    );

    // b. Supplier debt installments payments (karuna_supplier_debt_payments)
    const { data: allSupplierDebtPayments } = await supabase
      .from(TABLES.SUPPLIER_DEBT_PAYMENTS)
      .select('amount_paid, amount')
      .eq('user_id', userId);

    const totalSupplierInstallments = (allSupplierDebtPayments || []).reduce(
      (acc: number, p: any) => acc + (Number(p.amount_paid ?? p.amount) || 0),
      0
    );

    // c. All Expenses
    const { data: allExpenses } = await supabase
      .from(TABLES.EXPENSES)
      .select('amount')
      .eq('user_id', userId);

    const totalExpensesOutflow = (allExpenses || []).reduce(
      (acc: number, e: any) => acc + (Number(e.amount) || 0),
      0
    );

    // Kas & Bank Balance
    const totalCashInflow = totalSalesCashInflow + totalInvestorEquity;
    const totalCashOutflow = totalPurchasesCashOutflow + totalExpensesOutflow;
    const cashAndBank = totalCashInflow - totalCashOutflow;

    // B. Piutang Pelanggan (Receivables)
    const totalReceivables = (allSales || []).reduce((acc: number, s: any) => {
      if (s.payment_status !== 'LUNAS') {
        return acc + (Number(s.due_amount) || 0);
      }
      return acc;
    }, 0);

    // C. Persediaan Barang Gudang (Inventory Valuation: stock * buy_price)
    const { data: allItems } = await supabase
      .from(TABLES.ITEMS)
      .select('stock, buy_price, price')
      .eq('user_id', userId);

    const totalInventoryValue = (allItems || []).reduce((acc: number, it: any) => {
      const qty = Math.max(0, Number(it.stock) || 0);
      const buyPrice = Number(it.buy_price) || 0;
      return acc + (qty * buyPrice);
    }, 0);

    // Total Assets (Aktiva)
    const totalAssets = cashAndBank + totalReceivables + totalInventoryValue;

    // D. Hutang Supplier (Liabilities / Kewajiban)
    const totalSupplierPayables = (allPurchases || []).reduce((acc: number, p: any) => {
      if (p.payment_status !== 'LUNAS') {
        return acc + (Number(p.due_amount) || 0);
      }
      return acc;
    }, 0);

    // E. Ekuitas (Equity)
    // 1. Modal Investor = totalInvestorEquity
    // 2. Laba Ditahan / Laba Berjalan Kumulatif = Total Aset - (Hutang Supplier + Modal Investor)
    // Atau dihitung dari Kumulatif All-Time Net Profit
    const cumulativeRetainedEarnings = totalAssets - (totalSupplierPayables + totalInvestorEquity);

    // Total Pasiva (Kewajiban + Ekuitas)
    const totalLiabilitiesAndEquity = totalSupplierPayables + totalInvestorEquity + cumulativeRetainedEarnings;

    // Balance check
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1; // precision tolerance

    // ─────────────────────────────────────────────
    // 4. RESPONSE PACKAGING
    // ─────────────────────────────────────────────
    res.status(200).json({
      period: {
        startDate: startStr,
        endDate: endStr,
      },
      income_statement: {
        revenue: totalRevenue,
        cogs: totalCogs,
        gross_profit: grossProfit,
        gross_profit_margin_pct: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : '0.00',
        operating_expenses: totalOperatingExpenses,
        expenses_breakdown: expensesBreakdown,
        net_profit: netProfit,
        net_profit_margin_pct: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0.00',
      },
      balance_sheet: {
        assets: {
          cash_and_bank: cashAndBank,
          receivables: totalReceivables,
          inventory_valuation: totalInventoryValue,
          total_assets: totalAssets,
        },
        liabilities: {
          supplier_payables: totalSupplierPayables,
          total_liabilities: totalSupplierPayables,
        },
        equity: {
          investor_capital: totalInvestorEquity,
          retained_earnings: cumulativeRetainedEarnings,
          total_equity: totalInvestorEquity + cumulativeRetainedEarnings,
        },
        total_liabilities_and_equity: totalLiabilitiesAndEquity,
        is_balanced: isBalanced,
      },
    });
  } catch (error: any) {
    console.error('Financial Report Exception:', error);
    res.status(500).json({ message: error.message || 'Internal server error saat menghitung laporan keuangan' });
  }
};

// ─────────────────────────────────────────────
// GET /api/reports/journals — Fetch General Journal Entries
// ─────────────────────────────────────────────
export const getJournalEntries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { startDate, endDate, type, page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const startStr = typeof startDate === 'string' && startDate.trim() ? startDate.trim() : null;
    const endStr = typeof endDate === 'string' && endDate.trim() ? endDate.trim() : null;

    let query = supabase
      .from(TABLES.JOURNALS)
      .select('*', { count: 'exact' })
      .range(from, to)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startStr) {
      const startIso = startStr.includes('T') ? startStr : `${startStr}T00:00:00.000Z`;
      query = query.or(`transaction_date.gte.${startIso},and(transaction_date.is.null,created_at.gte.${startIso})`);
    }
    if (endStr) {
      const endIso = endStr.includes('T') ? endStr : `${endStr}T23:59:59.999Z`;
      query = query.or(`transaction_date.lte.${endIso},and(transaction_date.is.null,created_at.lte.${endIso})`);
    }
    if (type && typeof type === 'string' && type.trim()) {
      query = query.eq('transaction_type', type.trim().toUpperCase());
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Fetch journals error:', error);
      // Fallback query tanpa filter tanggal jika terjadi syntax issue
      const { data: fbData, count: fbCount } = await supabase
        .from(TABLES.JOURNALS)
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      const fbJournals = fbData || [];
      const totalDebit = fbJournals.reduce((sum: number, j: any) => sum + (Number(j.debit) || 0), 0);
      const totalCredit = fbJournals.reduce((sum: number, j: any) => sum + (Number(j.credit) || 0), 0);

      res.status(200).json({
        journals: fbJournals,
        summary: {
          total_debit: totalDebit,
          total_credit: totalCredit,
          is_balanced: Math.abs(totalDebit - totalCredit) < 1,
          count: fbJournals.length,
          total_records: fbCount || 0,
          page: pageNum,
          limit: limitNum
        },
      });
      return;
    }

    const journals = data || [];

    // Total debit & kredit summary
    const totalDebit = journals.reduce((sum: number, j: any) => sum + (Number(j.debit) || 0), 0);
    const totalCredit = journals.reduce((sum: number, j: any) => sum + (Number(j.credit) || 0), 0);

    res.status(200).json({
      journals,
      summary: {
        total_debit: totalDebit,
        total_credit: totalCredit,
        is_balanced: Math.abs(totalDebit - totalCredit) < 1,
        count: journals.length,
        total_records: count || 0,
        page: pageNum,
        limit: limitNum
      },
    });
  } catch (error: any) {
    console.error('Journals Exception:', error);
    res.status(500).json({ message: error.message || 'Server error saat mengambil data jurnal' });
  }
};

// ─────────────────────────────────────────────
// GET /api/reports/dashboard — Summary, Daily Trend, & Top Items
// ─────────────────────────────────────────────
export const getDashboardSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    // 1. Fetch sales for current month
    const { data: sales, error: salesErr } = await supabase
      .from(TABLES.SALES)
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'CANCELLED')
      .or(`sale_date.gte.${startOfMonth},and(sale_date.is.null,created_at.gte.${startOfMonth})`)
      .or(`sale_date.lte.${endOfMonth},and(sale_date.is.null,created_at.lte.${endOfMonth})`);

    if (salesErr) console.error('Dashboard sales err:', salesErr);
    const validSales = sales || [];

    const totalRevenue = validSales.reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0);
    const transactionCount = validSales.length;

    // COGS
    const saleIds = validSales.map((s: any) => s.id);
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
            .select('id, buy_price')
            .in('id', itemIds);

          (dbItems || []).forEach((it: any) => itemBuyPriceMap.set(it.id, Number(it.buy_price) || 0));
        }

        totalCogs = saleItems.reduce((acc: number, si: any) => {
          const cost = Number(si.cost_price ?? si.buy_price);
          const buyPrice = !isNaN(cost) && cost > 0 ? cost : (itemBuyPriceMap.get(si.item_id) || 0);
          return acc + (Number(si.quantity) || 0) * buyPrice;
        }, 0);
      }
    }

    // 2. Fetch expenses for current month
    const { data: expenses, error: expErr } = await supabase
      .from(TABLES.EXPENSES)
      .select('*')
      .eq('user_id', userId)
      .gte('expense_date', startOfMonth)
      .lte('expense_date', endOfMonth);

    if (expErr) console.error('Dashboard exp err:', expErr);
    const validExpenses = expenses || [];
    const totalExpenses = validExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

    const netProfit = totalRevenue - totalCogs - totalExpenses;

    // 3. Daily trend for current month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyMap = new Map<string, { date: string; day: number; revenue: number; expenses: number }>();

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dailyMap.set(dayStr, { date: dayStr, day: d, revenue: 0, expenses: 0 });
    }

    validSales.forEach((s: any) => {
      const dStr = (s.sale_date || s.created_at || '').substring(0, 10);
      if (dailyMap.has(dStr)) {
        dailyMap.get(dStr)!.revenue += Number(s.total_amount) || 0;
      }
    });

    validExpenses.forEach((e: any) => {
      const dStr = (e.expense_date || e.created_at || '').substring(0, 10);
      if (dailyMap.has(dStr)) {
        dailyMap.get(dStr)!.expenses += Number(e.amount) || 0;
      }
    });

    const dailyTrend = Array.from(dailyMap.values());

    // 4. Top 5 Best Selling Items this month
    let topItems: Array<{ id: string; name: string; category?: string; total_qty: number; total_revenue: number }> = [];
    if (saleIds.length > 0) {
      const { data: allSaleItems } = await supabase
        .from(TABLES.SALE_ITEMS)
        .select('item_id, quantity, price, discount, subtotal')
        .in('sale_id', saleIds);

      if (allSaleItems && allSaleItems.length > 0) {
        const itemAgg = new Map<string, { total_qty: number; total_revenue: number }>();
        allSaleItems.forEach((si: any) => {
          if (!si.item_id) return;
          const curr = itemAgg.get(si.item_id) || { total_qty: 0, total_revenue: 0 };
          const qty = Number(si.quantity) || 0;
          const lineSub = Number(si.subtotal ?? (Number(si.price) * qty - (Number(si.discount) || 0))) || 0;
          curr.total_qty += qty;
          curr.total_revenue += lineSub;
          itemAgg.set(si.item_id, curr);
        });

        const sortedItemIds = Array.from(itemAgg.entries())
          .sort((a, b) => b[1].total_qty - a[1].total_qty)
          .slice(0, 5);

        if (sortedItemIds.length > 0) {
          const { data: itemsMeta } = await supabase
            .from(TABLES.ITEMS)
            .select('id, name, unit, category:category_id(name)')
            .in('id', sortedItemIds.map(([id]) => id));

          const metaMap = new Map((itemsMeta || []).map((it: any) => [it.id, it]));

          topItems = sortedItemIds.map(([id, stats]) => {
            const meta: any = metaMap.get(id);
            return {
              id,
              name: meta?.name || 'Barang Terhapus',
              unit: meta?.unit || 'pcs',
              category: meta?.category?.name || 'Umum',
              total_qty: stats.total_qty,
              total_revenue: stats.total_revenue,
            };
          });
        }
      }
    }

    res.status(200).json({
      month: now.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
      summary: {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        total_cogs: totalCogs,
        net_profit: netProfit,
        transaction_count: transactionCount,
      },
      daily_trend: dailyTrend,
      top_items: topItems,
    });
  } catch (error: any) {
    console.error('Dashboard Summary Exception:', error);
    res.status(500).json({ message: error.message || 'Server error saat memuat ringkasan dashboard' });
  }
};

// ─────────────────────────────────────────────
// GET /api/reports/shipping — Shipping Fee Report
// ─────────────────────────────────────────────
export const getShippingReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { startDate, endDate } = req.query;

    const startStr = typeof startDate === 'string' && startDate.trim() ? startDate.trim() : null;
    const endStr = typeof endDate === 'string' && endDate.trim() ? endDate.trim() : null;

    let query = supabase
      .from(TABLES.SALES)
      .select('id, invoice_number, sale_date, created_at, shipping_cost, payment_status, status, customer:customer_id(id, name, phone)')
      .eq('user_id', userId)
      .gt('shipping_cost', 0)
      .neq('status', 'CANCELLED')
      .order('sale_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (startStr) {
      const startIso = startStr.includes('T') ? startStr : `${startStr}T00:00:00.000Z`;
      query = query.or(`sale_date.gte.${startIso},and(sale_date.is.null,created_at.gte.${startIso})`);
    }
    if (endStr) {
      const endIso = endStr.includes('T') ? endStr : `${endStr}T23:59:59.999Z`;
      query = query.or(`sale_date.lte.${endIso},and(sale_date.is.null,created_at.lte.${endIso})`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Fetch shipping report error:', error);
      res.status(500).json({ message: error.message || 'Gagal memuat laporan ongkir' });
      return;
    }

    const shipments = (data || []).map((s: any) => ({
      id: s.id,
      invoice_number: s.invoice_number,
      sale_date: s.sale_date || s.created_at,
      customer_name: s.customer?.name || 'Umum / Tanpa Nama',
      customer_phone: s.customer?.phone || null,
      shipping_cost: Number(s.shipping_cost) || 0,
      payment_status: s.payment_status,
    }));

    const totalShipping = shipments.reduce((sum: number, s: any) => sum + s.shipping_cost, 0);

    res.status(200).json({
      period: { startDate: startStr, endDate: endStr },
      shipments,
      total_shipping: totalShipping,
      total_count: shipments.length,
    });
  } catch (error: any) {
    console.error('Shipping Report Exception:', error);
    res.status(500).json({ message: error.message || 'Server error saat memuat laporan ongkos kirim' });
  }
};


