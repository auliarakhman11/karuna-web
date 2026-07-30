'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
  },
  {
    label: 'Profil Saya',
    href: '/dashboard/profile',
    icon: <User className="w-5 h-5 shrink-0" />,
  },
  {
    label: 'Pengaturan',
    href: '/dashboard/settings',
    icon: <Settings className="w-5 h-5 shrink-0" />,
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300',
          // Desktop: collapsible
          collapsed ? 'w-[72px]' : 'w-64',
          // Mobile: slide in/out
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center h-16 px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="font-bold text-base text-slate-100 whitespace-nowrap tracking-wide">
                Karuna Web
              </span>
            )}
          </div>
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:flex ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/25 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                )}
              >
                {item.icon}
                {!collapsed && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </span>
                )}
                {!collapsed && active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer hint */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-slate-800 text-xs text-slate-600 shrink-0">
            Karuna Web &copy; {new Date().getFullYear()}
          </div>
        )}
      </aside>
    </>
  );
};

export const SidebarToggleButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
    aria-label="Open sidebar"
  >
    <Menu className="w-5 h-5" />
  </button>
);
