'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getItems, createSale, SaleLineItem } from '@/lib/api';
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
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Item {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category?: { id: string; name: string } | null;
}

interface CartLine {
  item: Item;
  quantity: number;
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

// ─────────────────────────────────────────────
// Receipt Modal
// ─────────────────────────────────────────────
interface ReceiptModalProps {
  invoice: string;
  cart: CartLine[];
  total: number;
  paymentMethod: string;
  notes: string;
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, cart, total, paymentMethod, notes, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 py-6 px-6 border-b border-slate-800">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white mt-1">Transaksi Berhasil!</h2>
        <p className="text-xs text-slate-400 font-mono">{invoice}</p>
      </div>

      {/* Items */}
      <div className="px-6 py-4 space-y-2 max-h-56 overflow-y-auto">
        {cart.map((line) => (
          <div key={line.item.id} className="flex justify-between text-sm">
            <span className="text-slate-300 truncate max-w-[160px]">
              {line.item.name}{' '}
              <span className="text-slate-500 text-xs">×{line.quantity}</span>
            </span>
            <span className="text-slate-200 font-medium tabular-nums shrink-0">
              {formatRupiah(line.item.price * line.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="px-6 py-4 border-t border-slate-800 space-y-2">
        <div className="flex justify-between text-sm text-slate-400">
          <span>Metode Bayar</span>
          <span className="text-slate-200">{paymentMethod}</span>
        </div>
        {notes && (
          <div className="flex justify-between text-sm text-slate-400">
            <span>Catatan</span>
            <span className="text-slate-200 text-right max-w-[180px]">{notes}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-800">
          <span className="text-white">Total</span>
          <span className="text-emerald-400 tabular-nums">{formatRupiah(total)}</span>
        </div>
        <p className="text-center text-xs text-slate-600 pt-1">
          {new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
        </p>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6">
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

// ─────────────────────────────────────────────
// POS Page
// ─────────────────────────────────────────────
export default function POSPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [notes, setNotes] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Receipt modal state
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState('');
  const [lastCart, setLastCart] = useState<CartLine[]>([]);
  const [lastTotal, setLastTotal] = useState(0);
  const [lastPayment, setLastPayment] = useState('');
  const [lastNotes, setLastNotes] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await getItems();
      const rawItems: Item[] = res.data?.items ?? res.data ?? [];
      setItems(rawItems.filter((i) => i.stock > 0));
    } catch (e) {
      console.error('Failed to load items', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ── Filtered catalog ──
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category?.name.toLowerCase().includes(q)
    );
  }, [items, search]);

  // ── Cart helpers ──
  const addToCart = (item: Item) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev; // can't exceed stock
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    setErrorMsg('');
  };

  const changeQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.item.id === itemId ? { ...l, quantity: Math.max(0, Math.min(l.quantity + delta, l.item.stock)) } : l
        )
        .filter((l) => l.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((l) => l.item.id !== itemId));
  };

  const totalAmount = cart.reduce((sum, l) => sum + l.item.price * l.quantity, 0);

  // ── Checkout ──
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Keranjang masih kosong.');
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
        })) as SaleLineItem[],
        payment_method: paymentMethod,
        notes,
      };

      const res = await createSale(payload);
      const invoiceNumber = res.data?.sale?.invoice_number ?? 'INV-???';

      // Save receipt data
      setLastInvoice(invoiceNumber);
      setLastCart([...cart]);
      setLastTotal(totalAmount);
      setLastPayment(paymentMethod);
      setLastNotes(notes);

      // Reset cart
      setCart([]);
      setNotes('');
      setReceiptOpen(true);

      // Refresh item stock in catalog
      fetchItems();
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

        {/* Catalog Grid */}
        <div className="p-4">
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
                      ${isMaxed
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

        {/* Cart Lines */}
        <div className="px-4 py-3 space-y-2 max-h-[380px] overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-600">
              <ShoppingCart className="w-7 h-7" />
              <span className="text-sm">Keranjang kosong</span>
            </div>
          ) : (
            cart.map((line) => (
              <div
                key={line.item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700"
              >
                {/* Name & price */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{line.item.name}</p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {formatRupiah(line.item.price)} × {line.quantity} ={' '}
                    <span className="text-emerald-400 font-semibold">
                      {formatRupiah(line.item.price * line.quantity)}
                    </span>
                  </p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => changeQty(line.item.id, -1)}
                    className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-white tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    onClick={() => changeQty(line.item.id, 1)}
                    disabled={line.quantity >= line.item.stock}
                    className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center transition disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFromCart(line.item.id)}
                    className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Panel */}
        <div className="px-5 py-4 border-t border-slate-800 space-y-4">
          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Tunai', 'Transfer'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-xl text-sm font-semibold border transition ${
                    paymentMethod === method
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Catatan (opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pelanggan A, cicilan..."
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

          {/* Total */}
          <div className="flex items-center justify-between py-2 border-t border-slate-800">
            <span className="text-sm font-semibold text-slate-400">Total Bayar</span>
            <span className="text-xl font-bold text-emerald-400 tabular-nums">
              {formatRupiah(totalAmount)}
            </span>
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

      {/* Receipt Modal */}
      {receiptOpen && (
        <ReceiptModal
          invoice={lastInvoice}
          cart={lastCart}
          total={lastTotal}
          paymentMethod={lastPayment}
          notes={lastNotes}
          onClose={() => setReceiptOpen(false)}
        />
      )}
    </div>
  );
}
