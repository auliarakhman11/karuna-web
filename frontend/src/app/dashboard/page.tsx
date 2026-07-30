'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LogOut,
  ShieldCheck,
  UserCheck,
  Clock,
  Activity,
  CheckCircle2,
  Loader2,
  LayoutDashboard,
  Mail,
  Fingerprint,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Memuat sesi...</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-100 tracking-wide">
              Karuna Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-r border-slate-800 pr-4">
              <Avatar className="h-9 w-9 ring-2 ring-indigo-500/30">
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-100 leading-none mb-1">
                  {user.name}
                </p>
                <p className="text-xs text-slate-400 leading-none">{user.email}</p>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Selamat Datang, {user.name}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Berikut ringkasan akun dan aktivitas sistem Anda.
          </p>
        </div>

        {/* Quick Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Status Akun
              </CardTitle>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">Aktif</div>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi & Aman
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Role Pengguna
              </CardTitle>
              <UserCheck className="w-5 h-5 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">User / Member</div>
              <p className="text-xs text-slate-400 mt-1">Hak akses standar terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Sesi Terakhir
              </CardTitle>
              <Clock className="w-5 h-5 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">Hari Ini</div>
              <p className="text-xs text-slate-400 mt-1">Token JWT Aktif (15m/7d)</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Detail Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-indigo-400" />
                Detail Informasi Pengguna
              </CardTitle>
              <CardDescription>
                Informasi identitas akun yang saat ini terhubung ke backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Nama Lengkap
                  </p>
                  <p className="text-slate-100 font-medium mt-0.5">{user.name}</p>
                </div>
                <UserCheck className="w-5 h-5 text-slate-600" />
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Email Terdaftar
                  </p>
                  <p className="text-slate-100 font-medium mt-0.5">{user.email}</p>
                </div>
                <Mail className="w-5 h-5 text-slate-600" />
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    User UUID (Database)
                  </p>
                  <p className="text-xs font-mono text-slate-300 mt-0.5">{user.id}</p>
                </div>
                <Fingerprint className="w-5 h-5 text-slate-600" />
              </div>
            </CardContent>
          </Card>

          {/* System Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Status Infrastruktur
              </CardTitle>
              <CardDescription>Status layanan Karuna Web</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-sm text-slate-300">Express API</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                  Online (Port 5000)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-sm text-slate-300">Database Supabase</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                  Terhubung
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-sm text-slate-300">Autentikasi JWT</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
                  HttpOnly Cookie
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
