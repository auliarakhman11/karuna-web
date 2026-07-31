'use client';

import React, { useState, useEffect } from 'react';
import { getCategories, getItems, createItem, updateItem, deleteItem } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  AlertCircle,
  Package,
  Boxes,
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  slug?: string;
}

export interface BuildingItem {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  unit: string;
  price: number;
  stock: number;
  description: string;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Kayu & Triplek' },
  { id: 'cat-2', name: 'Semen, Pasir & Cor' },
  { id: 'cat-3', name: 'Besi, Baja & Wiremesh' },
  { id: 'cat-4', name: 'Atap, Seng & GRC' },
  { id: 'cat-5', name: 'Cat & Pelapis Tahan Air' },
  { id: 'cat-6', name: 'Pipa, Fitting & Sanitari' },
  { id: 'cat-7', name: 'Paku, Baut & Alat Pertukangan' },
];

const UNITS = ['Batang', 'Lembar', 'Sak', 'Kg', 'Meter', 'Pcs', 'Roll', 'Dus'];

export default function ItemsPage() {
  const [items, setItems] = useState<BuildingItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BuildingItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    unit: 'Batang',
    price: '',
    stock: '',
    description: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, catRes] = await Promise.allSettled([getItems(), getCategories()]);

      if (itemsRes.status === 'fulfilled') {
        setItems(itemsRes.value.data.items || []);
      }

      if (catRes.status === 'fulfilled') {
        const loadedCategories = Array.isArray(catRes.value.data)
          ? catRes.value.data
          : catRes.value.data?.categories || [];

        if (loadedCategories.length > 0) {
          setCategories(loadedCategories);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err: any) {
      console.error('Gagal memuat data:', err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category_id: '',
      unit: 'Batang',
      price: '',
      stock: '',
      description: '',
    });
    setErrorMsg('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: BuildingItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category_id: item.category_id || '',
      unit: item.unit || 'Batang',
      price: item.price ? item.price.toString() : '0',
      stock: item.stock ? item.stock.toString() : '0',
      description: item.description || '',
    });
    setErrorMsg('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Nama barang wajib diisi.');
      return;
    }

    try {
      setSubmitLoading(true);
      setErrorMsg('');

      const payload = {
        name: formData.name,
        category_id: formData.category_id || undefined,
        unit: formData.unit,
        price: Number(formData.price) || 0,
        stock: Number(formData.stock) || 0,
        description: formData.description,
      };

      if (editingItem) {
        await updateItem(editingItem.id, payload);
      } else {
        await createItem(payload);
      }

      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan barang.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(true);
      await deleteItem(id);
      setDeleteId(null);
      fetchData();
    } catch (err: any) {
      console.error('Gagal menghapus barang:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(search.toLowerCase()) ||
      item.unit.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-400" />
            Manajemen Stok &amp; Kayu Bangunan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola stok material kayu, semen, besi, dan kebutuhan bahan bangunan lainnya
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Tambah Barang
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama barang (misal: Meranti, Semen, Besi)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Data Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Memuat stok barang...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Belum Ada Stok Barang</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            {search
              ? 'Tidak ada barang yang sesuai dengan kata kunci pencarian.'
              : 'Klik tombol di bawah untuk memasukkan inventaris bahan bangunan Anda.'}
          </p>
          {!search && (
            <Button onClick={handleOpenAdd} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Barang Sekarang
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Nama Barang</th>
                  <th className="py-3.5 px-4 font-semibold">Kategori</th>
                  <th className="py-3.5 px-4 font-semibold">Satuan</th>
                  <th className="py-3.5 px-4 font-semibold">Harga Jual</th>
                  <th className="py-3.5 px-4 font-semibold">Stok</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-100">
                      <div>
                        <p>{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.category ? (
                        <Badge variant="default">{item.category.name}</Badge>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <Badge variant="outline">{item.unit}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-300">
                      {formatRupiah(item.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={item.stock > 10 ? 'success' : item.stock > 0 ? 'warning' : 'danger'}
                      >
                        {item.stock} {item.unit}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(item)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(item.id)}
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

      {/* Modal Dialog Form Add/Edit */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingItem ? 'Edit Barang Inventaris' : 'Tambah Barang Bangunan'}
        description="Masukkan rincian stok material toko bangunan Anda."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nama Barang <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              placeholder='Ex: "Kayu Meranti 4x6 x 4m", "Semen Tiga Roda 50kg"'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Kategori
              </label>
              <Select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Pilih Kategori Barang</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Satuan <span className="text-red-400">*</span>
              </label>
              <Select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Harga Jual (Rp)
              </label>
              <Input
                type="number"
                placeholder="50000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Stok
              </label>
              <Input
                type="number"
                placeholder="100"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Deskripsi Opsional
            </label>
            <textarea
              rows={3}
              placeholder="Catatan material, spesifikasi ukuran, grade kayu..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="flex w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              {editingItem ? 'Simpan Perubahan' : 'Tambah Barang'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Dialog Modal */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus Barang Inventaris"
        description="Apakah Anda yakin ingin menghapus barang ini? Data stok yang dihapus tidak dapat dikembalikan."
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
