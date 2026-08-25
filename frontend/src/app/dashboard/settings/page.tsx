'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings,
  Store,
  MapPin,
  Phone,
  Moon,
  Sun,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Store information state (saved in localStorage)
  const [storeName, setStoreName] = useState('TOKO KARUNA');
  const [storeAddress, setStoreAddress] = useState('Jl. Raya Utama No. 88, Denpasar, Bali');
  const [storePhone, setStorePhone] = useState('081234567890');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedName = localStorage.getItem('karuna_store_name');
    const savedAddr = localStorage.getItem('karuna_store_address');
    const savedPh = localStorage.getItem('karuna_store_phone');

    if (savedName) setStoreName(savedName);
    if (savedAddr) setStoreAddress(savedAddr);
    if (savedPh) setStorePhone(savedPh);
  }, []);

  const handleSaveStoreInfo = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('karuna_store_name', storeName);
    localStorage.setItem('karuna_store_address', storeAddress);
    localStorage.setItem('karuna_store_phone', storePhone);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          Pengaturan Aplikasi
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Konfigurasi identitas toko, nota struk belanja, serta preferensi tampilan tema (Dark / Light Mode)
        </p>
      </div>

      {/* Theme Settings Card */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6">
        <CardHeader className="p-0 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Tema Tampilan Aplikasi
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih tema yang nyaman untuk mata Anda saat bekerja di kasir maupun admin
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Default: Dark Mode
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
                mounted && theme === 'dark'
                  ? 'bg-slate-950 border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                  <Moon className="w-5 h-5" />
                </div>
                {mounted && theme === 'dark' && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-in zoom-in-50" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Dark Mode (Mode Gelap)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nuansa elegan slate gelap, kontras tinggi dan hemat baterai layar OLED/AMOLED.
                </p>
              </div>
            </button>

            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
                mounted && theme === 'light'
                  ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Sun className="w-5 h-5" />
                </div>
                {mounted && theme === 'light' && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-in zoom-in-50" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Light Mode (Mode Terang)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tampilan terang cerah optimal untuk lingkungan kerja dengan pencahayaan tinggi.
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Store Identity Settings Form */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            Informasi Identitas Toko
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Data ini digunakan sebagai kop struk belanja kasir (POS) dan cetak nota transaksi
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <form onSubmit={handleSaveStoreInfo} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Nama Usaha / Toko *
              </label>
              <Input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Contoh: TOKO KARUNA JAYA"
                className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Nomor WhatsApp / Telepon Toko
              </label>
              <Input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Alamat Lengkap Toko
              </label>
              <textarea
                rows={2}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Alamat toko yang akan tercetak di struk..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Pengaturan identitas toko berhasil disimpan!</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs">
                <Save className="w-4 h-4" /> Simpan Pengaturan Toko
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
