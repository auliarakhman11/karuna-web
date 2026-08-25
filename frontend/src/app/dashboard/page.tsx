'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDashboardSummary, DashboardSummaryResponse } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  ArrowDownRight,
  TrendingUp,
  ShoppingBag,
  Package,
  Calendar,
  Loader2,
  ArrowUpRight,
  Sparkles,
  Award,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getDashboardSummary();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const summary = data?.summary || {
    total_revenue: 0,
    total_expenses: 0,
    total_cogs: 0,
    net_profit: 0,
    transaction_count: 0,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/40 via-indigo-800/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Dashboard Analitik Toko
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              Selamat Datang, {user?.name || 'Kasir / Pengguna'}! 👋
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Ringkasan performa penjualan, beban operasional, dan arus laba usaha bulan{' '}
              <span className="text-indigo-300 font-semibold">{data?.month || 'berjalan'}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard/pos">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 shadow-lg shadow-indigo-600/20">
                <ShoppingBag className="w-4 h-4" /> Buka Kasir (POS)
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pendapatan */}
        <Card className="p-4 bg-slate-900 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Pendapatan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg md:text-2xl font-bold font-mono text-emerald-400">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatRupiah(summary.total_revenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Omset bruto bulan ini</p>
          </div>
        </Card>

        {/* Total Pengeluaran */}
        <Card className="p-4 bg-slate-900 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Pengeluaran</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg md:text-2xl font-bold font-mono text-rose-400">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatRupiah(summary.total_expenses)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Beban operasional usaha</p>
          </div>
        </Card>

        {/* Laba Bersih */}
        <Card className="p-4 bg-slate-900 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Laba Bersih</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-lg md:text-2xl font-bold font-mono ${
                summary.net_profit >= 0 ? 'text-indigo-400' : 'text-rose-400'
              }`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatRupiah(summary.net_profit)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Pendapatan - HPP - Beban</p>
          </div>
        </Card>

        {/* Total Transaksi */}
        <Card className="p-4 bg-slate-900 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Transaksi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg md:text-2xl font-bold font-mono text-slate-100">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${summary.transaction_count} Nota`}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Struk penjualan selesai</p>
          </div>
        </Card>
      </div>

      {/* Main Chart: Pendapatan vs Pengeluaran Harian */}
      <Card className="bg-slate-900 border-slate-800 p-5">
        <CardHeader className="p-0 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Tren Arus Keuangan Harian (Bulan {data?.month || 'Ini'})
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Perbandingan pergerakan nilai omset Pendapatan (hijau) vs Pengeluaran (merah)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          {loading ? (
            <div className="h-72 flex items-center justify-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.daily_trend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="day"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `Tgl ${val}`}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => formatRupiah(Number(value) || 0)}
                    labelFormatter={(label) => `Tanggal ${label} ${data?.month || ''}`}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(val) => (val === 'revenue' ? 'Pendapatan (Rp)' : 'Pengeluaran (Rp)')}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="expenses"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 5 Barang Paling Laku & Fast Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 5 Table (col-span-8) */}
        <div className="lg:col-span-8">
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Top 5 Barang Terlaris Bulan Ini
                </CardTitle>
                <Link href="/dashboard/items" className="text-xs text-indigo-400 hover:underline">
                  Lihat Semua Stok →
                </Link>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Peringkat produk dengan kuantitas terjual terbanyak dalam bulan berjalan
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 text-center w-12">#</th>
                      <th className="py-2.5 px-4">Nama Barang</th>
                      <th className="py-2.5 px-4">Kategori</th>
                      <th className="py-2.5 px-4 text-center">Terjual</th>
                      <th className="py-2.5 px-4 text-right">Total Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-400" />
                        </td>
                      </tr>
                    ) : !data?.top_items || data.top_items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          Belum ada data barang terjual bulan ini.
                        </td>
                      </tr>
                    ) : (
                      data.top_items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                                idx === 0
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : idx === 1
                                  ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                                  : idx === 2
                                  ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-100">
                            {item.name}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px]">
                              {item.category || 'Umum'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-indigo-400">
                            {item.total_qty} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                            {formatRupiah(item.total_revenue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Nav & Shortcuts (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-slate-900 border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Pintas Laporan &amp; Keuangan
            </h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/reports/financial"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Laporan Laba Rugi &amp; Neraca
                  </p>
                  <p className="text-[10px] text-slate-500">Evaluasi performa komprehensif</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
              </Link>

              <Link
                href="/dashboard/reports/shipping"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Laporan Ongkos Kirim
                  </p>
                  <p className="text-[10px] text-slate-500">Bagi hasil kurir &amp; kurir toko</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
              </Link>

              <Link
                href="/dashboard/investors/dividends"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Bagi Hasil Dividen Pemodal
                  </p>
                  <p className="text-[10px] text-slate-500">Kalkulasi hak bagi hasil investor</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
              </Link>

              <Link
                href="/dashboard/settings"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Pengaturan Toko &amp; Tema
                  </p>
                  <p className="text-[10px] text-slate-500">Dark mode &amp; konfigurasi profil</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

