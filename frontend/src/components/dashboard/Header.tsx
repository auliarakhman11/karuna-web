'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown-menu';
import { SidebarToggleButton } from '@/components/dashboard/Sidebar';
import { LogOut, UserCircle, Settings, ChevronDown, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

// Map of pathnames to page titles
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/items': 'Stok & Kayu Bangunan',
  '/dashboard/categories': 'Kategori Barang',
  '/dashboard/pos': 'Kasir / Transaksi Penjualan',
  '/dashboard/orders': 'Riwayat Penjualan',
  '/dashboard/expenses': 'Pengeluaran Operasional',
  '/dashboard/suppliers': 'Supplier & Pembelian',
  '/dashboard/inventory': 'Opname & Retur Stok',
  '/dashboard/investors': 'Daftar Investor',
  '/dashboard/investors/dividends': 'Bagi Hasil Dividen',
  '/dashboard/reports/financial': 'Laporan Keuangan',
  '/dashboard/reports/journals': 'Buku Jurnal Umum',
  '/dashboard/reports/shipping': 'Laporan Ongkos Kirim',
  '/dashboard/profile': 'Profil Saya',
  '/dashboard/settings': 'Pengaturan',
};

interface HeaderProps {
  onSidebarToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const pageTitle = pageTitles[pathname] ?? 'Dashboard';



  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      {/* Left: Mobile toggle + Page title */}
      <div className="flex items-center gap-3">
        <SidebarToggleButton onClick={onSidebarToggle} />
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-none">{pageTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Karuna Web Platform</p>
        </div>
      </div>

      {/* Right: Theme toggle & User profile dropdown */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          className="p-2 rounded-xl border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {user && (
          <DropdownMenu
          align="right"
          trigger={
            <div className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition cursor-pointer">
              <Avatar className="h-8 w-8 ring-2 ring-indigo-500/30">
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left leading-none">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
            </div>
          }
        >
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Akun</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{user.name}</p>
          </div>
          <DropdownItem
            icon={<UserCircle className="w-4 h-4" />}
            onClick={() => router.push('/dashboard/profile')}
          >
            Profil Saya
          </DropdownItem>
          <DropdownItem
            icon={<Settings className="w-4 h-4" />}
            onClick={() => router.push('/dashboard/settings')}
          >
            Pengaturan
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem
            icon={<LogOut className="w-4 h-4" />}
            destructive
            onClick={handleLogout}
          >
            Logout
          </DropdownItem>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default Header;
