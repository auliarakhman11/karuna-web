'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Boxes,
  Tag,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  ShoppingCart,
  BarChart2,
  Layers,
  ClipboardList,
  ShoppingBag,
  History,
  Truck,
  ClipboardCheck,
  Receipt,
  Users,
  Scale,
  BookOpen,
  PieChart,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface MenuItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  children?: Omit<MenuItem, 'children'>[];
}

interface MenuGroup {
  groupLabel?: string;
  items: MenuItem[];
}

// ─────────────────────────────────────────────
// Menu Structure
// ─────────────────────────────────────────────
const menuGroups: MenuGroup[] = [
  {
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      },
    ],
  },
  {
    groupLabel: 'Inventaris',
    items: [
      {
        title: 'Stok Barang',
        icon: <Boxes className="w-5 h-5 shrink-0" />,
        children: [
          {
            title: 'Daftar Barang',
            href: '/dashboard/items',
            icon: <ClipboardList className="w-4 h-4 shrink-0" />,
          },
          {
            title: 'Kategori Barang',
            href: '/dashboard/categories',
            icon: <Tag className="w-4 h-4 shrink-0" />,
          },
          {
            title: 'Opname & Retur',
            href: '/dashboard/inventory',
            icon: <ClipboardCheck className="w-4 h-4 shrink-0" />,
          },
        ],
      },
      {
        title: 'Supplier & Restock',
        href: '/dashboard/suppliers',
        icon: <Truck className="w-5 h-5 shrink-0" />,
      },
    ],
  },
  {
    groupLabel: 'Transaksi',
    items: [
      {
        title: 'Penjualan (POS)',
        href: '/dashboard/pos',
        icon: <ShoppingBag className="w-5 h-5 shrink-0" />,
      },
      {
        title: 'Riwayat Penjualan',
        icon: <ShoppingCart className="w-5 h-5 shrink-0" />,
        children: [
          {
            title: 'Semua Transaksi',
            href: '/dashboard/orders',
            icon: <History className="w-4 h-4 shrink-0" />,
          },
        ],
      },
      {
        title: 'Pengeluaran',
        icon: <Receipt className="w-5 h-5 shrink-0" />,
        children: [
          {
            title: 'Transaksi Beban',
            href: '/dashboard/expenses',
            icon: <Receipt className="w-4 h-4 shrink-0" />,
          },
          {
            title: 'Jenis / Kategori',
            href: '/dashboard/expenses/categories',
            icon: <Tag className="w-4 h-4 shrink-0" />,
          },
        ],
      },
    ],
  },
  {
    groupLabel: 'Keuangan & Modal',
    items: [
      {
        title: 'Investor & Dividen',
        icon: <Users className="w-5 h-5 shrink-0" />,
        children: [
          {
            title: 'Daftar Investor',
            href: '/dashboard/investors',
            icon: <Users className="w-4 h-4 shrink-0" />,
          },
          {
            title: 'Bagi Hasil (Dividen)',
            href: '/dashboard/investors/dividends',
            icon: <PieChart className="w-4 h-4 shrink-0" />,
          },
        ],
      },
    ],
  },
  {
    groupLabel: 'Laporan',
    items: [
      {
        title: 'Laporan Keuangan',
        href: '/dashboard/reports/financial',
        icon: <Scale className="w-5 h-5 shrink-0" />,
      },
      {
        title: 'Buku Jurnal Umum',
        href: '/dashboard/reports/journals',
        icon: <BookOpen className="w-5 h-5 shrink-0" />,
      },
      {
        title: 'Lap. Ongkos Kirim',
        href: '/dashboard/reports/shipping',
        icon: <Truck className="w-5 h-5 shrink-0" />,
      },
    ],
  },
  {
    groupLabel: 'Akun',
    items: [
      {
        title: 'Profil Saya',
        href: '/dashboard/profile',
        icon: <User className="w-5 h-5 shrink-0" />,
      },
      {
        title: 'Pengaturan',
        href: '/dashboard/settings',
        icon: <Settings className="w-5 h-5 shrink-0" />,
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

// ─────────────────────────────────────────────
// Sub-menu Item (leaf node)
// ─────────────────────────────────────────────
interface SubItemProps {
  item: Omit<MenuItem, 'children'>;
  isCollapsed: boolean;
  onMobileClose: () => void;
}

const SubNavItem: React.FC<SubItemProps> = ({ item, isCollapsed, onMobileClose }) => {
  const pathname = usePathname() || '';
  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href!));

  if (isCollapsed) return null;

  return (
    <Link
      href={item.href!}
      onClick={onMobileClose}
      className={cn(
        'flex items-center gap-2.5 pl-9 pr-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
        active
          ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
      )}
    >
      {item.icon}
      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.title}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />}
    </Link>
  );
};

// ─────────────────────────────────────────────
// Top-level Nav Item (with or without children)
// ─────────────────────────────────────────────
interface NavItemProps {
  item: MenuItem;
  isCollapsed: boolean;
  onMobileClose: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, isCollapsed, onMobileClose }) => {
  const pathname = usePathname() || '';

  const childActive = item.children?.some(
    (c) => c.href && (pathname === c.href || pathname.startsWith(c.href))
  ) ?? false;


  const [open, setOpen] = useState(childActive);

  // Leaf node (no children)
  if (!item.children) {
    const active =
      item.href === '/dashboard'
        ? pathname === item.href
        : item.href
        ? pathname.startsWith(item.href)
        : false;

    return (
      <Link
        href={item.href!}
        onClick={onMobileClose}
        title={isCollapsed ? item.title : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
          active
            ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        )}
      >
        {item.icon}
        {!isCollapsed && (
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.title}</span>
        )}
        {!isCollapsed && active && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />
        )}
      </Link>
    );
  }

  // Parent node (has children — collapsible)
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        title={isCollapsed ? item.title : undefined}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
          childActive
            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-600/10'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        )}
      >
        {item.icon}
        {!isCollapsed && (
          <>
            <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left">
              {item.title}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200',
                open && 'rotate-180'
              )}
            />
          </>
        )}
      </button>


      {/* Sub-menu items */}
      {!isCollapsed && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            open ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
          )}
        >
          <div className="space-y-0.5">
            {item.children.map((child) => (
              <SubNavItem
                key={child.href}
                item={child}
                isCollapsed={isCollapsed}
                onMobileClose={onMobileClose}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Sidebar Component
// ─────────────────────────────────────────────
export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose, collapsed, setCollapsed }) => {

  return (
    <>
      {/* Mobile Overlay — visible below md breakpoint */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300',
          // Desktop (≥md): always visible, collapsible
          'md:translate-x-0',
          collapsed ? 'md:w-[72px]' : 'md:w-64',
          // Mobile (<md): slide drawer
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="font-bold text-base text-slate-900 dark:text-slate-100 whitespace-nowrap tracking-wide">
                Karuna Web
              </span>
            )}
          </div>
          {/* Desktop collapse toggle — only shown on md+ */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden md:flex ml-auto p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {menuGroups.map((group, gi) => (
            <div key={gi}>
              {/* Group Label */}
              {group.groupLabel && !collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 select-none">
                  {group.groupLabel}
                </p>
              )}
              {/* Group Items */}
              <div className="space-y-0.5">
                {group.items.map((item, ii) => (
                  <NavItem
                    key={ii}
                    item={item}
                    isCollapsed={collapsed}
                    onMobileClose={onMobileClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer hint */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-600 shrink-0">
            Karuna Web &copy; {new Date().getFullYear()}
          </div>
        )}
      </aside>
    </>
  );
};

// ─────────────────────────────────────────────
// Mobile Toggle Button (used in Header)
// ─────────────────────────────────────────────
export const SidebarToggleButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="md:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
    aria-label="Open sidebar"
  >
    <Menu className="w-5 h-5" />
  </button>
);

