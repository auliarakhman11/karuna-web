'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Calendar,
  Loader2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Receipt,
  Scale,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface JournalItem {
  id: string;
  user_id?: string;
  transaction_type?: string;
  reference_id?: string;
  transaction_date?: string;
  journal_date?: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  notes?: string | null;
  created_at?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function JournalsPage() {
    const [typeFilter, setTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  const getQueryString = () => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (typeFilter) params.append('type', typeFilter);
    return params.toString();
  };

  const { data: fetchResult, error, isLoading } = useSWR(
    `/api/reports/journals?${getQueryString()}`,
    fetcher,
    { keepPreviousData: true }
  );

  const journals: JournalItem[] = Array.isArray(fetchResult) ? fetchResult : fetchResult?.data || fetchResult?.journals || [];
  const totalItems = fetchResult?.meta?.total || 0;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const loading = isLoading;

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [startDate, endDate, typeFilter]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '-';
    return new Date(isoStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'SALE':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">PENJUALAN</Badge>;
      case 'PURCHASE':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]">PEMBELIAN</Badge>;
      case 'EXPENSE':
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px]">PENGELUARAN</Badge>;
      default:
        return <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">{type || 'UMUM'}</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalDebit = journals.reduce((sum, j) => sum + (Number(j.debit) || 0), 0);
  const totalCredit = journals.reduce((sum, j) => sum + (Number(j.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 1;

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            Buku Jurnal Umum (General Journal)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Catatan kronologis seluruh mutasi debit &amp; kredit transaksi usaha (Double-Entry Bookkeeping)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="text-xs gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Printer className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            Cetak Jurnal
          </Button>
        </div>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-black">BUKU JURNAL UMUM</h1>
        <p className="text-sm text-gray-600">
          Periode: {startDate || 'Awal'} s/d {endDate || 'Hari Ini'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Mutasi Debit</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {formatRupiah(totalDebit)}
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400 shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Mutasi Kredit</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {formatRupiah(totalCredit)}
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isBalanced
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400'
            }`}
          >
            {isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Status Keseimbangan</span>
            <h3
              className={`text-sm font-bold mt-0.5 ${
                isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isBalanced ? 'SEIMBANG (BALANCED)' : 'TIDAK SEIMBANG'}
            </h3>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tipe Transaksi Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Filter Tipe:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Transaksi</option>
              <option value="SALE">Penjualan POS</option>
              <option value="PURCHASE">Pembelian / Restok</option>
              <option value="EXPENSE">Beban Pengeluaran</option>
            </select>
          </div>

          {/* Date Picker Range (Responsive stack in mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 w-full sm:w-auto">
              <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-slate-200 focus:outline-none text-xs w-full"
              />
            </div>
            <span className="text-slate-500 text-xs text-center sm:text-left">s/d</span>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 w-full sm:w-auto">
              <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-slate-200 focus:outline-none text-xs w-full"
              />
            </div>
            <Button size="sm" variant="outline"  className="w-full sm:w-auto shrink-0 text-xs">
              Terapkan
            </Button>
          </div>
        </div>
      </Card>

      {/* Journal Table */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Daftar Ayat Jurnal</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">{journals.length} Baris Jurnal</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 dark:text-indigo-400" />
            <span className="text-sm">Memuat data ayat jurnal...</span>
          </div>
        ) : journals.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Data jurnal tidak ditemukan</p>
            <p className="text-xs text-slate-500 dark:text-slate-600">
              Jurnal dicatat secara otomatis setiap kali Anda melakukan Penjualan POS, Pembelian Restok, atau Pengeluaran Biaya.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">No. Ref / Transaksi</th>
                  <th className="py-3 px-4">Kode Akun</th>
                  <th className="py-3 px-4">Nama Akun &amp; Keterangan</th>
                  <th className="py-3 px-4 text-right">Debit (Rp)</th>
                  <th className="py-3 px-4 text-right">Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                {journals.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-sans">
                      {formatDate(j.transaction_date || j.journal_date || j.created_at)}
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(j.transaction_type)}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {j.reference_id ? j.reference_id.slice(0, 8) + '...' : '-'}
                    </td>
                    <td className="py-3 px-4 text-indigo-600 dark:text-indigo-300 font-bold">{j.account_code}</td>
                    <td className="py-3 px-4 font-sans">
                      <div className={`font-semibold ${j.credit > 0 && j.debit === 0 ? 'pl-6 text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'}`}>
                        {j.account_name}
                      </div>
                      {j.notes && (
                        <div className={`text-[11px] text-slate-500 dark:text-slate-500 ${j.credit > 0 && j.debit === 0 ? 'pl-6' : ''}`}>
                          {j.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                      {j.debit > 0 ? formatRupiah(j.debit) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                      {j.credit > 0 ? formatRupiah(j.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-950 border-t-2 border-slate-300 dark:border-slate-700 font-bold font-mono">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right font-sans uppercase text-slate-700 dark:text-slate-300">
                    Total Mutasi
                  </td>
                  <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                    {formatRupiah(totalDebit)}
                  </td>
                  <td className="py-3 px-4 text-right text-purple-600 dark:text-purple-400">
                    {formatRupiah(totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)} dari {totalItems} jurnal
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Hal {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
