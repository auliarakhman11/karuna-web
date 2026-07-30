'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  UserCheck,
  Clock,
  ArrowRight,
  Activity,
  Database,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 via-indigo-600/10 to-slate-900/0 border border-indigo-500/20 rounded-2xl p-6 md:p-8">
        <div className="relative z-10">
          <p className="text-indigo-400 text-sm font-medium mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Sesi Terautentikasi
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Selamat Datang, {user?.name || 'Pengguna'}! 👋
          </h2>
          <p className="text-slate-400 mt-2 text-sm max-w-xl">
            Anda berhasil masuk ke sistem Karuna Web. Kelola profil, pantau aktivitas, dan konfigurasi pengaturan akun dari dashboard ini.
          </p>
        </div>
        {/* Decorative blur circle */}
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Status Akun</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-100">Aktif</p>
            <p className="text-xs text-emerald-400 mt-1">Terverifikasi &amp; Aman</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Role Pengguna</CardTitle>
            <UserCheck className="w-5 h-5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-100">Member</p>
            <p className="text-xs text-slate-400 mt-1">Hak akses standar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Sesi Terakhir</CardTitle>
            <Clock className="w-5 h-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-100">Hari Ini</p>
            <p className="text-xs text-slate-400 mt-1">Token JWT aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-5 h-5 text-amber-400" />
              Aksi Cepat
            </CardTitle>
            <CardDescription>Navigasi cepat ke halaman utama</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/profile">
              <Button variant="outline" className="w-full justify-between group">
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  Lihat Profil Saya
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full justify-between group">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Kelola Pengaturan
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-5 h-5 text-emerald-400" />
              Status Sistem
            </CardTitle>
            <CardDescription>Status layanan infrastruktur Karuna Web</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Zap className="w-4 h-4 text-slate-500" />
                Express API
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Database className="w-4 h-4 text-slate-500" />
                Supabase Database
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                Terhubung
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                Auth JWT
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
                HttpOnly Cookie
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
