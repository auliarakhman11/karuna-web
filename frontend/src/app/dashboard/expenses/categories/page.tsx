'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  ExpenseCategory,
} from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  ArrowLeft,
  DollarSign,
} from 'lucide-react';

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await getExpenseCategories();
      setCategories(res.data?.categories || res.data || []);
    } catch (e) {
      console.error('Gagal memuat kategori pengeluaran:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDesc('');
    setErrorMsg('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDesc(cat.description || '');
    setErrorMsg('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Nama kategori wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      if (editingCategory) {
        await updateExpenseCategory(editingCategory.id, {
          name: formName.trim(),
          description: formDesc.trim(),
        });
      } else {
        await createExpenseCategory({
          name: formName.trim(),
          description: formDesc.trim(),
        });
      }

      setDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan kategori.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori pengeluaran ini?')) return;
    try {
      await deleteExpenseCategory(id);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus kategori.');
    }
  };

  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/expenses"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Transaksi Pengeluaran
            </Link>
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            Jenis / Kategori Pengeluaran
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola pos akun atau kelompok pengeluaran operasional usaha Anda (seperti Gaji, Sewa, Listrik, dsb)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </Button>
        </div>
      </div>

      {/* Filter / Search */}
      <Card className="p-4 bg-slate-900 border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari kategori pengeluaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950/60 border-slate-700"
          />
        </div>
      </Card>

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 bg-slate-900 border-slate-800">
          Belum ada kategori pengeluaran. Klik tombol "Tambah Kategori" untuk membuatnya.
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Kategori</th>
                  <th className="py-3 px-4">Deskripsi / Keterangan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      {cat.name}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 max-w-md truncate">
                      {cat.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(cat)}
                          className="h-8 px-2.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(cat.id)}
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

      {/* Modal Dialog Form Kategori */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !open && setDialogOpen(false)}
        title={editingCategory ? 'Edit Kategori Pengeluaran' : 'Tambah Kategori Pengeluaran Baru'}
        description="Buat atau perbarui nama jenis kategori pengeluaran operasional usaha."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Nama Kategori *</label>
            <Input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Listrik & Air, Gaji Karyawan, Transportasi..."
              className="bg-slate-950 border-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Deskripsi (opsional)</label>
            <Input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Keterangan singkat kategori..."
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
              {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
