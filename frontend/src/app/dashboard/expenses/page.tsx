'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  Expense,
  ExpenseCategory,
} from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  Receipt,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Calendar,
  Tag,
  DollarSign,
  ArrowDownRight,
  CreditCard,
  Layers,
} from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';


export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Date filters: default 1st of current month to today
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [formDate, setFormDate] = useState(todayStr);
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchExpensesData = async () => {
    try {
      setLoading(true);
      const res = await getExpenses({ startDate, endDate });
      setExpenses(res.data?.expenses || res.data || []);
    } catch (e) {
      console.error('Gagal memuat pengeluaran:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesData = async () => {
    try {
      const res = await getExpenseCategories();
      setCategories(res.data?.categories || res.data || []);
    } catch (e) {
      console.error('Gagal memuat kategori:', e);
    }
  };

  useEffect(() => {
    fetchExpensesData();
    fetchCategoriesData();
  }, [startDate, endDate]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormCategoryId(categories[0]?.id || '');
    setFormAmount('');
    setFormPaymentMethod('Cash');
    setFormDate(todayStr);
    setFormNotes('');
    setErrorMsg('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormCategoryId(exp.category_id || '');
    setFormAmount(String(exp.amount));
    setFormPaymentMethod((exp.payment_method as any) || 'Cash');
    setFormDate(exp.expense_date ? exp.expense_date.split('T')[0] : todayStr);
    setFormNotes(exp.notes || '');
    setErrorMsg('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(formAmount);
    if (!amountNum || amountNum <= 0) {
      setErrorMsg('Masukkan jumlah nominal pengeluaran yang valid.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload = {
        category_id: formCategoryId || null,
        amount: amountNum,
        payment_method: formPaymentMethod,
        expense_date: formDate,
        notes: formNotes.trim(),
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
      } else {
        await createExpense(payload);
      }

      setDialogOpen(false);
      fetchExpensesData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan transaksi pengeluaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus catatan pengeluaran operasional ini?')) return;
    try {
      await deleteExpense(id);
      fetchExpensesData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus catatan pengeluaran.');
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const filteredExpenses = expenses.filter((e) => {
    const q = search.toLowerCase();
    const cat = (e.category?.name || e.category_name || '').toLowerCase();
    const notes = (e.notes || '').toLowerCase();
    const method = (e.payment_method || '').toLowerCase();
    return cat.includes(q) || notes.includes(q) || method.includes(q);
  });

  const totalFilteredExpense = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            Pengeluaran Operasional
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan beban operasional usaha harian/bulanan di luar pembelian stok barang dagang
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/expenses/categories">
            <Button variant="outline" className="text-xs gap-1.5 border-slate-700">
              <Tag className="w-4 h-4 text-indigo-400" />
              Kelola Jenis / Kategori
            </Button>
          </Link>
          <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Catat Pengeluaran
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Total Pengeluaran Periode Ini</span>
            <h3 className="text-xl font-bold text-rose-400 font-mono mt-0.5">
              {formatRupiah(totalFilteredExpense)}
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Jumlah Transaksi</span>
            <h3 className="text-xl font-bold text-slate-100 font-mono mt-0.5">
              {filteredExpenses.length} Transaksi
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Jumlah Jenis Kategori</span>
            <h3 className="text-xl font-bold text-slate-100 font-mono mt-0.5">
              {categories.length} Kategori
            </h3>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-slate-900 border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari jenis pengeluaran, catatan, atau metode bayar..."
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
              onClick={fetchExpensesData}
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
      ) : filteredExpenses.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 bg-slate-900 border-slate-800">
          Belum ada catatan pengeluaran pada rentang tanggal ini.
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Jenis Pengeluaran</th>
                  <th className="py-3 px-4">Nominal (Rp)</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Keterangan / Catatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-xs text-slate-300">
                      {exp.expense_date
                        ? new Date(exp.expense_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        {exp.category?.name || exp.category_name || 'Lain-lain'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">
                      {formatRupiah(Number(exp.amount) || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px]">
                        {exp.payment_method || 'Cash'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 max-w-xs truncate">
                      {exp.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(exp)}
                          className="h-8 px-2.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(exp.id)}
                          className="h-8 px-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Dialog Form Pengeluaran */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !open && setDialogOpen(false)}
        title={editingExpense ? 'Edit Transaksi Pengeluaran' : 'Catat Pengeluaran Operasional'}
        description="Masukkan rincian biaya beban operasional usaha Anda."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Tanggal Pengeluaran *</label>
            <Input
              type="date"
              required
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="bg-slate-950 border-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Jenis / Kategori Pengeluaran</label>
              <Link
                href="/dashboard/expenses/categories"
                target="_blank"
                className="text-[11px] text-indigo-400 hover:underline"
              >
                + Kategori Baru
              </Link>
            </div>
            <SearchableSelect
              options={[
                { value: '', label: '-- Pilih Jenis Pengeluaran --' },
                ...categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                })),
              ]}
              value={formCategoryId}
              onChange={(val) => setFormCategoryId(val)}
              placeholder="-- Cari / Pilih Jenis Pengeluaran --"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Jumlah / Nominal (Rp) *</label>
            <Input
              type="number"
              required
              min="1"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="0"
              className="bg-slate-950 border-slate-700 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Jenis Dana / Metode Bayar</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'Cash', label: 'Cash (Tunai)' },
                { type: 'Transfer', label: 'Transfer Bank' },
              ].map((m) => (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => setFormPaymentMethod(m.type as any)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${
                    formPaymentMethod === m.type
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Keterangan / Catatan</label>
            <Input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Contoh: Pembayaran token listrik bulan Agustus..."
              className="bg-slate-950 border-slate-700"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingExpense ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
