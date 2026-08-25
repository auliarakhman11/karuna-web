'use client';

import React, { useState, useEffect } from 'react';
import {
  getSales,
  voidSale,
  payCustomerDebt,
  deleteCustomerDebtPayment,
} from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  History,
  Loader2,
  Ban,
  Receipt,
  Search,
  Calendar,
  Eye,
  CreditCard,
  User,
  Trash2,
  ArrowDownCircle,
  Truck,
  FileText,
  X,
  PlusCircle,
} from 'lucide-react';

export default function OrdersPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Date filters: default 1st of current month to today
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);

  // Void modal state
  const [voidId, setVoidId] = useState<string | null>(null);
  const [voidLoading, setVoidLoading] = useState(false);

  // Detail Modal state
  const [detailSale, setDetailSale] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Pay Debt Modal state
  const [payDebtSale, setPayDebtSale] = useState<any | null>(null);
  const [payDebtOpen, setPayDebtOpen] = useState(false);
  const [payDebtForm, setPayDebtForm] = useState({
    amount: '',
    payment_method: 'CASH' as 'CASH' | 'TRANSFER',
    payment_date: todayStr,
    notes: '',
  });
  const [submittingDebt, setSubmittingDebt] = useState(false);
  const [debtErrorMsg, setDebtErrorMsg] = useState('');

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const res = await getSales({ startDate, endDate });
      const list = res.data?.sales || res.data || [];
      setSales(list);

      // If detail modal is open, refresh detailSale as well
      if (detailSale) {
        const updated = list.find((s: any) => s.id === detailSale.id);
        if (updated) setDetailSale(updated);
      }
    } catch (e) {
      console.error('Gagal memuat penjualan:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [startDate, endDate]);

  const handleVoid = async (id: string) => {
    try {
      setVoidLoading(true);
      await voidSale(id);
      setVoidId(null);
      fetchSalesData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membatalkan transaksi.');
    } finally {
      setVoidLoading(false);
    }
  };

  const handleOpenPayDebt = (sale: any) => {
    setPayDebtSale(sale);
    setPayDebtForm({
      amount: sale.due_amount ? String(sale.due_amount) : '',
      payment_method: 'CASH',
      payment_date: todayStr,
      notes: 'Pembayaran Piutang Pelanggan',
    });
    setDebtErrorMsg('');
    setPayDebtOpen(true);
  };

  const handleSubmitPayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDebtSale) return;

    const amountNum = Number(payDebtForm.amount);
    if (!amountNum || amountNum <= 0) {
      setDebtErrorMsg('Masukkan nominal pembayaran yang valid.');
      return;
    }

    if (amountNum > Number(payDebtSale.due_amount)) {
      setDebtErrorMsg(`Nominal melebihi sisa piutang (${formatRupiah(payDebtSale.due_amount)})`);
      return;
    }

    try {
      setSubmittingDebt(true);
      setDebtErrorMsg('');

      await payCustomerDebt(payDebtSale.id, {
        amount: amountNum,
        payment_method: payDebtForm.payment_method,
        payment_date: payDebtForm.payment_date,
        notes: payDebtForm.notes,
      });

      setPayDebtOpen(false);
      fetchSalesData();
    } catch (err: any) {
      setDebtErrorMsg(err.response?.data?.message || 'Gagal menyimpan pembayaran piutang.');
    } finally {
      setSubmittingDebt(false);
    }
  };

  const handleDeleteDebtPayment = async (paymentId: string) => {
    if (!confirm('Yakin ingin menghapus catatan riwayat cicilan ini? Sisa piutang akan dikembalikan seperti semula.')) {
      return;
    }
    try {
      await deleteCustomerDebtPayment(paymentId);
      fetchSalesData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus catatan cicilan.');
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    const inv = (s.invoice_number || '').toLowerCase();
    const cust = (s.customer?.name || '').toLowerCase();
    const note = (s.notes || '').toLowerCase();
    return inv.includes(q) || cust.includes(q) || note.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Riwayat Penjualan &amp; Piutang Pelanggan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pantau transaksi kasir (POS), status pelunasan piutang pelanggan, dan rincian struk belanja
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-slate-900 border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari invoice, nama pelanggan, atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950/60 border-slate-700"
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
              onClick={fetchSalesData}
              className="w-full sm:w-auto shrink-0 text-xs"
            >
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : filteredSales.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 bg-slate-900 border-slate-800">
          Belum ada riwayat transaksi penjualan pada periode ini.
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">No. Invoice &amp; Tgl</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Ongkir</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status &amp; Piutang</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredSales.map((s) => {
                  const displayDate = s.sale_date || s.created_at;
                  const isCredit = s.payment_type === 'CREDIT' || (Number(s.due_amount) > 0 && s.payment_status !== 'LUNAS');
                  const isPaidOff = s.payment_status === 'LUNAS' || Number(s.due_amount) <= 0;
                  const isCancelled = s.status === 'CANCELLED';

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          {s.invoice_number}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {displayDate ? new Date(displayDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {s.customer?.name || 'Umum / Tanpa Nama'}
                        </div>
                        {s.customer?.phone && (
                          <div className="text-[11px] text-slate-500 pl-5">{s.customer.phone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {s.payment_type === 'CASH' ? 'Tunai' : s.payment_type === 'TRANSFER' ? 'Transfer' : 'Kredit'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {Number(s.shipping_cost) > 0 ? (
                          <span className="text-indigo-300 font-medium">{formatRupiah(Number(s.shipping_cost))}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-400 font-mono">
                        {formatRupiah(Number(s.total_amount) || 0)}
                      </td>
                      <td className="py-3 px-4">
                        {isCancelled ? (
                          <Badge variant="danger">BATAL (VOID)</Badge>
                        ) : isPaidOff ? (
                          <Badge variant="success">LUNAS</Badge>
                        ) : (
                          <div className="space-y-1">
                            <Badge variant="warning">
                              {s.payment_status === 'CICILAN' ? 'CICILAN' : 'BELUM LUNAS'}
                            </Badge>
                            <div className="text-xs text-rose-400 font-semibold font-mono">
                              Sisa: {formatRupiah(Number(s.due_amount) || 0)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Detail Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setDetailSale(s);
                              setDetailModalOpen(true);
                            }}
                            className="h-8 px-2.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail
                          </Button>

                          {/* Bayar Piutang Button */}
                          {!isCancelled && !isPaidOff && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPayDebt(s)}
                              className="h-8 px-2.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1 font-medium"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                              Bayar Piutang
                            </Button>
                          )}

                          {/* Void Button */}
                          {!isCancelled && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setVoidId(s.id)}
                              className="h-8 px-2.5 text-xs text-rose-400 hover:bg-rose-500/10 gap-1"
                              title="Batalkan Transaksi (Kembalikan Stok)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Void
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ──────────────── Detail Modal ──────────────── */}
      <Dialog
        open={detailModalOpen}
        onOpenChange={(open) => !open && setDetailModalOpen(false)}
        title="Rincian Transaksi Penjualan"
        description="Detail lengkap item belanja, biaya pengiriman, dan riwayat pembayaran cicilan pelanggan."
      >
        {detailSale && (
          <div className="space-y-4">
            {/* Header info card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">No. Invoice</span>
                <span className="font-mono font-bold text-indigo-400">{detailSale.invoice_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Pelanggan</span>
                <span className="font-semibold text-slate-200">{detailSale.customer?.name || 'Umum / Tanpa Nama'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tanggal</span>
                <span className="text-slate-300">
                  {detailSale.sale_date || detailSale.created_at
                    ? new Date(detailSale.sale_date || detailSale.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                    : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Pembayaran</span>
                <span className="font-bold">
                  {detailSale.status === 'CANCELLED' ? (
                    <span className="text-rose-400">Dibatalkan</span>
                  ) : detailSale.payment_status === 'LUNAS' ? (
                    <span className="text-emerald-400">Lunas</span>
                  ) : (
                    <span className="text-amber-400">Belum Lunas</span>
                  )}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-indigo-400" /> Daftar Barang
              </h4>
              <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950/50">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Harga</th>
                      <th className="py-2.5 px-3 text-right">Diskon</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {((detailSale.sale_items || detailSale.items || detailSale.karuna_sale_items || [])).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500 text-xs">
                          Tidak ada rincian item barang.
                        </td>
                      </tr>
                    ) : (
                      (detailSale.sale_items || detailSale.items || detailSale.karuna_sale_items || []).map((si: any, idx: number) => (
                        <tr key={si.id || idx}>
                          <td className="py-2 px-3 font-medium text-slate-100">
                            {si.item?.name || si.karuna_items?.name || si.item_name || 'Barang'}
                            {(si.item?.code || si.karuna_items?.code) && (
                              <span className="text-slate-500 text-[10px] ml-1">({si.item?.code || si.karuna_items?.code})</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            {si.quantity} {si.item?.unit || si.karuna_items?.unit || 'pcs'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-400">
                            {formatRupiah(Number(si.unit_price ?? si.price) || 0)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-rose-400">
                            {Number(si.discount) > 0 ? `-${formatRupiah(Number(si.discount))}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-100">
                            {formatRupiah(Number(si.subtotal ?? (Number(si.unit_price ?? si.price) * Number(si.quantity) - Number(si.discount || 0))) || 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ringkasan Biaya */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Barang:</span>
                <span className="font-mono text-slate-200">
                  {formatRupiah(Number(detailSale.subtotal_amount ?? detailSale.total_amount - (Number(detailSale.shipping_cost) || 0)))}
                </span>
              </div>
              {Number(detailSale.shipping_cost) > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Ongkos Kirim:</span>
                  <span className="font-mono text-indigo-400">+{formatRupiah(Number(detailSale.shipping_cost))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-100 border-t border-slate-800/80 pt-1">
                <span>Total Transaksi:</span>
                <span className="font-mono text-emerald-400">{formatRupiah(Number(detailSale.total_amount) || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sudah Dibayar:</span>
                <span className="font-mono text-emerald-400">{formatRupiah(Number(detailSale.paid_amount) || 0)}</span>
              </div>
              {Number(detailSale.due_amount) > 0 && (
                <div className="flex justify-between font-semibold text-rose-400">
                  <span>Sisa Piutang:</span>
                  <span className="font-mono">{formatRupiah(Number(detailSale.due_amount) || 0)}</span>
                </div>
              )}
              {detailSale.notes && (
                <div className="text-slate-400 pt-1 border-t border-slate-800/50">
                  <span className="text-slate-500">Catatan:</span> {detailSale.notes}
                </div>
              )}
            </div>

            {/* Riwayat Pembayaran Cicilan Pelanggan */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <ArrowDownCircle className="w-3.5 h-3.5 text-amber-400" /> Riwayat Cicilan Piutang
                </h4>
                {detailSale.status !== 'CANCELLED' && Number(detailSale.due_amount) > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenPayDebt(detailSale);
                    }}
                    className="h-7 px-2 text-[11px] border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-1"
                  >
                    <PlusCircle className="w-3 h-3" /> Tambah Pembayaran
                  </Button>
                )}
              </div>

              {(!detailSale.payments || detailSale.payments.length === 0) ? (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/80">
                  Belum ada transaksi cicilan tambahan yang dicatat.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950/50">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Tgl Bayar</th>
                        <th className="py-2.5 px-3">Metode</th>
                        <th className="py-2.5 px-3 text-right">Nominal</th>
                        <th className="py-2.5 px-3">Catatan</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {detailSale.payments.map((p: any) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 text-slate-400">
                            {p.payment_date ? new Date(p.payment_date).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-[10px]">
                              {p.payment_method || 'CASH'}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400">
                            {formatRupiah(Number(p.amount_paid ?? p.amount) || 0)}
                          </td>
                          <td className="py-2 px-3 text-slate-400 max-w-[150px] truncate">{p.notes || '-'}</td>
                          <td className="py-2 px-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDebtPayment(p.id)}
                              className="h-6 w-6 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              title="Hapus / Batalkan Cicilan Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ──────────────── Modal Bayar Piutang ──────────────── */}
      <Dialog
        open={payDebtOpen}
        onOpenChange={(open) => !open && setPayDebtOpen(false)}
        title="Pembayaran Piutang Pelanggan"
        description="Catat pembayaran atau cicilan piutang atas invoice penjualan ini."
      >
        {payDebtSale && (
          <form onSubmit={handleSubmitPayDebt} className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">No. Invoice:</span>
                <span className="font-mono font-semibold text-indigo-400">{payDebtSale.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pelanggan:</span>
                <span className="font-semibold text-slate-200">{payDebtSale.customer?.name || 'Umum / Tanpa Nama'}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-400 border-t border-slate-800/80 pt-1">
                <span>Sisa Piutang Saat Ini:</span>
                <span className="font-mono">{formatRupiah(Number(payDebtSale.due_amount) || 0)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tanggal Pembayaran *</label>
              <Input
                type="date"
                required
                value={payDebtForm.payment_date}
                onChange={(e) => setPayDebtForm((prev) => ({ ...prev, payment_date: e.target.value }))}
                className="bg-slate-950 border-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nominal Dibayar (Rp) *</label>
              <Input
                type="number"
                required
                min="1"
                max={payDebtSale.due_amount}
                value={payDebtForm.amount}
                onChange={(e) => setPayDebtForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
                className="bg-slate-950 border-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Metode Pembayaran</label>
              <select
                value={payDebtForm.payment_method}
                onChange={(e) => setPayDebtForm((prev) => ({ ...prev, payment_method: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CASH">Tunai (Cash)</option>
                <option value="TRANSFER">Transfer Bank / QRIS</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Catatan</label>
              <Input
                type="text"
                value={payDebtForm.notes}
                onChange={(e) => setPayDebtForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Contoh: Cicilan tahap 1..."
                className="bg-slate-950 border-slate-700"
              />
            </div>

            {debtErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {debtErrorMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPayDebtOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submittingDebt} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
                {submittingDebt && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan Pembayaran
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* ──────────────── Dialog Void Confirmation ──────────────── */}
      <Dialog
        open={!!voidId}
        onOpenChange={(open) => !open && setVoidId(null)}
        title="Pembatalan Transaksi (Void)"
        description="Apakah Anda yakin ingin membatalkan transaksi ini? Seluruh stok barang pada transaksi ini akan dikembalikan otomatis ke inventaris."
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setVoidId(null)}>
            Batal
          </Button>
          <Button
            disabled={voidLoading}
            onClick={() => voidId && handleVoid(voidId)}
            className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
          >
            {voidLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Batalkan Transaksi
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
