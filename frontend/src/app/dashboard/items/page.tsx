'use client';

import React, { useState, useEffect } from 'react';
import { getCategories, getItems, createItem, updateItem, deleteItem } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchableSelect from '@/components/SearchableSelect';
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
  code?: string;
  name: string;
  unit: string;
  buy_price?: number;
  price: number;
  sell_price?: number;
  stock: number;
  min_stock?: number;
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

const UNITS = ['Batang', 'Lembar', 'Sak', 'Kg', 'Gram', 'Meter', 'Pcs', 'Roll', 'Dus', 'Kaleng', 'Box'];

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
    buy_price: '',
    sell_price: '',
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
      buy_price: '',
      sell_price: '',
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
      buy_price: (item.buy_price ?? 0) ? String(item.buy_price) : '',
      sell_price: (item.sell_price ?? item.price ?? 0) ? String(item.sell_price ?? item.price) : '',
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

      const sellPriceNum = Number(formData.sell_price) || 0;
      const buyPriceNum = Number(formData.buy_price) || 0;

      const payload = {
        name: formData.name.trim(),
        category_id: formData.category_id || undefined,
        unit: formData.unit,
        price: sellPriceNum,
        sell_price: sellPriceNum,
        buy_price: buyPriceNum,
        stock: Number(formData.stock) || 0,
        description: formData.description.trim(),
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
      (item.code && item.code.toLowerCase().includes(search.toLowerCase())) ||
      item.category?.name.toLowerCase().includes(search.toLowerCase()) ||
      item.unit.toLowerCase().includes(search.toLowerCase())
  );

  // Real-time calculation in dialog
  const currentBuyPrice = Number(formData.buy_price) || 0;
  const currentSellPrice = Number(formData.sell_price) || 0;
  const currentMargin = currentSellPrice - currentBuyPrice;
  const currentMarginPercentage =
    currentBuyPrice > 0 ? ((currentMargin / currentBuyPrice) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-400" />
            Manajemen Stok &amp; Master Barang
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola data master barang dagang, harga beli (modal), harga jual, dan estimasi margin keuntungan
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Tambah Barang
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4 bg-slate-900 border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari kode atau nama barang (misal: Kayu Meranti, Semen, Besi)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950/60 border-slate-700"
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
        <Card className="flex flex-col items-center justify-center py-16 text-center bg-slate-900 border-slate-800">
          <Package className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Belum Ada Stok Barang</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            {search
              ? 'Tidak ada barang yang sesuai dengan kata kunci pencarian.'
              : 'Klik tombol di bawah untuk memasukkan inventaris bahan bangunan Anda.'}
          </p>
          {!search && (
            <Button onClick={handleOpenAdd} variant="outline" className="gap-2 border-slate-700">
              <Plus className="w-4 h-4" />
              Tambah Barang Sekarang
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Kode &amp; Nama Barang</th>
                  <th className="py-3 px-4 font-semibold">Kategori</th>
                  <th className="py-3 px-4 font-semibold text-center">Stok Fisik</th>
                  <th className="py-3 px-4 font-semibold text-right">Harga Beli / Modal</th>
                  <th className="py-3 px-4 font-semibold text-right">Harga Jual</th>
                  <th className="py-3 px-4 font-semibold text-right">Laba / Unit</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredItems.map((item) => {
                  const buyPrice = Number(item.buy_price) || 0;
                  const sellPrice = Number(item.sell_price ?? item.price) || 0;
                  const profitUnit = sellPrice - buyPrice;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      {/* 1. Kode & Nama Barang */}
                      <td className="py-3 px-4 font-medium text-slate-100">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-100">{item.name}</span>
                            {item.code && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {item.code}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </td>

                      {/* 2. Kategori */}
                      <td className="py-3 px-4">
                        {item.category ? (
                          <Badge variant="default" className="text-[11px]">
                            {item.category.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>

                      {/* 3. Stok Fisik */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant={item.stock > (item.min_stock || 10) ? 'success' : item.stock > 0 ? 'warning' : 'danger'}
                            className="font-mono text-xs"
                          >
                            {item.stock} {item.unit}
                          </Badge>
                          {item.stock <= (item.min_stock || 10) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <AlertCircle className="w-2.5 h-2.5" />
                              Menipis
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Harga Beli / Modal */}
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatRupiah(buyPrice)}
                      </td>

                      {/* 5. Harga Jual */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-indigo-300">
                        {formatRupiah(sellPrice)}
                      </td>

                      {/* 6. Laba / Unit */}
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            profitUnit > 0
                              ? 'text-emerald-400'
                              : profitUnit < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                          }
                        >
                          {profitUnit > 0 ? `+${formatRupiah(profitUnit)}` : formatRupiah(profitUnit)}
                        </span>
                      </td>

                      {/* 7. Aksi */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 px-2.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(item.id)}
                            className="h-8 px-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </Button>
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

      {/* Modal Dialog Form Add/Edit */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingItem ? 'Edit Barang Inventaris' : 'Tambah Barang Bangunan'}
        description="Masukkan rincian master barang, harga modal, dan harga jual produk Anda."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Nama Barang <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              placeholder='Ex: "Kayu Meranti 4x6 x 4m", "Semen Tiga Roda 50kg"'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-slate-950 border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Kategori
              </label>
              <SearchableSelect
  options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
  value={formData.category_id}
  onChange={(value) => setFormData({ ...formData, category_id: value })}
  placeholder="Pilih Kategori Barang"
  className="bg-slate-950 border-slate-700"
/>

            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Satuan <span className="text-red-400">*</span>
              </label>
              <SearchableSelect
  options={UNITS.map(u => ({ value: u, label: u }))}
  value={formData.unit}
  onChange={(value) => setFormData({ ...formData, unit: value })}
  placeholder="Pilih Satuan"
  className="bg-slate-950 border-slate-700"
/>

            </div>
          </div>

          {/* Pricing: Harga Beli & Harga Jual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Harga Beli / Modal (Rp)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.buy_price}
                onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                className="bg-slate-950 border-slate-700 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Harga Jual (Rp) <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.sell_price}
                onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                className="bg-slate-950 border-slate-700 font-mono"
                required
              />
            </div>
          </div>

          {/* Real-time Profit Margin Box */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">Estimasi Margin Laba / Unit:</span>
              <span
                className={`font-mono font-bold text-sm ${currentMargin > 0
                    ? 'text-emerald-400'
                    : currentMargin < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
              >
                {currentMargin > 0 ? `+${formatRupiah(currentMargin)}` : formatRupiah(currentMargin)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Persentase Margin:</span>
              <span
                className={`font-mono font-bold text-sm ${Number(currentMarginPercentage) > 0
                    ? 'text-emerald-400'
                    : Number(currentMarginPercentage) < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
              >
                {currentMarginPercentage}%
              </span>
            </div>
          </div>

          {/* Stock & Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Stok Awal Fisik
            </label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="bg-slate-950 border-slate-700 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Deskripsi Opsional
            </label>
            <textarea
              rows={2}
              placeholder="Catatan material, spesifikasi ukuran, grade kayu..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="flex w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <Button type="submit" disabled={submitLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
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
