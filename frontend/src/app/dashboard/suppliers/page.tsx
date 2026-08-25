'use client';

import React, { useState, useEffect } from 'react';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchases,
  createPurchase,
  cancelPurchase,
  paySupplierDebt,
  getPurchaseById,
  deleteSupplierDebtPayment,
  getItems,
  Supplier,
  PurchaseLineItem,
} from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import SearchableSelect from '@/components/SearchableSelect';
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  PackagePlus,
  Search,
  Calendar,
  X,
  CreditCard,
  Ban,
  Eye,
} from 'lucide-react';

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchases'>('suppliers');

  // Supplier Data & State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);

  // Date Filter Helpers (1st of month to end of month)
  const getInitialDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toDateStr = (d: Date) => d.toISOString().split('T')[0];
    return {
      start: toDateStr(firstDay),
      end: toDateStr(lastDay),
      today: toDateStr(now),
    };
  };

  const initialDates = getInitialDates();
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);

  // Purchase Data & State
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    payment_type: 'CASH' as 'CASH' | 'TRANSFER' | 'CREDIT',
    paid_amount: '',
    due_date: '',
    purchase_date: initialDates.today,
    notes: '',
  });
  const [purchaseCart, setPurchaseCart] = useState<PurchaseLineItem[]>([]);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pay Debt Dialog State
  const [payDebtDialogOpen, setPayDebtDialogOpen] = useState(false);
  const [selectedPurchaseForDebt, setSelectedPurchaseForDebt] = useState<any | null>(null);
  const [debtPaymentForm, setDebtPaymentForm] = useState({
    amount: '',
    payment_method: 'CASH' as 'CASH' | 'TRANSFER',
    payment_date: initialDates.today,
    notes: '',
  });
  const [debtSubmitting, setDebtSubmitting] = useState(false);
  const [debtErrorMsg, setDebtErrorMsg] = useState('');

  // Purchase Detail Dialog State
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPurchaseForDetail, setSelectedPurchaseForDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleOpenDetail = async (p: any) => {
    setDetailDialogOpen(true);
    setDetailLoading(true);
    // Set awal dengan data yang sudah ada dari list p
    setSelectedPurchaseForDetail({
      ...p,
      items: p.purchase_items || p.items || [],
      purchase_items: p.purchase_items || p.items || [],
      payments: p.debt_payments || p.payments || [],
      debt_payments: p.debt_payments || p.payments || [],
    });
    try {
      const res = await getPurchaseById(p.id);
      console.log('Detail PO Response:', res.data);
      const detail = res.data?.data || res.data?.purchase || res.data;
      const rawItemList = detail?.items || detail?.purchase_items || detail?.karuna_purchase_items || p.purchase_items || p.items || [];
      const rawPaymentList = detail?.payments || detail?.debt_payments || detail?.karuna_supplier_debt_payments || p.debt_payments || p.payments || [];
      
      setSelectedPurchaseForDetail({
        ...p,
        ...detail,
        items: rawItemList,
        purchase_items: rawItemList,
        karuna_purchase_items: rawItemList,
        payments: rawPaymentList,
        debt_payments: rawPaymentList,
        karuna_supplier_debt_payments: rawPaymentList,
      });
    } catch (err) {
      console.error('Gagal memuat detail PO:', err);
      // Fallback: gunakan data dari list
      setSelectedPurchaseForDetail({
        ...p,
        items: p.purchase_items || p.items || [],
        purchase_items: p.purchase_items || p.items || [],
        payments: p.debt_payments || p.payments || [],
        debt_payments: p.debt_payments || p.payments || [],
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteDebtPayment = async (paymentId: string) => {
    if (!confirm('Yakin ingin menghapus riwayat cicilan ini? Nominal sisa hutang akan bertambah kembali.')) {
      return;
    }
    try {
      if (selectedPurchaseForDetail) {
        setDetailLoading(true);
        const delRes = await deleteSupplierDebtPayment(paymentId);
        // Refresh detail modal from API
        const res = await getPurchaseById(selectedPurchaseForDetail.id);
        const detail = res.data?.data || res.data?.purchase || res.data;
        const rawItemList = detail?.items || detail?.purchase_items || detail?.karuna_purchase_items || [];
        const rawPaymentList = detail?.payments || detail?.debt_payments || detail?.karuna_supplier_debt_payments || [];

        setSelectedPurchaseForDetail({
          ...selectedPurchaseForDetail,
          ...detail,
          items: rawItemList,
          purchase_items: rawItemList,
          karuna_purchase_items: rawItemList,
          payments: rawPaymentList,
          debt_payments: rawPaymentList,
          karuna_supplier_debt_payments: rawPaymentList,
        });
        // Refresh purchase list table
        fetchPurchases();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus riwayat cicilan.');
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const res = await getSuppliers();
      setSuppliers(res.data?.suppliers || []);
    } catch (e) {
      console.error('Gagal memuat supplier:', e);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const res = await getPurchases({ startDate, endDate });
      console.log('API Response Purchases:', res.data);
      const dataList = res.data?.purchases || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setPurchases(dataList);
    } catch (e) {
      console.error('Gagal memuat pembelian:', e);
    } finally {
      setLoadingPurchases(false);
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

  useEffect(() => {
    fetchSuppliers();
    fetchItems();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [startDate, endDate]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  // Supplier Form Handlers
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({ name: '', phone: '', email: '', address: '', notes: '' });
    setSupplierDialogOpen(true);
  };

  const handleOpenEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      notes: s.notes || '',
    });
    setSupplierDialogOpen(true);
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSupplierSubmitting(true);
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierForm);
      } else {
        await createSupplier(supplierForm);
      }
      setSupplierDialogOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan supplier');
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Yakin ingin menghapus supplier ini?')) return;
    try {
      await deleteSupplier(id);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus supplier');
    }
  };

  // Purchase Handlers
  const handleOpenAddPurchase = () => {
    setPurchaseForm({
      supplier_id: '',
      payment_type: 'CASH',
      paid_amount: '',
      due_date: '',
      purchase_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setPurchaseCart([]);
    setErrorMsg('');
    setPurchaseDialogOpen(true);
  };

  const addLineToCart = (itemId: string) => {
    if (!itemId) return;
    const existing = purchaseCart.find((c) => c.item_id === itemId);
    if (existing) return;
    const item = items.find((i) => i.id === itemId);
    // Gunakan buy_price (Harga Beli / Modal)
    const initialBuyPrice = Number((item as any)?.buy_price || item?.cost_price || 0);
    setPurchaseCart((prev) => [
      ...prev,
      { item_id: itemId, quantity: 1, unit_price: initialBuyPrice },
    ]);
  };

  const updateCartLine = (itemId: string, field: 'quantity' | 'unit_price', val: number) => {
    setPurchaseCart((prev) =>
      prev.map((c) => (c.item_id === itemId ? { ...c, [field]: Math.max(0, val) } : c))
    );
  };

  const removeCartLine = (itemId: string) => {
    setPurchaseCart((prev) => prev.filter((c) => c.item_id !== itemId));
  };

  const purchaseTotal = purchaseCart.reduce((s, c) => s + c.quantity * c.unit_price, 0);

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseCart.length === 0) {
      setErrorMsg('Pilih minimal 1 barang yang dibeli.');
      return;
    }

    try {
      setPurchaseSubmitting(true);
      setErrorMsg('');

      const paidNum =
        purchaseForm.payment_type === 'CREDIT'
          ? Number(purchaseForm.paid_amount) || 0
          : purchaseTotal;

      await createPurchase({
        supplier_id: purchaseForm.supplier_id || null,
        items: purchaseCart,
        payment_type: purchaseForm.payment_type,
        paid_amount: paidNum,
        due_date: purchaseForm.payment_type === 'CREDIT' ? purchaseForm.due_date : null,
        purchase_date: purchaseForm.purchase_date,
        notes: purchaseForm.notes,
      });

      setPurchaseDialogOpen(false);
      fetchPurchases();
      fetchItems();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan transaksi pembelian.');
    } finally {
      setPurchaseSubmitting(false);
    }
  };

  const handleCancelPurchase = async (p: any) => {
    if (!confirm(`Yakin ingin membatalkan transaksi PO ${p.po_number || p.invoice_number}? Stok yang masuk akan dikembalikan.`)) {
      return;
    }
    try {
      await cancelPurchase(p.id);
      fetchPurchases();
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membatalkan transaksi pembelian.');
    }
  };

  // Pay Debt Dialog Handlers
  const handleOpenPayDebt = (p: any) => {
    setSelectedPurchaseForDebt(p);
    setDebtPaymentForm({
      amount: String(p.due_amount || 0),
      payment_method: 'CASH',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setDebtErrorMsg('');
    setPayDebtDialogOpen(true);
  };

  const handleSubmitDebtPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchaseForDebt) return;

    const amountNum = Number(debtPaymentForm.amount);
    if (!amountNum || amountNum <= 0) {
      setDebtErrorMsg('Masukkan nominal pembayaran yang valid.');
      return;
    }

    try {
      setDebtSubmitting(true);
      setDebtErrorMsg('');

      await paySupplierDebt(selectedPurchaseForDebt.id, {
        amount: amountNum,
        payment_method: debtPaymentForm.payment_method,
        payment_date: debtPaymentForm.payment_date,
        notes: debtPaymentForm.notes,
      });

      setPayDebtDialogOpen(false);
      fetchPurchases();
    } catch (err: any) {
      setDebtErrorMsg(err.response?.data?.message || 'Gagal mencatat pembayaran hutang.');
    } finally {
      setDebtSubmitting(false);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.company_name && s.company_name.toLowerCase().includes(supplierSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            Supplier &amp; Pembelian (Restock)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola data vendor/pabrik kayu &amp; pencatatan transaksi barang masuk
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleOpenAddSupplier} variant="outline" className="gap-2 text-xs">
            <Plus className="w-4 h-4" />
            Tambah Supplier
          </Button>
          <Button onClick={handleOpenAddPurchase} className="gap-2 text-xs">
            <PackagePlus className="w-4 h-4" />
            Restock Barang
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'suppliers'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Daftar Supplier ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'purchases'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Riwayat Pembelian PO ({purchases.length})
        </button>
      </div>

      {/* Tab Content: Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari nama supplier..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </Card>

          {loadingSuppliers ? (
            <div className="flex justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">Belum ada data supplier.</Card>
          ) : (
            <Card className="overflow-hidden border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Nama Supplier</th>
                      <th className="py-3 px-4">Telepon</th>
                      <th className="py-3 px-4">Alamat</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredSuppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-medium text-white">{s.name}</td>
                        <td className="py-3 px-4 text-slate-300">{s.phone || '-'}</td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{s.address || '-'}</td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditSupplier(s)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSupplier(s.id)}
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
        </div>
      )}

      {/* Tab Content: Purchases */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {/* Date Filter Bar */}
          <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Filter Tanggal PO:
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-36 text-xs h-8"
                />
                <span className="text-slate-500">s/d</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-36 text-xs h-8"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs gap-1.5 text-slate-400 hover:text-white"
              >
                Reset Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPurchases}
                className="text-xs gap-1.5"
              >
                Segarkan Data
              </Button>
            </div>
          </Card>

          {loadingPurchases ? (
            <div className="flex justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : purchases.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">Belum ada riwayat pembelian barang pada rentang tanggal ini.</Card>
          ) : (
            <Card className="overflow-hidden border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">No. PO</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Sisa Hutang</th>
                      <th className="py-3 px-4">Metode &amp; Status</th>
                      <th className="py-3 px-4">Tgl Pembelian</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {purchases.map((p) => {
                      const isCancelled = p.status === 'CANCELLED';
                      const hasDebt = p.payment_status !== 'LUNAS' && !isCancelled && Number(p.due_amount) > 0;
                      const displayDate = p.purchase_date || p.created_at;

                      return (
                        <tr key={p.id} className={`hover:bg-slate-900/40 ${isCancelled ? 'opacity-50' : ''}`}>
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-indigo-400">{p.po_number || p.invoice_number}</div>
                            {isCancelled && (
                              <Badge variant="danger" className="text-[10px] mt-0.5">DIBATALKAN</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">{p.supplier?.name || 'Umum'}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-400">
                            {formatRupiah(p.total_amount)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-amber-400">
                            {Number(p.due_amount) > 0 ? formatRupiah(p.due_amount) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline">{p.payment_type}</Badge>
                              <Badge variant={p.payment_status === 'LUNAS' ? 'success' : 'danger'}>
                                {p.payment_status}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400">
                            {displayDate ? new Date(displayDate).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDetail(p)}
                              className="text-xs h-7 gap-1 text-slate-300 hover:text-white"
                              title="Lihat Detail PO"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Detail
                            </Button>
                            {hasDebt && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenPayDebt(p)}
                                className="text-xs h-7 gap-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Bayar Hutang
                              </Button>
                            )}
                            {!isCancelled && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelPurchase(p)}
                                className="text-xs h-7 gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="Batalkan Transaksi PO"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Batal
                              </Button>
                            )}
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

      {/* Dialog Add/Edit Supplier */}
      <Dialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        title={editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
      >
        <form onSubmit={handleSubmitSupplier} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300">Nama Supplier *</label>
            <Input
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              placeholder="Contoh: PT Kayu Utama / CV Maju Bersama"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Telepon / WA</label>
              <Input
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                placeholder="08123456789"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Email</label>
              <Input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                placeholder="vendor@mail.com"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300">Alamat</label>
            <Input
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              placeholder="Alamat pabrik / gudang supplier"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setSupplierDialogOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={supplierSubmitting}>
              {supplierSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Supplier'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog Restock / Purchase Form */}
      <Dialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        title="Input Transaksi Pembelian Barang (Restock)"
        description="Stok barang di inventaris akan bertambah secara otomatis setelah transaksi ini disimpan."
      >
        <form onSubmit={handleSubmitPurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Pilih Supplier</label>
              <SearchableSelect
  options={suppliers.map(s => ({ value: s.id, label: s.name }))}
  value={purchaseForm.supplier_id}
  onChange={(value) => setPurchaseForm({ ...purchaseForm, supplier_id: value })}
  placeholder="Pilih Supplier"
  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tanggal Pembelian</label>
              <Input
                type="date"
                required
                value={purchaseForm.purchase_date}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })}
              />
            </div>
          </div>

          {/* Add item picker */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Tambah Barang Restock</label>
            <select
              onChange={(e) => {
                addLineToCart(e.target.value);
                e.target.value = '';
              }}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="">-- Pilih Barang untuk Ditambahkan --</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (Stok Sekarang: {i.stock} {i.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Cart Table */}
          <div className="border border-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
            {purchaseCart.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Belum ada barang dipilih.</p>
            ) : (
              purchaseCart.map((c) => {
                const item = items.find((i) => i.id === c.item_id);
                return (
                  <div key={c.item_id} className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg text-xs">
                    <span className="flex-1 font-medium text-white truncate">{item?.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={c.quantity}
                        onChange={(e) => updateCartLine(c.item_id, 'quantity', Number(e.target.value))}
                        className="w-14 px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-center text-white"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Harga Beli:</span>
                      <input
                        type="number"
                        min="0"
                        value={c.unit_price}
                        onChange={(e) => updateCartLine(c.item_id, 'unit_price', Number(e.target.value))}
                        className="w-24 px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-right text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCartLine(c.item_id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Metode Pembayaran</label>
              <select
                value={purchaseForm.payment_type}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, payment_type: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              >
                <option value="CASH">Tunai / Cash</option>
                <option value="TRANSFER">Transfer Bank</option>
                <option value="CREDIT">Kredit (Hutang)</option>
              </select>
            </div>
            {purchaseForm.payment_type === 'CREDIT' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">DP / Dibayar (Rp)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={purchaseForm.paid_amount}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, paid_amount: e.target.value })}
                />
              </div>
            )}
          </div>

          {purchaseForm.payment_type === 'CREDIT' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Jatuh Tempo Hutang</label>
              <Input
                type="date"
                value={purchaseForm.due_date}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, due_date: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Catatan</label>
            <Input
              value={purchaseForm.notes}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
              placeholder="Catatan pengiriman / nomor faktur manual..."
            />
          </div>

          {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block">Total Pembelian:</span>
              <span className="text-lg font-bold text-emerald-400">{formatRupiah(purchaseTotal)}</span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={purchaseSubmitting}>
                {purchaseSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan PO &amp; Restock'}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Dialog Pay Debt */}
      <Dialog
        open={payDebtDialogOpen}
        onOpenChange={setPayDebtDialogOpen}
        title="Pembayaran Hutang Supplier"
        description={`Pembayaran sisa hutang untuk PO: ${selectedPurchaseForDebt?.po_number || selectedPurchaseForDebt?.invoice_number || ''}`}
      >
        <form onSubmit={handleSubmitDebtPayment} className="space-y-4">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Supplier:</span>
              <span className="text-white font-medium">{selectedPurchaseForDebt?.supplier?.name || 'Umum'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Pembelian:</span>
              <span className="text-white font-semibold">{formatRupiah(selectedPurchaseForDebt?.total_amount || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Sudah Dibayar:</span>
              <span className="text-emerald-400 font-semibold">{formatRupiah(selectedPurchaseForDebt?.paid_amount || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
              <span>Sisa Hutang:</span>
              <span className="text-amber-400 font-bold text-sm">{formatRupiah(selectedPurchaseForDebt?.due_amount || 0)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nominal Pembayaran (Rp) *</label>
              <Input
                type="number"
                required
                min="1"
                max={selectedPurchaseForDebt?.due_amount || undefined}
                value={debtPaymentForm.amount}
                onChange={(e) => setDebtPaymentForm({ ...debtPaymentForm, amount: e.target.value })}
                placeholder="Masukkan nominal..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tanggal Pembayaran</label>
              <Input
                type="date"
                required
                value={debtPaymentForm.payment_date}
                onChange={(e) => setDebtPaymentForm({ ...debtPaymentForm, payment_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Metode Pembayaran</label>
            <select
              value={debtPaymentForm.payment_method}
              onChange={(e) => setDebtPaymentForm({ ...debtPaymentForm, payment_method: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="CASH">Tunai / Cash</option>
              <option value="TRANSFER">Transfer Bank</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Catatan Tambahan</label>
            <Input
              value={debtPaymentForm.notes}
              onChange={(e) => setDebtPaymentForm({ ...debtPaymentForm, notes: e.target.value })}
              placeholder="Bukti transfer / nomor struk..."
            />
          </div>

          {debtErrorMsg && <p className="text-xs text-rose-400">{debtErrorMsg}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setPayDebtDialogOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={debtSubmitting}>
              {debtSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Catat Pembayaran'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog Detail Pembelian PO */}
      <Dialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        title="Detail Transaksi Pembelian (PO Restok)"
        description={`Nomor PO: ${selectedPurchaseForDetail?.po_number || selectedPurchaseForDetail?.invoice_number || '-'}`}
      >
        {detailLoading && (
          <div className="flex justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        )}
        {!detailLoading && selectedPurchaseForDetail && (
          <div className="space-y-4">
            {/* Header Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block">Supplier:</span>
                <span className="text-white font-medium truncate block">
                  {selectedPurchaseForDetail.supplier?.name || 'Umum'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Tanggal:</span>
                <span className="text-slate-200 font-medium block">
                  {new Date(selectedPurchaseForDetail.purchase_date || selectedPurchaseForDetail.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Metode:</span>
                <Badge variant="outline" className="mt-0.5">{selectedPurchaseForDetail.payment_type}</Badge>
              </div>
              <div>
                <span className="text-slate-400 block">Status:</span>
                <Badge
                  variant={
                    selectedPurchaseForDetail.status === 'CANCELLED'
                      ? 'danger'
                      : selectedPurchaseForDetail.payment_status === 'LUNAS'
                      ? 'success'
                      : 'danger'
                  }
                  className="mt-0.5"
                >
                  {selectedPurchaseForDetail.status === 'CANCELLED' ? 'DIBATALKAN' : selectedPurchaseForDetail.payment_status}
                </Badge>
              </div>
            </div>

            {/* Table Detail Items */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Daftar Barang Dibeli:</h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Barang</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Harga Beli Unit</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {(() => {
                        const itemList = selectedPurchaseForDetail.items || selectedPurchaseForDetail.purchase_items || selectedPurchaseForDetail.karuna_purchase_items || [];
                        if (itemList.length > 0) {
                          return itemList.map((row: any, idx: number) => {
                            const itemName = row.item?.name || row.name || row.item_name || 'Barang';
                            const itemCode = row.item?.code || row.code || '';
                            const itemUnit = row.item?.unit || row.unit || '';
                            const qty = Number(row.quantity || row.qty || 1);
                            const unitPrice = Number(row.unit_price || row.price || 0);
                            const subtotal = Number(row.subtotal || (qty * unitPrice));

                            return (
                              <tr key={row.id || idx} className="hover:bg-slate-900/40">
                                <td className="py-2.5 px-3 font-medium text-white">
                                  <div>{itemName}</div>
                                  {itemCode && (
                                    <span className="text-[10px] text-slate-500 font-mono">{itemCode}</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {qty} {itemUnit}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {formatRupiah(unitPrice)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-semibold text-slate-100">
                                  {formatRupiah(subtotal)}
                                </td>
                              </tr>
                            );
                          });
                        }
                        return (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400 text-xs italic">
                              Transaksi lama ini tidak memiliki rincian item tersimpan. Silakan uji coba pada transaksi Restock baru.
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Riwayat Pembayaran / Cicilan Supplier */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Riwayat Pembayaran:</h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                {(() => {
                  const payments = selectedPurchaseForDetail.payments || selectedPurchaseForDetail.debt_payments || selectedPurchaseForDetail.karuna_supplier_debt_payments || [];

                  if (payments.length > 0) {
                    return (
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 text-slate-400 uppercase border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Tanggal Bayar</th>
                              <th className="py-2.5 px-3">Metode Pembayaran</th>
                              <th className="py-2.5 px-3">Catatan / Keterangan</th>
                              <th className="py-2.5 px-3 text-right">Jumlah Dibayar</th>
                              <th className="py-2.5 px-3 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {payments.map((dp: any, pIdx: number) => {
                              const payAmount = Number(dp.amount_paid ?? dp.amount ?? dp.paid_amount ?? dp.payment_amount ?? 0);
                              const payDate = dp.payment_date || dp.created_at || selectedPurchaseForDetail.purchase_date || selectedPurchaseForDetail.created_at;
                              const payMethod = dp.payment_method || selectedPurchaseForDetail.payment_type || 'CASH';

                              return (
                                <tr key={dp.id || pIdx} className="hover:bg-slate-900/60">
                                  <td className="py-2.5 px-3 text-slate-300 font-medium">
                                    {payDate ? new Date(payDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <Badge variant="outline" className="text-[10px] uppercase font-semibold text-indigo-300 border-indigo-500/30">
                                      {payMethod}
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{dp.notes || '-'}</td>
                                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400 text-sm">
                                    {formatRupiah(payAmount)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {dp.id ? (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteDebtPayment(dp.id)}
                                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        title="Hapus Riwayat Cicilan"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 italic">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  const isLunas = selectedPurchaseForDetail.payment_status === 'LUNAS';
                  if (isLunas) {
                    return (
                      <div className="p-3 text-center text-emerald-400 bg-emerald-500/10 text-xs font-medium">
                        Pembayaran Lunas Saat Transaksi (Tunai/Transfer)
                      </div>
                    );
                  }

                  return (
                    <div className="p-4 text-center text-slate-400 text-xs italic">
                      Belum ada riwayat cicilan untuk transaksi ini.
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Ringkasan Keuangan */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Pembelian:</span>
                <span className="text-white font-bold text-sm">
                  {formatRupiah(selectedPurchaseForDetail.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Jumlah Dibayar:</span>
                <span className="text-emerald-400 font-semibold">
                  {formatRupiah(selectedPurchaseForDetail.paid_amount || 0)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>Sisa Hutang:</span>
                <span className="text-amber-400 font-bold">
                  {formatRupiah(selectedPurchaseForDetail.due_amount || 0)}
                </span>
              </div>
              {selectedPurchaseForDetail.notes && (
                <div className="border-t border-slate-800 pt-1.5 text-slate-400">
                  <span className="font-medium text-slate-300">Catatan PO: </span>
                  {selectedPurchaseForDetail.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
