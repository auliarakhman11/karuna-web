'use client';

import React, { useState, useEffect } from 'react';
import { getShippingReport, ShippingReportResponse, ShippingRecord } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Truck,
  Calendar,
  Loader2,
  Printer,
  DollarSign,
  PackageCheck,
  Receipt,
  Search,
  User,
  Phone,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ShippingReportPage() {
  const [data, setData] = useState<ShippingReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Date filter: default 1st of current month to today
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await getShippingReport({ startDate, endDate });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load shipping report:', err);
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

  const shipments = data?.shipments || [];

  const filteredShipments = shipments.filter((s) => {
    const q = search.toLowerCase();
    const inv = (s.invoice_number || '').toLowerCase();
    const cust = (s.customer_name || '').toLowerCase();
    const ph = (s.customer_phone || '').toLowerCase();
    return inv.includes(q) || cust.includes(q) || ph.includes(q);
  });

  const totalFilteredOngkir = filteredShipments.reduce((sum, s) => sum + (s.shipping_cost || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            Laporan Ongkos Kirim (Shipping Fee)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rekapitulasi tagihan ongkos kirim pengiriman barang ke pelanggan untuk pembagian hasil kurir
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="text-xs gap-1.5 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            Cetak Rekap Ongkir
          </Button>
        </div>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-black">LAPORAN ONGKOS KIRIM &amp; PENGIRIMAN</h1>
        <p className="text-sm text-gray-600">
          Periode: {startDate} s/d {endDate}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Ongkir */}
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Total Ongkos Kirim Terkumpul</span>
            <h3 className="text-xl font-bold text-indigo-400 font-mono mt-0.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : formatRupiah(totalFilteredOngkir)}
            </h3>
          </div>
        </Card>

        {/* Total Pengiriman */}
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Total Transaksi Kirim</span>
            <h3 className="text-xl font-bold text-slate-100 font-mono mt-0.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${filteredShipments.length} Pengiriman`}
            </h3>
          </div>
        </Card>

        {/* Rata-rata per Pengiriman */}
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Rata-rata Ongkir / Nota</span>
            <h3 className="text-xl font-bold text-slate-100 font-mono mt-0.5">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : filteredShipments.length > 0 ? (
                formatRupiah(Math.round(totalFilteredOngkir / filteredShipments.length))
              ) : (
                'Rp 0'
              )}
            </h3>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-slate-900 border-slate-800 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari invoice nota atau nama pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date Filter */}
          <div className="md:col-span-6 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 bg-slate-950/60 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none w-full text-xs"
              />
            </div>
            <span className="text-slate-500 text-xs text-center sm:text-left">s/d</span>
            <div className="flex-1 flex items-center gap-1.5 bg-slate-950/60 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none w-full text-xs"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchReport}
              className="w-full sm:w-auto shrink-0 text-xs"
            >
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Shipping Table */}
      {loading ? (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : filteredShipments.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 bg-slate-900 border-slate-800">
          Tidak ada data transaksi dengan ongkos kirim pada periode ini.
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tanggal Transaksi</th>
                  <th className="py-3 px-4">No. Invoice / Nota</th>
                  <th className="py-3 px-4">Pelanggan Penerima</th>
                  <th className="py-3 px-4">Status Nota</th>
                  <th className="py-3 px-4 text-right">Nominal Ongkir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-xs text-slate-300">
                      {s.sale_date
                        ? new Date(s.sale_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-100">
                      {s.invoice_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{s.customer_name}</div>
                      {s.customer_phone && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {s.customer_phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          s.payment_status === 'LUNAS'
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                            : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {s.payment_status || 'SELESAI'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-400">
                      {formatRupiah(s.shipping_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950/80 font-bold border-t border-slate-800 text-slate-100 text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider">
                    Total Ongkos Kirim Periode Ini:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-400 text-sm">
                    {formatRupiah(totalFilteredOngkir)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
