'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown-menu';
import { SidebarToggleButton } from '@/components/dashboard/Sidebar';
import { LogOut, UserCircle, Settings, ChevronDown } from 'lucide-react';

// Map of pathnames to page titles
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/items': 'Stok & Kayu Bangunan',
  '/dashboard/categories': 'Kategori Barang',
  '/dashboard/pos': 'Kasir / Transaksi Penjualan',
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
    <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      {/* Left: Mobile toggle + Page title */}
      <div className="flex items-center gap-3">
        <SidebarToggleButton onClick={onSidebarToggle} />
        <div>
          <h1 className="text-base font-semibold text-slate-100 leading-none">{pageTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Karuna Web Platform</p>
        </div>
      </div>

      {/* Right: User profile dropdown */}
      {user && (
        <DropdownMenu
          align="right"
          trigger={
            <div className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition cursor-pointer">
              <Avatar className="h-8 w-8 ring-2 ring-indigo-500/30">
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left leading-none">
                <p className="text-sm font-medium text-slate-100">{user.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
            </div>
          }
        >
          <div className="px-3 py-2 border-b border-slate-800 mb-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Akun</p>
            <p className="text-sm font-medium text-slate-200 mt-0.5">{user.name}</p>
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
    </header>
  );
};

export default Header;
