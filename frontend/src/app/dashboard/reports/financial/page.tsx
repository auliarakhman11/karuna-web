'use client';

import React, { useState, useEffect } from 'react';
import { getFinancialReport, FinancialReportData } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Calendar,
  Loader2,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  ShieldCheck,
  Layers,
  Building2,
  Receipt,
  Boxes,
  Users,
} from 'lucide-react';

export default function FinancialReportsPage() {
  const [report, setReport] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'INCOME_STATEMENT' | 'BALANCE_SHEET'>('INCOME_STATEMENT');

  // Date filters: default 1st of current month to today
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await getFinancialReport({ startDate, endDate });
      setReport(res.data);
    } catch (e) {
      console.error('Gagal memuat laporan keuangan:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const handlePrint = () => {
    window.print();
  };

  const inc = report?.income_statement;
  const bal = report?.balance_sheet;

  return (
    <div className="space-y-6">
      {/* Header & Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            Laporan Keuangan (Laba Rugi &amp; Neraca)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rekapitulasi performa laba rugi operasional dan posisi neraca keuangan aset &amp; ekuitas usaha
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="text-xs gap-1.5 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            Cetak / Export PDF
          </Button>
        </div>
      </div>

      {/* Printable Header (Visible only when printing) */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-black">LAPORAN KEUANGAN USAHA</h1>
        <p className="text-sm text-gray-600">
          Periode: {startDate} s/d {endDate}
        </p>
      </div>

      {/* Date Filter & Tab Switcher Toolbar */}
      <Card className="p-4 bg-slate-900 border-slate-800 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tab Selector */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('INCOME_STATEMENT')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === 'INCOME_STATEMENT'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Laporan Laba Rugi
            </button>
            <button
              onClick={() => setActiveTab('BALANCE_SHEET')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === 'BALANCE_SHEET'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Laporan Neraca (Balance Sheet)
            </button>
          </div>

          {/* Date Picker Range */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 w-full sm:w-auto">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs w-full"
              />
            </div>
            <span className="text-slate-500 text-xs text-center sm:text-left">s/d</span>
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 w-full sm:w-auto">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs w-full"
              />
            </div>
            <Button size="sm" variant="outline" onClick={fetchReport} className="w-full sm:w-auto shrink-0 text-xs">
              Terapkan
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <span className="text-sm">Menghitung seluruh transaksi &amp; posisi keuangan...</span>
        </div>
      ) : !report ? (
        <Card className="p-8 text-center text-slate-500 bg-slate-900 border-slate-800">
          Data laporan keuangan tidak dapat diakses.
        </Card>
      ) : (
        <>
          {/* ═════════════════════════════════════════════ */}
          {/* TAB 1: LAPORAN LABA RUGI (INCOME STATEMENT)  */}
          {/* ═════════════════════════════════════════════ */}
          {(activeTab === 'INCOME_STATEMENT' || typeof window !== 'undefined') && (
            <div className={`space-y-6 ${activeTab !== 'INCOME_STATEMENT' ? 'hidden print:block' : ''}`}>
              {/* Summary 3 Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Total Pendapatan (Revenue)</span>
                    <h3 className="text-lg font-bold text-slate-100 font-mono mt-0.5">
                      {formatRupiah(inc?.revenue || 0)}
                    </h3>
                  </div>
                </Card>

                <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Laba Kotor (Gross Profit)</span>
                    <h3 className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                      {formatRupiah(inc?.gross_profit || 0)}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Margin: {inc?.gross_profit_margin_pct}%
                    </span>
                  </div>
                </Card>

                <Card
                  className={`p-4 border ${
                    (inc?.net_profit || 0) >= 0
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  } flex items-center gap-4`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      (inc?.net_profit || 0) >= 0
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    }`}
                  >
                    {(inc?.net_profit || 0) >= 0 ? (
                      <ArrowUpRight className="w-6 h-6" />
                    ) : (
                      <ArrowDownRight className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Laba Bersih (Net Profit)</span>
                    <h3
                      className={`text-xl font-bold font-mono mt-0.5 ${
                        (inc?.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatRupiah(inc?.net_profit || 0)}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Net Margin: {inc?.net_profit_margin_pct}%
                    </span>
                  </div>
                </Card>
              </div>

              {/* Detailed Income Statement Table Card */}
              <Card className="overflow-hidden border border-slate-800 bg-slate-900">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Rincian Laporan Laba Rugi Komprehensif
                  </h3>
                  <Badge variant="outline" className="text-xs font-mono">
                    {startDate} s/d {endDate}
                  </Badge>
                </div>

                <div className="p-4 space-y-4">
                  {/* 1. Pendapatan */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-200 border-b border-slate-800/80 pb-1.5">
                      <span>1. PENDAPATAN OPERASIONAL (REVENUE)</span>
                      <span className="font-mono">{formatRupiah(inc?.revenue || 0)}</span>
                    </div>
                    <div className="pl-4 space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Total Penjualan Barang Dagang (POS &amp; Invoice)</span>
                        <span className="font-mono text-slate-300">{formatRupiah(inc?.revenue || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. HPP */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-200 border-b border-slate-800/80 pb-1.5">
                      <span>2. HARGA POKOK PENJUALAN (HPP / COGS)</span>
                      <span className="font-mono text-rose-400">({formatRupiah(inc?.cogs || 0)})</span>
                    </div>
                    <div className="pl-4 space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Total Modal Pokok Barang Terjual (Qty × Harga Beli)</span>
                        <span className="font-mono text-rose-400">({formatRupiah(inc?.cogs || 0)})</span>
                      </div>
                    </div>
                  </div>

                  {/* Subtotal: Laba Kotor */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center text-sm font-bold">
                    <span className="text-amber-300">LABA KOTOR (GROSS PROFIT)</span>
                    <span className="font-mono text-amber-300 text-base">{formatRupiah(inc?.gross_profit || 0)}</span>
                  </div>

                  {/* 3. Beban Operasional */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-200 border-b border-slate-800/80 pb-1.5">
                      <span>3. BEBAN OPERASIONAL (OPERATING EXPENSES)</span>
                      <span className="font-mono text-rose-400">({formatRupiah(inc?.operating_expenses || 0)})</span>
                    </div>

                    <div className="pl-4 space-y-2 text-xs text-slate-400">
                      {(!inc?.expenses_breakdown || inc.expenses_breakdown.length === 0) ? (
                        <p className="text-slate-600 italic">Tidak ada pencatatan beban operasional pada periode ini.</p>
                      ) : (
                        inc.expenses_breakdown.map((b, idx) => (
                          <div key={idx} className="flex justify-between items-center py-0.5">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                              Beban {b.category_name} ({b.count} transaksi)
                            </span>
                            <span className="font-mono text-slate-300">{formatRupiah(b.total_amount)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Final: Laba Bersih */}
                  <div
                    className={`p-4 rounded-xl border flex justify-between items-center ${
                      (inc?.net_profit || 0) >= 0
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-bold block uppercase tracking-wide">
                        {(inc?.net_profit || 0) >= 0 ? 'LABA BERSIH (NET PROFIT)' : 'RUGI BERSIH (NET LOSS)'}
                      </span>
                      <span className="text-[11px] opacity-80">Laba Kotor dikurangi Total Beban Operasional</span>
                    </div>
                    <span className="text-xl font-bold font-mono">{formatRupiah(inc?.net_profit || 0)}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ═════════════════════════════════════════════ */}
          {/* TAB 2: LAPORAN NERACA (BALANCE SHEET)        */}
          {/* ═════════════════════════════════════════════ */}
          {(activeTab === 'BALANCE_SHEET' || typeof window !== 'undefined') && (
            <div className={`space-y-6 ${activeTab !== 'BALANCE_SHEET' ? 'hidden print:block' : ''}`}>
              {/* 2-Column Balance Sheet Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kolom Kiri: ASET (AKTIVA) */}
                <Card className="overflow-hidden border border-slate-800 bg-slate-900">
                  <div className="p-4 border-b border-slate-800 bg-indigo-950/30 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Aset / Harta (Aktiva)
                    </h3>
                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-300">
                      Total Aset
                    </Badge>
                  </div>

                  <div className="p-4 space-y-4 text-xs">
                    {/* Kas & Bank */}
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200 block">Kas &amp; Saldo Bank</span>
                          <span className="text-[10px] text-slate-500">Saldo kas riil kasir &amp; rekening usaha</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-100 text-sm">
                        {formatRupiah(bal?.assets.cash_and_bank || 0)}
                      </span>
                    </div>

                    {/* Piutang Pelanggan */}
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200 block">Piutang Pelanggan</span>
                          <span className="text-[10px] text-slate-500">Penjualan kredit yang belum lunas</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-300 text-sm">
                        {formatRupiah(bal?.assets.receivables || 0)}
                      </span>
                    </div>

                    {/* Persediaan Barang Gudang */}
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Boxes className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200 block">Persediaan Barang (Stok)</span>
                          <span className="text-[10px] text-slate-500">Valuasi stok gudang (Qty × Harga Beli)</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-300 text-sm">
                        {formatRupiah(bal?.assets.inventory_valuation || 0)}
                      </span>
                    </div>

                    {/* Total Aktiva Header */}
                    <div className="p-4 rounded-xl bg-indigo-900/20 border border-indigo-500/30 flex justify-between items-center font-bold text-sm">
                      <span className="text-indigo-200">TOTAL ASET / AKTIVA</span>
                      <span className="font-mono text-indigo-300 text-base">
                        {formatRupiah(bal?.assets.total_assets || 0)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Kolom Kanan: KEWAJIBAN & EKUITAS (PASIVA) */}
                <Card className="overflow-hidden border border-slate-800 bg-slate-900">
                  <div className="p-4 border-b border-slate-800 bg-purple-950/30 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Kewajiban &amp; Ekuitas (Pasiva)
                    </h3>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                      Total Pasiva
                    </Badge>
                  </div>

                  <div className="p-4 space-y-4 text-xs">
                    {/* Hutang Supplier (Liabilities) */}
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                          <ArrowDownRight className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200 block">Hutang Supplier (Kewajiban)</span>
                          <span className="text-[10px] text-slate-500">Sisa tagihan restok ke supplier</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-rose-400 text-sm">
                        {formatRupiah(bal?.liabilities.supplier_payables || 0)}
                      </span>
                    </div>

                    {/* Modal Investor (Equity) */}
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200 block">Modal Investor / Pemilik</span>
                          <span className="text-[10px] text-slate-500">Total setoran modal pemegang saham</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-blue-300 text-sm">
                        {formatRupiah(bal?.equity.investor_capital || 0)}
                      </span>
                    </div>

                    {/* Laba Berjalan / Ditahan */}
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                          <PieChart className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200 block">Laba Berjalan / Ditahan Kumulatif</span>
                          <span className="text-[10px] text-slate-500">Akumulasi laba bersih operasional</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-purple-300 text-sm">
                        {formatRupiah(bal?.equity.retained_earnings || 0)}
                      </span>
                    </div>

                    {/* Total Pasiva Header */}
                    <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30 flex justify-between items-center font-bold text-sm">
                      <span className="text-purple-200">TOTAL KEWAJIBAN &amp; EKUITAS</span>
                      <span className="font-mono text-purple-300 text-base">
                        {formatRupiah(bal?.total_liabilities_and_equity || 0)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Balance Verification Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  bal?.is_balanced
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      bal?.is_balanced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {bal?.is_balanced ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">
                      {bal?.is_balanced
                        ? 'Neraca Keuangan Seimbang (Balance)'
                        : 'Neraca Keuangan Belum Seimbang'}
                    </h4>
                    <p className="text-xs opacity-80">
                      {bal?.is_balanced
                        ? 'Total Nilai Aset (Harta) sama persis dengan Total Nilai Kewajiban + Ekuitas Modal.'
                        : 'Terdapat selisih antara nilai total aktiva dan pasiva.'}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs hidden sm:block">
                  <div>Aset: {formatRupiah(bal?.assets.total_assets || 0)}</div>
                  <div>Pasiva: {formatRupiah(bal?.total_liabilities_and_equity || 0)}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
