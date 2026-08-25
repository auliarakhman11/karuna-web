'use client';

import React, { useState, useEffect } from 'react';
import { getInvestorDividends, DividendReportResponse } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Calendar,
  Loader2,
  Printer,
  TrendingUp,
  DollarSign,
  Users,
  ShieldCheck,
  Building2,
  Receipt,
  Sparkles,
} from 'lucide-react';

export default function InvestorDividendsPage() {
  const [data, setData] = useState<DividendReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Date filters: default 1st of current month to today
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);

  const fetchDividends = async () => {
    try {
      setLoading(true);
      const res = await getInvestorDividends({ startDate, endDate });
      setData(res.data);
    } catch (e) {
      console.error('Gagal memuat laporan bagi hasil dividen:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDividends();
  }, [startDate, endDate]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const handlePrint = () => {
    window.print();
  };

  const fin = data?.financial_summary;
  const invSummary = data?.investor_summary;
  const dividends = data?.dividends || [];

  return (
    <div className="space-y-6">
      {/* Header & Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Laporan Dividen &amp; Bagi Hasil Investor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kalkulasi otomatis hak bagi hasil dividen pemodal berdasarkan persentase saham dan Laba Bersih operasional
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="text-xs gap-1.5 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            Cetak Laporan Dividen
          </Button>
        </div>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-black">LAPORAN BAGI HASIL / DIVIDEN INVESTOR</h1>
        <p className="text-sm text-gray-600">
          Periode Perhitungan: {startDate} s/d {endDate}
        </p>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-slate-900 border-slate-800 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Periode Perhitungan:</span>
          </div>

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
            <Button size="sm" variant="outline" onClick={fetchDividends} className="w-full sm:w-auto shrink-0 text-xs">
              Terapkan
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <span className="text-sm">Menghitung laba bersih &amp; bagi hasil dividen investor...</span>
        </div>
      ) : !data ? (
        <Card className="p-8 text-center text-slate-500 bg-slate-900 border-slate-800">
          Data laporan bagi hasil tidak dapat diakses.
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Laba Bersih */}
            <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  (fin?.net_profit || 0) >= 0
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                }`}
              >
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400">Total Laba Bersih:</span>
                <h3
                  className={`text-lg font-bold font-mono mt-0.5 ${
                    (fin?.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatRupiah(fin?.net_profit || 0)}
                </h3>
              </div>
            </Card>

            {/* Piutang Pelanggan (Belum Cair) */}
            <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400">Piutang Pelanggan (Belum Cair):</span>
                <h3 className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                  {formatRupiah(fin?.receivables || 0)}
                </h3>
              </div>
            </Card>

            {/* Kas & Bank Tersedia */}
            <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400">Kas &amp; Bank Tersedia:</span>
                <h3 className="text-lg font-bold text-blue-300 font-mono mt-0.5">
                  {formatRupiah(fin?.cash_and_bank || 0)}
                </h3>
              </div>
            </Card>
          </div>

          {/* Important Note Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-300 text-xs">
            <ShieldCheck className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-bold block">Penting:</span>
              <span>
                Pembagian uang dividen fisik harap menyesuaikan ketersediaan Kas, karena sebagian laba mungkin masih berada dalam bentuk Piutang Pelanggan.
              </span>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-3 bg-slate-900/80 border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Dividen Terbagikan:</span>
              <span className="text-sm font-bold font-mono text-indigo-300">
                {formatRupiah(invSummary?.total_distributed_dividends || 0)}
              </span>
            </Card>
            <Card className="p-3 bg-slate-900/80 border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Modal Investasi:</span>
              <span className="text-sm font-bold font-mono text-slate-200">
                {formatRupiah(invSummary?.total_capital || 0)}
              </span>
            </Card>
            <Card className="p-3 bg-slate-900/80 border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Pemodal &amp; Porsi:</span>
              <span className="text-sm font-bold font-mono text-slate-200">
                {invSummary?.total_investors || 0} Orang ({invSummary?.total_share_percentage || 0}%)
              </span>
            </Card>
          </div>

          {/* Dividend Table */}
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-200">Tabel Rincian Bagi Hasil per Investor</h3>
              </div>
              <span className="text-xs text-slate-400">{dividends.length} Investor Terdaftar</span>
            </div>

            {dividends.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm">Belum ada data investor yang terdaftar di sistem.</p>
                <p className="text-xs text-slate-600">
                  Tambahkan investor terlebih dahulu pada menu <strong>Keuangan &amp; Modal &gt; Investor &amp; Modal</strong>.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">No.</th>
                      <th className="py-3 px-4">Nama Investor</th>
                      <th className="py-3 px-4 text-center">Persentase Saham (%)</th>
                      <th className="py-3 px-4 text-right">Total Modal Investasi (Rp)</th>
                      <th className="py-3 px-4 text-right">Hak Bagi Hasil / Dividen (Rp)</th>
                      <th className="py-3 px-4">Catatan / Kontak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {dividends.map((inv, idx) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-slate-500 font-sans">{idx + 1}</td>
                        <td className="py-3 px-4 font-sans font-semibold text-slate-100">
                          {inv.name}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-400">
                          <span className="bg-indigo-600/15 border border-indigo-500/30 px-2 py-0.5 rounded-full text-xs">
                            {inv.share_percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-300">
                          {formatRupiah(inv.investment_amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                          {formatRupiah(inv.dividend_amount)}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                          {inv.phone ? `${inv.phone} ` : ''}
                          {inv.notes ? `(${inv.notes})` : ''}
                          {!inv.phone && !inv.notes ? '-' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-bold font-mono">
                    <tr>
                      <td colSpan={2} className="py-3 px-4 uppercase text-slate-300 font-sans">
                        Total Keseluruhan
                      </td>
                      <td className="py-3 px-4 text-center text-indigo-400">
                        {invSummary?.total_share_percentage || 0}%
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200">
                        {formatRupiah(invSummary?.total_capital || 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400 text-sm">
                        {formatRupiah(invSummary?.total_distributed_dividends || 0)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-sans text-xs">
                        {fin?.net_profit && fin.net_profit > 0
                          ? '✅ Siap dibagikan'
                          : '⚠️ Tidak ada dividen (Laba <= 0)'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
