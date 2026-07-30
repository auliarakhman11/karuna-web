'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth Guard: redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Memuat sesi...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main area: shifted on desktop to accommodate sidebar */}
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        {/* Sticky Header */}
        <Header onSidebarToggle={() => setMobileOpen((v) => !v)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
