'use client';

import React, { useState, useEffect } from 'react';
import {
  getStockOpnames,
  createStockOpname,
  deleteStockOpname,
  getReturns,
  createReturn,
  deleteReturn,
  getItems,
  getSuppliers,
  getCustomers,
  Supplier,
  Customer,
} from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import SearchableSelect from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  RotateCcw,
  Plus,
  Loader2,
  Trash2,
  Calendar,
  Truck,
  User,
} from 'lucide-react';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'opname' | 'returns'>('opname');

  const todayStr = new Date().toISOString().split('T')[0];

  // Opname state
  const [opnames, setOpnames] = useState<any[]>([]);
  const [loadingOpname, setLoadingOpname] = useState(true);
  const [opnameDialogOpen, setOpnameDialogOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [opnameForm, setOpnameForm] = useState({
    item_id: '',
    physical_stock: '',
    notes: '',
    opname_date: todayStr,
  });
  const [submittingOpname, setSubmittingOpname] = useState(false);

  // Return state
  const [returns, setReturns] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnForm, setReturnForm] = useState({
    return_type: 'TO_SUPPLIER' as 'TO_SUPPLIER' | 'FROM_CUSTOMER',
    reference_id: '',
    item_id: '',
    quantity: '',
    reason: '',
    return_date: todayStr,
    supplier_id: '',
    customer_id: '',
    customer_name: '',
  });
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOpnames = async () => {
    try {
      setLoadingOpname(true);
      const res = await getStockOpnames();
      setOpnames(res.data?.opnames || []);
    } catch (e) {
      console.error('Gagal memuat stock opname:', e);
    } finally {
      setLoadingOpname(false);
    }
  };

  const fetchReturns = async () => {
    try {
      setLoadingReturns(true);
      const res = await getReturns();
      setReturns(res.data?.returns || []);
    } catch (e) {
      console.error('Gagal memuat retur:', e);
    } finally {
      setLoadingReturns(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await getItems();
      setItems(res.data?.items || res.data || []);
    } catch (e) {
      console.error('Gagal memuat barang:', e);
    }
  };

  const fetchSuppliersData = async () => {
    try {
      const res = await getSuppliers();
      setSuppliers(res.data?.suppliers || []);
    } catch (e) {
      console.error('Gagal memuat supplier:', e);
    }
  };

  const fetchCustomersData = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data?.customers || res.data || []);
    } catch (e) {
      console.error('Gagal memuat pelanggan:', e);
    }
  };

  useEffect(() => {
    fetchOpnames();
    fetchReturns();
    fetchItems();
    fetchSuppliersData();
    fetchCustomersData();
  }, []);

  const selectedOpnameItem = items.find((i) => i.id === opnameForm.item_id);
  const systemStockVal = selectedOpnameItem ? selectedOpnameItem.stock : 0;
  const opnameDiff = opnameForm.physical_stock !== '' ? Number(opnameForm.physical_stock) - systemStockVal : 0;

  const handleSubmitOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opnameForm.item_id || opnameForm.physical_stock === '') {
      setErrorMsg('Pilih barang dan masukkan stok fisik.');
      return;
    }

    try {
      setSubmittingOpname(true);
      setErrorMsg('');

      await createStockOpname({
        item_id: opnameForm.item_id,
        physical_stock: Number(opnameForm.physical_stock),
        notes: opnameForm.notes,
        opname_date: opnameForm.opname_date,
      });

      setOpnameDialogOpen(false);
      fetchOpnames();
      fetchItems();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan stock opname.');
    } finally {
      setSubmittingOpname(false);
    }
  };

  const handleDeleteOpname = async (id: string) => {
    if (!confirm('Yakin ingin membatalkan/menghapus catatan stock opname ini? Stok akan dikembalikan ke kondisi sebelum opname.')) {
      return;
    }
    try {
      await deleteStockOpname(id);
      fetchOpnames();
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus catatan stock opname.');
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnForm.item_id || !returnForm.quantity) {
      setErrorMsg('Pilih barang dan masukkan jumlah retur.');
      return;
    }

    try {
      setSubmittingReturn(true);
      setErrorMsg('');

      // Temukan nama pelanggan yang dipilih jika ada
      const selectedCust = customers.find((c) => c.id === returnForm.customer_id);
      const custName = selectedCust?.name || returnForm.customer_name || '';

      await createReturn({
        return_type: returnForm.return_type,
        reference_id: returnForm.reference_id || null,
        item_id: returnForm.item_id,
        quantity: Number(returnForm.quantity),
        reason: returnForm.reason,
        return_date: returnForm.return_date,
        supplier_id: returnForm.return_type === 'TO_SUPPLIER' ? returnForm.supplier_id || null : null,
        customer_id: returnForm.return_type === 'FROM_CUSTOMER' ? returnForm.customer_id || null : null,
        customer_name: returnForm.return_type === 'FROM_CUSTOMER' ? custName || null : null,
      });

      setReturnDialogOpen(false);
      fetchReturns();
      fetchItems();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal memproses retur.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleDeleteReturn = async (id: string, type: string) => {
    const actionText = type === 'TO_SUPPLIER'
      ? 'Stok yang pernah dikembalikan ke supplier akan dimasukkan kembali ke inventaris.'
      : 'Stok yang pernah diterima dari pelanggan akan ditarik kembali dari inventaris.';

    if (!confirm(`Yakin ingin membatalkan/menghapus transaksi retur ini? ${actionText}`)) {
      return;
    }
    try {
      await deleteReturn(id);
      fetchReturns();
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membatalkan transaksi retur.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-400" />
            Stock Opname &amp; Retur Barang
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan penyesuaian fisik barang gudang dan proses retur barang rusak/ditukar
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              setOpnameForm({ item_id: '', physical_stock: '', notes: '', opname_date: todayStr });
              setErrorMsg('');
              setOpnameDialogOpen(true);
            }}
            variant="outline"
            className="gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Input Stock Opname
          </Button>
          <Button
            onClick={() => {
              setReturnForm({
                return_type: 'TO_SUPPLIER',
                reference_id: '',
                item_id: '',
                quantity: '',
                reason: '',
                return_date: todayStr,
                supplier_id: '',
                customer_id: '',
                customer_name: '',
              });
              setErrorMsg('');
              setReturnDialogOpen(true);
            }}
            className="gap-2 text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            Proses Retur Barang
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('opname')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'opname'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Riwayat Stock Opname ({opnames.length})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'returns'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Riwayat Retur Barang ({returns.length})
        </button>
      </div>

      {/* Tab: Opname */}
      {activeTab === 'opname' && (
        <div>
          {loadingOpname ? (
            <div className="flex justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : opnames.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">Belum ada catatan stock opname.</Card>
          ) : (
            <Card className="overflow-hidden border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Barang</th>
                      <th className="py-3 px-4">Stok Sistem</th>
                      <th className="py-3 px-4">Stok Fisik</th>
                      <th className="py-3 px-4">Selisih</th>
                      <th className="py-3 px-4">Catatan</th>
                      <th className="py-3 px-4">Tgl Opname</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {opnames.map((o) => {
                      const displayDate = o.opname_date || o.created_at;
                      return (
                        <tr key={o.id} className="hover:bg-slate-900/40">
                          <td className="py-3 px-4 font-medium text-white">{o.item?.name || '-'}</td>
                          <td className="py-3 px-4 text-slate-400">{o.system_stock} {o.item?.unit}</td>
                          <td className="py-3 px-4 font-semibold text-indigo-300">{o.physical_stock} {o.item?.unit}</td>
                          <td className="py-3 px-4">
                            <Badge variant={o.difference === 0 ? 'default' : o.difference > 0 ? 'success' : 'danger'}>
                              {o.difference > 0 ? `+${o.difference}` : o.difference}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{o.notes || '-'}</td>
                          <td className="py-3 px-4 text-xs text-slate-400">
                            {displayDate ? new Date(displayDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteOpname(o.id)}
                              className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              title="Batal / Hapus Catatan Opname"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Returns */}
      {activeTab === 'returns' && (
        <div>
          {loadingReturns ? (
            <div className="flex justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : returns.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">Belum ada riwayat retur barang.</Card>
          ) : (
            <Card className="overflow-hidden border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Tipe &amp; Pihak Terkait</th>
                      <th className="py-3 px-4">Barang</th>
                      <th className="py-3 px-4">Jumlah Retur</th>
                      <th className="py-3 px-4">Alasan</th>
                      <th className="py-3 px-4">Tgl Retur</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {returns.map((r) => {
                      const displayDate = r.return_date || r.created_at;
                      const isToSupplier = r.return_type === 'TO_SUPPLIER';
                      const partyName = isToSupplier
                        ? (r.supplier?.name || 'Supplier')
                        : (r.customer?.name || r.customer_name || 'Pelanggan Umum');

                      return (
                        <tr key={r.id} className="hover:bg-slate-900/40">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <Badge variant={isToSupplier ? 'warning' : 'outline'}>
                                {isToSupplier ? 'Retur ke Supplier' : 'Retur dari Pelanggan'}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              {isToSupplier ? <Truck className="w-3.5 h-3.5 text-amber-400" /> : <User className="w-3.5 h-3.5 text-indigo-400" />}
                              <span>
                                {partyName}
                                {!isToSupplier && r.customer?.phone && (
                                  <span className="text-[10px] text-slate-500 ml-1">({r.customer.phone})</span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-white">
                            {r.item?.name || r.karuna_items?.name || r.item_name || items.find((i) => i.id === r.item_id)?.name || 'Barang Tidak Ditemukan'}
                            {(r.item?.code || r.karuna_items?.code || items.find((i) => i.id === r.item_id)?.code) && (
                              <span className="text-[10px] text-slate-500 ml-1">
                                ({r.item?.code || r.karuna_items?.code || items.find((i) => i.id === r.item_id)?.code})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-rose-400">
                            {r.quantity} {r.item?.unit || r.karuna_items?.unit || items.find((i) => i.id === r.item_id)?.unit || 'pcs'}
                          </td>
                          <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{r.reason || '-'}</td>
                          <td className="py-3 px-4 text-xs text-slate-400">
                            {displayDate ? new Date(displayDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteReturn(r.id, r.return_type)}
                              className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              title="Batal / Hapus Transaksi Retur"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Dialog Opname */}
      <Dialog
        open={opnameDialogOpen}
        onOpenChange={setOpnameDialogOpen}
        title="Form Input Stock Opname Bulanan"
        description="Samakan jumlah fisik aktual gudang dengan catatan sistem."
      >
        <form onSubmit={handleSubmitOpname} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tanggal Opname *</label>
              <Input
                type="date"
                required
                value={opnameForm.opname_date}
                onChange={(e) => setOpnameForm({ ...opnameForm, opname_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Pilih Barang *</label>

            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Stok Fisik Aktual *</label>
              <Input
                type="number"
                min="0"
                required
                value={opnameForm.physical_stock}
                onChange={(e) => setOpnameForm({ ...opnameForm, physical_stock: e.target.value })}
                placeholder="Jumlah riil di gudang"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Selisih Stok</label>
              <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-indigo-400">
                {opnameDiff > 0 ? `+${opnameDiff}` : opnameDiff}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Catatan Opname</label>
            <Input
              value={opnameForm.notes}
              onChange={(e) => setOpnameForm({ ...opnameForm, notes: e.target.value })}
              placeholder="Contoh: Barang basah/rusak 2 pcs"
            />
          </div>

          {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpnameDialogOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submittingOpname}>
              {submittingOpname ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Opname'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog Return */}
      <Dialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        title="Form Retur Barang"
        description="Proses pengembalian barang cacat ke pabrik/supplier atau pengembalian dari pembeli."
      >
        <form onSubmit={handleSubmitReturn} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tipe Retur *</label>
              <select
                value={returnForm.return_type}
                onChange={(e) => setReturnForm({ ...returnForm, return_type: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              >
                <option value="TO_SUPPLIER">Retur ke Supplier (Barang Rusak Dikembalikan)</option>
                <option value="FROM_CUSTOMER">Retur dari Pelanggan (Barang Dikembalikan Pembeli)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tanggal Retur *</label>
              <Input
                type="date"
                required
                value={returnForm.return_date}
                onChange={(e) => setReturnForm({ ...returnForm, return_date: e.target.value })}
              />
            </div>
          </div>

          {/* Conditional Field: Supplier vs Customer Dropdown */}
          {returnForm.return_type === 'TO_SUPPLIER' ? (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Pilih Supplier / Pabrik</label>
              <select
                value={returnForm.supplier_id}
                onChange={(e) => setReturnForm({ ...returnForm, supplier_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              >
                <option value="">-- Tanpa Supplier / Umum --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Pilih Pelanggan / Pembeli</label>
              <select
                value={returnForm.customer_id}
                onChange={(e) => setReturnForm({ ...returnForm, customer_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              >
                <option value="">-- Pelanggan Umum / Non-Member --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Pilih Barang *</label>
            <select
              required
              value={returnForm.item_id}
              onChange={(e) => setReturnForm({ ...returnForm, item_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="">-- Pilih Barang --</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (Stok Saat Ini: {i.stock} {i.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Jumlah Retur *</label>
            <Input
              type="number"
              min="1"
              required
              value={returnForm.quantity}
              onChange={(e) => setReturnForm({ ...returnForm, quantity: e.target.value })}
              placeholder="Jumlah item"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Alasan Retur</label>
            <Input
              value={returnForm.reason}
              onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
              placeholder="Contoh: Kayu bengkok / retak / salah ukuran"
            />
          </div>

          {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setReturnDialogOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submittingReturn}>
              {submittingReturn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proses Retur'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
