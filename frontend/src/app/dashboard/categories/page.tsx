'use client';

import React, { useState, useEffect } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  slug?: string;
  created_at?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategoriesList = async () => {
    try {
      setLoading(true);
      const res = await getCategories();
      const loaded = Array.isArray(res.data) ? res.data : res.data.categories || [];
      setCategories(loaded);
    } catch (err: any) {
      console.error('Gagal mengambil data kategori:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesList();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setNameInput('');
    setErrorMsg('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setNameInput(cat.name);
    setErrorMsg('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setErrorMsg('Nama kategori wajib diisi.');
      return;
    }

    try {
      setSubmitLoading(true);
      setErrorMsg('');

      if (editingCategory) {
        await updateCategory(editingCategory.id, nameInput.trim());
      } else {
        await createCategory(nameInput.trim());
      }

      setDialogOpen(false);
      fetchCategoriesList();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan kategori.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(true);
      await deleteCategory(id);
      setDeleteId(null);
      fetchCategoriesList();
    } catch (err: any) {
      console.error('Gagal menghapus kategori:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            Manajemen Kategori Barang
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola pengelompokan produk dan material bahan bangunan
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Tambah Kategori
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari kategori (misal: Kayu, Semen, Besi)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Categories Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Memuat data kategori...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Belum Ada Kategori</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            {search
              ? 'Tidak ada kategori yang sesuai dengan kata kunci pencarian.'
              : 'Klik tombol di bawah untuk membuat kategori barang pertama Anda.'}
          </p>
          {!search && (
            <Button onClick={handleOpenAdd} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Kategori
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Nama Kategori</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-100 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-400 shrink-0" />
                      {cat.name}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(cat)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(cat.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Form Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingCategory ? 'Edit Kategori Barang' : 'Tambah Kategori Baru'}
        description="Masukkan nama kategori baru untuk bahan dan material toko."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nama Kategori <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              placeholder='Ex: "Kayu & Triplek", "Semen & Pasir"'
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitLoading} className="gap-2">
              {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Dialog Modal */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus Kategori"
        description="Apakah Anda yakin ingin menghapus kategori ini? Kategori yang digunakan pada barang dapat menjadi terlepas."
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Batal
          </Button>
          <Button
            disabled={deleteLoading}
            onClick={() => deleteId && handleDelete(deleteId)}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Hapus
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
