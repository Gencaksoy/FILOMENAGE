'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Users,
  Wrench,
  FileCheck2,
  Bell,
  UserCog,
  Settings,
  History,
  X,
  Droplet,
  FolderLock,
} from 'lucide-react';

import { AuthUser } from '@/lib/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount?: number;
  userRole?: string;
  currentUser?: AuthUser | null;
}

export function Sidebar({ isOpen, onClose, unreadCount = 0, userRole = 'ADMIN', currentUser }: SidebarProps) {
  const pathname = usePathname();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.email === 'akif@filoyonetim.com' || userRole === 'SUPER_ADMIN';

  const navigation = [
    {
      name: 'Süper Yönetici Paneli',
      href: '/super-admin',
      icon: FolderLock,
      superAdminOnly: true,
      highlight: true,
    },
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Araçlar', href: '/vehicles', icon: Car },
    { name: 'Müşteriler & Belgeler', href: '/customers', icon: Users },
    { name: 'Bakım & Yağ Takibi', href: '/maintenances', icon: Wrench },
    { name: 'Yıllık Muayene & Registracija', href: '/inspection', icon: FileCheck2 },
    {
      name: 'Bildirimler',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { name: 'İşlem Geçmişi (Audit)', href: '/audit-logs', icon: History, adminOnly: true },
    { name: 'Kullanıcılar', href: '/users', icon: UserCog, adminOnly: true },
    { name: 'Sistem Ayarları', href: '/settings', icon: Settings, adminOnly: true },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 bg-slate-950/70 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-sky-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-white tracking-wider text-sm leading-tight">
                FİLO YÖNETİM
              </div>
              <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                Takip & Operasyon
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-xs font-bold tracking-wider uppercase text-slate-400">
            Ana Menü
          </div>
          {navigation.map((item: any) => {
            if (item.superAdminOnly && !isSuperAdmin) return null;
            if (item.adminOnly && userRole !== 'ADMIN' && !isSuperAdmin) return null;

            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`group flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
                    : item.highlight
                    ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive
                        ? 'bg-white text-sky-700'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Beograd Operasyon</span>
              <div className="text-xs text-slate-400">Para Birimi: EUR (€)</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
