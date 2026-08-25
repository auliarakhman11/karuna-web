'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  getItems,
  getCustomers,
  createCustomer,
  createSale,
  Customer,
  SaleLineItem,
} from '@/lib/api';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Loader2,
  CheckCircle,
  Package,
  Receipt,
  Tag,
  X,
  Printer,
  MessageSquare,
  UserPlus,
  User,
  Calendar,
} from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';


// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Item {
  id: string;
  name: string;
  price: number;
  cost_price?: number;
  stock: number;
  unit: string;
  category?: { id: string; name: string } | null;
}

interface CartLine {
  item: Item;
  quantity: number;
  discount: number;
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// ─────────────────────────────────────────────
// Receipt Modal with Print & WA Share
// ─────────────────────────────────────────────
interface ReceiptModalProps {
  invoice: string;
  cart: CartLine[];
  subtotalItems: number;
  shippingCost: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentType: 'CASH' | 'TRANSFER' | 'CREDIT';
  dueDate?: string | null;
  customerName: string;
  customerPhone?: string;
  notes: string;
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  invoice,
  cart,
  subtotalItems,
  shippingCost,
  total,
  paidAmount,
  dueAmount,
  paymentType,
  dueDate,
  customerName,
  customerPhone,
  notes,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = (customerPhone || '').trim().replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const itemsFormatted = cart
      .map((line) => {
        const itemTotal = line.item.price * line.quantity;
        const subtotal = itemTotal - (line.discount || 0);
        let str = `- ${line.item.name}\n  ${line.quantity} x ${formatRupiah(line.item.price)} = ${formatRupiah(itemTotal)}`;
        if (line.discount && line.discount > 0) {
          str += `\n  Diskon: -${formatRupiah(line.discount)}\n  Subtotal: ${formatRupiah(subtotal)}`;
        }
        return str;
      })
      .join('\n');

    let waMessage = `*STRUK BELANJA - TOKO KARUNA*\n`;
    waMessage += `No. Invoice: ${invoice}\n`;
    waMessage += `Pelanggan: ${customerName}\n`;
    waMessage += `----------------------------------\n`;
    waMessage += `${itemsFormatted}\n`;
    waMessage += `----------------------------------\n`;
    waMessage += `Subtotal Barang: ${formatRupiah(subtotalItems)}\n`;
    if (shippingCost > 0) {
      waMessage += `Ongkos Kirim: ${formatRupiah(shippingCost)}\n`;
    }
    waMessage += `Grand Total: ${formatRupiah(total)}\n`;
    waMessage += `Dibayar: ${formatRupiah(paidAmount)}\n`;

    if (dueAmount > 0) {
      waMessage += `Sisa Piutang: ${formatRupiah(dueAmount)} (Jatuh Tempo: ${formatDate(dueDate)})\n`;
    } else {
      waMessage += `Status: LUNAS\n`;
    }

    waMessage += `\nTerima kasih telah berbelanja!`;

    const targetPhone = cleanPhone || '';
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, '_blank');
  };

  const paymentTypeLabel =
    paymentType === 'CASH' ? 'Tunai' : paymentType === 'TRANSFER' ? 'Transfer' : 'Kredit (Hutang)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 print:border-0 print:shadow-none print:bg-white print:text-black print:w-full print:max-w-none">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 py-5 px-6 border-b border-slate-800 print:border-black">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center print:hidden">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white print:text-black text-center">TOKO KARUNA</h2>
          <p className="text-xs text-slate-400 font-mono print:text-gray-600">No. Invoice: {invoice}</p>
          <p className="text-xs text-indigo-400 font-medium print:text-black">Pelanggan: {customerName}</p>
        </div>

        {/* Items */}
        <div className="px-6 py-4 space-y-3 max-h-52 overflow-y-auto print:max-h-none print:overflow-visible">
          {cart.map((line) => {
            const itemTotal = line.item.price * line.quantity;
            const subtotal = itemTotal - (line.discount || 0);
            return (
              <div key={line.item.id} className="text-sm space-y-0.5 border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-300 print:text-black truncate max-w-[200px]">
                    {line.item.name}
                  </span>
                  <span className="text-slate-200 print:text-black tabular-nums shrink-0">
                    {formatRupiah(itemTotal)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 print:text-gray-600 pl-2">
                  {line.quantity} × {formatRupiah(line.item.price)}
                </div>
                {line.discount > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-rose-400 print:text-rose-600 pl-2">
                      <span>Diskon</span>
                      <span>-{formatRupiah(line.discount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300 print:text-black font-medium pl-2">
                      <span>Subtotal</span>
                      <span>{formatRupiah(subtotal)}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="px-6 py-4 border-t border-slate-800 print:border-black space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400 print:text-gray-700">
            <span>Subtotal Barang</span>
            <span className="text-slate-200 print:text-black font-medium">{formatRupiah(subtotalItems)}</span>
          </div>
          {shippingCost > 0 && (
            <div className="flex justify-between text-slate-400 print:text-gray-700">
              <span>Ongkos Kirim</span>
              <span className="text-indigo-400 print:text-black font-medium">{formatRupiah(shippingCost)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400 print:text-gray-700 font-semibold border-t border-slate-800/60 pt-1">
            <span>Total Transaksi</span>
            <span className="text-slate-100 print:text-black font-bold">{formatRupiah(total)}</span>
          </div>
          <div className="flex justify-between text-slate-400 print:text-gray-700">
            <span>Metode Pembayaran</span>
            <span className="text-slate-200 print:text-black font-medium">{paymentTypeLabel}</span>
          </div>
          <div className="flex justify-between text-slate-400 print:text-gray-700">
            <span>Jumlah Dibayar / DP</span>
            <span className="text-emerald-400 print:text-black font-medium">{formatRupiah(paidAmount)}</span>
          </div>
          {dueAmount > 0 && (
            <>
              <div className="flex justify-between text-rose-400 font-semibold">
                <span>Sisa Piutang</span>
                <span>{formatRupiah(dueAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400 print:text-gray-700">
                <span>Jatuh Tempo</span>
                <span className="text-slate-200 print:text-black">{formatDate(dueDate)}</span>
              </div>
            </>
          )}
          {notes && (
            <div className="flex justify-between text-slate-400 print:text-gray-700 pt-1">
              <span>Catatan</span>
              <span className="text-slate-200 print:text-black">{notes}</span>
            </div>
          )}
          <p className="text-center text-[11px] text-slate-500 print:text-gray-500 pt-2 border-t border-slate-800/60 print:border-gray-300">
            {new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="px-6 pb-6 pt-2 space-y-2 print:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              Cetak Struk
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
            >
              <MessageSquare className="w-4 h-4" />
              Kirim via WA
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Modal Add Quick Customer
// ─────────────────────────────────────────────
interface AddCustomerModalProps {
  onClose: () => void;
  onSuccess: (newCust: Customer) => void;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama pelanggan wajib diisi.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await createCustomer({ name, phone, address });
      const newCust: Customer = res.data?.customer;
      onSuccess(newCust);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal membuat pelanggan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            Tambah Pelanggan Baru
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Nama Pelanggan *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pak Budi / CV Maju Jaya"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Nomor WhatsApp / HP
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 08123456789"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Alamat
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat pelanggan (opsional)"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Pelanggan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// POS Main Page
// ─────────────────────────────────────────────
export default function POSPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);

  // Selection & Payment state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'TRANSFER' | 'CREDIT'>('CASH');
  const [shippingCostInput, setShippingCostInput] = useState<string>('');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Last receipt data
  const [lastInvoice, setLastInvoice] = useState('');
  const [lastCart, setLastCart] = useState<CartLine[]>([]);
  const [lastSubtotal, setLastSubtotal] = useState(0);
  const [lastShippingCost, setLastShippingCost] = useState(0);
  const [lastTotal, setLastTotal] = useState(0);
  const [lastPaid, setLastPaid] = useState(0);
  const [lastDue, setLastDue] = useState(0);
  const [lastPaymentType, setLastPaymentType] = useState<'CASH' | 'TRANSFER' | 'CREDIT'>('CASH');
  const [lastDueDate, setLastDueDate] = useState<string | null>(null);
  const [lastCustName, setLastCustName] = useState('Umum / Tanpa Nama');
  const [lastCustPhone, setLastCustPhone] = useState('');
  const [lastNotes, setLastNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, custRes] = await Promise.all([getItems(), getCustomers()]);
      const rawItems: Item[] = itemsRes.data?.items ?? itemsRes.data ?? [];
      setItems(rawItems.filter((i) => i.stock > 0));

      const rawCusts: Customer[] = custRes.data?.customers ?? custRes.data ?? [];
      setCustomers(rawCusts);
    } catch (e) {
      console.error('Failed to load initial data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter catalog
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.category && i.category.name.toLowerCase().includes(q))
    );
  }, [items, search]);

  // Cart operations
  const addToCart = (item: Item) => {
    setCart((prev) => {
      const exists = prev.find((l) => l.item.id === item.id);
      if (exists) {
        if (exists.quantity >= item.stock) return prev;
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { item, quantity: 1, discount: 0 }];
    });
    setErrorMsg('');
  };

  const changeQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.item.id !== itemId) return l;
          const newQty = Math.max(0, Math.min(l.quantity + delta, l.item.stock));
          return { ...l, quantity: newQty };
        })
        .filter((l) => l.quantity > 0)
    );
  };

  const setDirectQty = (itemId: string, val: number) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.item.id !== itemId) return l;
          const clampedQty = Math.max(0, Math.min(val, l.item.stock));
          return { ...l, quantity: clampedQty };
        })
        .filter((l) => l.quantity > 0)
    );
  };

  const handleDiscountChange = (itemId: string, val: number) => {
    setCart((prev) =>
      prev.map((l) => {
        if (l.item.id !== itemId) return l;
        const maxDiscount = l.item.price * l.quantity;
        const clampedDiscount = Math.max(0, Math.min(val, maxDiscount));
        return { ...l, discount: clampedDiscount };
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((l) => l.item.id !== itemId));
  };

  const subtotalItems = cart.reduce((sum, l) => sum + (l.item.price * l.quantity - l.discount), 0);
  const shippingFee = Math.max(0, Number(shippingCostInput) || 0);
  const grandTotal = subtotalItems + shippingFee;

  // Sync paid amount when total changes or payment type changes
  useEffect(() => {
    if (paymentType === 'CASH' || paymentType === 'TRANSFER') {
      setPaidAmountInput(grandTotal.toString());
    }
  }, [grandTotal, paymentType]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Keranjang masih kosong.');
      return;
    }

    const paidNum = paymentType === 'CREDIT' ? Number(paidAmountInput) || 0 : grandTotal;

    if (paymentType === 'CREDIT' && !dueDate) {
      setErrorMsg('Silakan pilih Tanggal Jatuh Tempo untuk pembayaran Kredit.');
      return;
    }

    try {
      setCheckoutLoading(true);
      setErrorMsg('');

      const payload = {
        items: cart.map((l) => ({
          item_id: l.item.id,
          quantity: l.quantity,
          price: l.item.price,
          cost_price: l.item.cost_price,
          discount: l.discount,
        })) as SaleLineItem[],
        customer_id: selectedCustomerId || null,
        payment_type: paymentType,
        paid_amount: paidNum,
        shipping_cost: shippingFee,
        due_date: paymentType === 'CREDIT' ? dueDate : null,
        notes,
      };

      const res = await createSale(payload);
      const sale = res.data?.sale;
      const invoiceNumber = sale?.invoice_number ?? 'INV-???';

      const selectedCust = customers.find((c) => c.id === selectedCustomerId);
      const custName = selectedCust ? selectedCust.name : 'Umum / Tanpa Nama';
      const custPhone = selectedCust ? selectedCust.phone || '' : '';

      setLastInvoice(invoiceNumber);
      setLastCart([...cart]);
      setLastSubtotal(subtotalItems);
      setLastShippingCost(shippingFee);
      setLastTotal(grandTotal);
      setLastPaid(paidNum);
      setLastDue(Math.max(0, grandTotal - paidNum));
      setLastPaymentType(paymentType);
      setLastDueDate(paymentType === 'CREDIT' ? dueDate : null);
      setLastCustName(custName);
      setLastCustPhone(custPhone);
      setLastNotes(notes);

      // Reset form
      setCart([]);
      setShippingCostInput('');
      setNotes('');
      setPaidAmountInput('');
      setDueDate('');
      setReceiptOpen(true);

      // Refresh items stock
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal menyimpan transaksi.';
      setErrorMsg(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
      {/* ══ LEFT: Product Catalog (col-span-12 lg:col-span-7 xl:col-span-8) ══ */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Catalog Header */}
        <div className="px-5 py-4 border-b border-slate-800">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Katalog Barang
          </h1>
          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari barang atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition"
            />
          </div>
        </div>

        {/* Catalog Grid Scrollable Area */}
        <div className="p-4 h-[calc(100vh-220px)] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-500">
              <Package className="w-8 h-8" />
              <span className="text-sm">Tidak ada barang ditemukan</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const inCart = cart.find((l) => l.item.id === item.id);
                const isMaxed = inCart ? inCart.quantity >= item.stock : false;
                return (
                  <button
                    key={item.id}
                    onClick={() => !isMaxed && addToCart(item)}
                    disabled={isMaxed}
                    className={`
                      group relative text-left p-3.5 rounded-xl border transition-all duration-150 focus:outline-none
                      ${
                        isMaxed
                          ? 'bg-slate-800/40 border-slate-700 opacity-50 cursor-not-allowed'
                          : 'bg-slate-800 border-slate-700 hover:border-indigo-500/60 hover:bg-slate-750 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer active:scale-95'
                      }
                    `}
                  >
                    {/* Category badge */}
                    {item.category && (
                      <span className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Tag className="w-2.5 h-2.5" />
                        {item.category.name}
                      </span>
                    )}
                    <p className="text-sm font-semibold text-slate-100 leading-tight line-clamp-2 group-hover:text-white">
                      {item.name}
                    </p>
                    <p className="mt-1.5 text-xs font-bold text-emerald-400 tabular-nums">
                      {formatRupiah(item.price)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Stok: {item.stock} {item.unit}
                    </p>
                    {inCart && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT: Cart & Checkout (col-span-12 lg:col-span-5 xl:col-span-4) ══ */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden h-fit">
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
            Keranjang
            {cart.length > 0 && (
              <span className="ml-auto text-xs font-semibold text-indigo-400 bg-indigo-600/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                {cart.reduce((s, l) => s + l.quantity, 0)} item
              </span>
            )}
          </h2>
        </div>

        {/* Cart Items Scrollable Container (h-[280px] overflow-y-auto) */}
        <div className="px-4 py-3 space-y-2.5 h-[280px] overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
              <ShoppingCart className="w-7 h-7" />
              <span className="text-sm">Keranjang kosong</span>
            </div>
          ) : (
            cart.map((line) => {
              const lineTotal = line.item.price * line.quantity;
              const subtotal = lineTotal - line.discount;
              return (
                <div
                  key={line.item.id}
                  className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Name & price */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{line.item.name}</p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {formatRupiah(line.item.price)} × {line.quantity} ={' '}
                        <span className="text-slate-300 font-medium">
                          {formatRupiah(lineTotal)}
                        </span>
                      </p>
                    </div>

                    {/* Qty controls: input bisa diketik langsung & tombol +/- */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => changeQty(line.item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center transition"
                        title="Kurangi 1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={line.item.stock}
                        value={line.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setDirectQty(line.item.id, val);
                          }
                        }}
                        className="w-12 h-6 text-center text-xs font-bold text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Ketik jumlah item"
                      />
                      <button
                        type="button"
                        onClick={() => changeQty(line.item.id, 1)}
                        disabled={line.quantity >= line.item.stock}
                        className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center transition disabled:opacity-40"
                        title="Tambah 1"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(line.item.id)}
                        className="w-6 h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-0.5"
                        title="Hapus dari keranjang"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Discount Input & Subtotal */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-700/60 gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <label className="text-[11px] text-slate-400 shrink-0">Diskon (Rp):</label>
                      <input
                        type="number"
                        min="0"
                        max={lineTotal}
                        value={line.discount === 0 ? '' : line.discount}
                        onChange={(e) => handleDiscountChange(line.item.id, Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-400 mr-1">Subtotal:</span>
                      <span className="text-xs font-bold text-emerald-400 tabular-nums">
                        {formatRupiah(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Checkout & Customer Panel */}
        <div className="px-5 py-4 border-t border-slate-800 space-y-4">
          {/* Customer Selection & Quick Add */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-400" /> Pelanggan
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchableSelect
                  options={[
                    { value: '', label: '-- Umum / Tanpa Nama --' },
                    ...customers.map((c) => ({
                      value: c.id,
                      label: `${c.name}${c.phone ? ` (${c.phone})` : ''}`,
                    })),
                  ]}
                  value={selectedCustomerId}
                  onChange={(val) => setSelectedCustomerId(val)}
                  placeholder="-- Cari / Pilih Pelanggan --"
                />
              </div>
              <button
                type="button"
                onClick={() => setAddCustomerOpen(true)}
                title="Tambah Pelanggan Baru"
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Payment Method Option */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'CASH', label: 'Tunai' },
                { type: 'TRANSFER', label: 'Transfer' },
                { type: 'CREDIT', label: 'Kredit' },
              ].map((m) => (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => setPaymentType(m.type as any)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${
                    paymentType === m.type
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ongkos Kirim Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center justify-between">
              <span>Ongkos Kirim (Rp)</span>
              {shippingFee > 0 && (
                <span className="text-indigo-400 font-semibold lowercase">
                  +{formatRupiah(shippingFee)}
                </span>
              )}
            </label>
            <input
              type="number"
              min="0"
              value={shippingCostInput}
              onChange={(e) => setShippingCostInput(e.target.value)}
              placeholder="0 (Gratis Ongkir)"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition"
            />
          </div>

          {/* Credit Payment Extra Inputs */}
          {paymentType === 'CREDIT' && (
            <div className="space-y-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Jumlah DP / Dibayar (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Sisa Piutang:{' '}
                  <span className="text-rose-400 font-bold tabular-nums">
                    {formatRupiah(Math.max(0, grandTotal - (Number(paidAmountInput) || 0)))}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Tanggal Jatuh Tempo *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Catatan (opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pengiriman via pick-up..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition"
            />
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
              <X className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Subtotal & Total Breakdown */}
          <div className="space-y-1 py-2 border-t border-slate-800 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Barang</span>
              <span className="font-semibold text-slate-200 tabular-nums">{formatRupiah(subtotalItems)}</span>
            </div>
            {shippingFee > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Ongkos Kirim</span>
                <span className="font-semibold text-indigo-400 tabular-nums">{formatRupiah(shippingFee)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-sm font-semibold text-slate-300">Grand Total</span>
              <span className="text-xl font-bold text-emerald-400 tabular-nums">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          {/* Checkout button */}
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading || cart.length === 0}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/20"
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                Proses Transaksi
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Customer Modal */}
      {addCustomerOpen && (
        <AddCustomerModal
          onClose={() => setAddCustomerOpen(false)}
          onSuccess={(newCust) => {
            setCustomers((prev) => [newCust, ...prev]);
            setSelectedCustomerId(newCust.id);
          }}
        />
      )}

      {/* Receipt Modal */}
      {receiptOpen && (
        <ReceiptModal
          invoice={lastInvoice}
          cart={lastCart}
          subtotalItems={lastSubtotal}
          shippingCost={lastShippingCost}
          total={lastTotal}
          paidAmount={lastPaid}
          dueAmount={lastDue}
          paymentType={lastPaymentType}
          dueDate={lastDueDate}
          customerName={lastCustName}
          customerPhone={lastCustPhone}
          notes={lastNotes}
          onClose={() => setReceiptOpen(false)}
        />
      )}
    </div>
  );
}
