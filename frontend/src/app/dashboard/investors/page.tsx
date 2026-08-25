'use client';

import React, { useState, useEffect } from 'react';
import {
  getInvestors,
  createInvestor,
  updateInvestor,
  deleteInvestor,
  Investor,
} from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  DollarSign,
  PieChart,
  Phone,
  Mail,
  FileText,
  Briefcase,
} from 'lucide-react';

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formShare, setFormShare] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchInvestorsData = async () => {
    try {
      setLoading(true);
      const res = await getInvestors();
      setInvestors(res.data?.investors || res.data || []);
    } catch (e) {
      console.error('Gagal memuat investor:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestorsData();
  }, []);

  const handleOpenAdd = () => {
    setEditingInvestor(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAmount('');
    setFormShare('');
    setFormNotes('');
    setErrorMsg('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (inv: Investor) => {
    setEditingInvestor(inv);
    setFormName(inv.name);
    setFormPhone(inv.phone || '');
    setFormEmail(inv.email || '');
    setFormAmount(String(inv.investment_amount || 0));
    setFormShare(String(inv.share_percentage || 0));
    setFormNotes(inv.notes || '');
    setErrorMsg('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Nama investor wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload = {
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        investment_amount: Math.max(0, Number(formAmount) || 0),
        share_percentage: Math.max(0, Number(formShare) || 0),
        notes: formNotes.trim() || undefined,
      };

      if (editingInvestor) {
        await updateInvestor(editingInvestor.id, payload);
      } else {
        await createInvestor(payload);
      }

      setDialogOpen(false);
      fetchInvestorsData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan data investor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data investor ini?')) return;
    try {
      await deleteInvestor(id);
      fetchInvestorsData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus investor.');
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const filteredInvestors = investors.filter((inv) => {
    const q = search.toLowerCase();
    const name = (inv.name || '').toLowerCase();
    const phone = (inv.phone || '').toLowerCase();
    const email = (inv.email || '').toLowerCase();
    const notes = (inv.notes || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || email.includes(q) || notes.includes(q);
  });

  const totalInvestment = filteredInvestors.reduce((sum, inv) => sum + (Number(inv.investment_amount) || 0), 0);
  const totalShares = filteredInvestors.reduce((sum, inv) => sum + (Number(inv.share_percentage) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Manajemen Investor &amp; Permodalan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola data pemodal, alokasi modal investasi usaha, dan pembagian persentase kepemilikan / bagi hasil
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Tambah Investor
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Total Modal Investasi</span>
            <h3 className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
              {formatRupiah(totalInvestment)}
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Total Persentase Terbagi</span>
            <h3 className="text-xl font-bold text-indigo-300 font-mono mt-0.5">
              {totalShares.toFixed(2)} %
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Jumlah Investor Terdaftar</span>
            <h3 className="text-xl font-bold text-slate-100 font-mono mt-0.5">
              {filteredInvestors.length} Investor
            </h3>
          </div>
        </Card>
      </div>

      {/* Filter / Search */}
      <Card className="p-4 bg-slate-900 border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama investor, kontak telepon, email, atau catatan perjanjian..."
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
      ) : filteredInvestors.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 bg-slate-900 border-slate-800">
          Belum ada data investor. Klik tombol "Tambah Investor" untuk menambahkan pemodal.
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Investor</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Nominal Investasi</th>
                  <th className="py-3 px-4">Bagi Hasil / Saham</th>
                  <th className="py-3 px-4">Catatan / Perjanjian</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredInvestors.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          {inv.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{inv.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 space-y-0.5">
                      {inv.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" /> {inv.phone}
                        </div>
                      )}
                      {inv.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" /> {inv.email}
                        </div>
                      )}
                      {!inv.phone && !inv.email && <span className="text-slate-600">-</span>}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {formatRupiah(Number(inv.investment_amount) || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono">
                        {Number(inv.share_percentage || 0).toFixed(2)} %
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 max-w-xs truncate">
                      {inv.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(inv)}
                          className="h-8 px-2.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(inv.id)}
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

      {/* Modal Dialog Form Investor */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !open && setDialogOpen(false)}
        title={editingInvestor ? 'Edit Data Investor' : 'Tambah Investor Baru'}
        description="Lengkapi data profil pemodal, komitmen modal, dan persentase bagi hasil."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Nama Investor *</label>
            <Input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Bapak Hendra / PT Investama..."
              className="bg-slate-950 border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">No. Telepon / WhatsApp</label>
              <Input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="08123456789"
                className="bg-slate-950 border-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email</label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="investor@email.com"
                className="bg-slate-950 border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nominal Investasi (Rp)</label>
              <Input
                type="number"
                min="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0"
                className="bg-slate-950 border-slate-700 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Persentase Saham / Bagi Hasil (%)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formShare}
                onChange={(e) => setFormShare(e.target.value)}
                placeholder="Contoh: 10.5"
                className="bg-slate-950 border-slate-700 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Catatan / Perjanjian Tambahan</label>
            <Input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Contoh: Dividen dibagikan tiap akhir tahun..."
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
              {editingInvestor ? 'Simpan Perubahan' : 'Tambah Investor'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
