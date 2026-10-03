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
  AlertTriangle,
  ChevronRight,
  Lock,
} from 'lucide-react';

import { AuthUser } from '@/lib/auth-client';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount?: number;
  userRole?: string;
  currentUser?: AuthUser | null;
}

export function Sidebar({ isOpen, onClose, unreadCount = 0, userRole, currentUser: propUser }: SidebarProps) {
  const pathname = usePathname();
  const { user: authUser } = useAuth();
  const { t, language } = useLanguage();

  // Prefer propUser, fallback to cached authUser so there is NEVER a null flash on navigation
  const currentUser = propUser || authUser;

  const isSuperAdmin =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.email === 'akif@filoyonetim.com' ||
    currentUser?.email === 'gencaksoy@outlook.com' ||
    userRole === 'SUPER_ADMIN';

  const isStaff = currentUser?.role === 'STAFF' || userRole === 'STAFF';

  const navigation = [
    {
      name: t.nav_super_admin,
      href: '/super-admin',
      icon: FolderLock,
      superAdminOnly: true,
      highlight: true,
    },
    { name: t.nav_dashboard, href: '/', icon: LayoutDashboard },
    { name: t.nav_vehicles, href: '/vehicles', icon: Car, featureKey: 'vehicles' },
    { name: t.nav_customers, href: '/customers', icon: Users, featureKey: 'customers' },
    { name: t.nav_maintenance, href: '/maintenances', icon: Wrench, featureKey: 'maintenance' },
    { name: t.nav_inspection, href: '/inspection', icon: FileCheck2, featureKey: 'inspection' },
    { name: t.nav_parking_tickets, href: '/parking-tickets', icon: AlertTriangle, featureKey: 'parkingTickets' },
    {
      name: t.nav_notifications,
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { name: t.nav_audit_logs, href: '/audit-logs', icon: History, adminOnly: true, featureKey: 'auditLogs' },
    { name: t.nav_users, href: '/users', icon: UserCog, adminOnly: true },
    { name: t.nav_settings, href: '/settings', icon: Settings, adminOnly: true },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container - Fixed width to completely prevent shrinking or layout shift */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 min-w-[16rem] max-w-[16rem] shrink-0 bg-[#0d161f] text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800/80 shadow-2xl pt-safe pb-safe select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
        }}
      >
        {/* Brand header with Filorapor-inspired pine & gold badge */}
        <div className="h-16 flex items-center justify-between px-4 bg-[#091018] border-b border-slate-800/90 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-amber-500/10 border border-slate-700/80 bg-slate-900 shrink-0 flex items-center justify-center group-hover:border-amber-400 transition-colors">
              <img
                src="/icon.png"
                alt="Filo Yönetim"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div className="min-w-0">
              <div className="font-black text-white tracking-wider text-xs leading-tight group-hover:text-amber-400 transition-colors truncate">
                FİLO YÖNETİM
              </div>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <span>Rapor & Takip</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3.5 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-3 pb-2 text-[10px] font-black tracking-widest uppercase text-slate-400">
            {t.nav_main_menu}
          </div>
          {navigation.map((item: any) => {
            if (item.superAdminOnly && !isSuperAdmin) return null;
            if (item.adminOnly && isStaff) return null;

            // SaaS Modül Erişim Kontrolü:
            // Modülleri sidebardan ASLA GİZLEME (kullanıcının isteği: sidebar küçülmesin, kaybolmasın).
            // Devre dışı modüller kilitli olarak görünür ve tıklandığında AppLayout içerisindeki "Bu Modül Filonuz İçin Devre Dışı Bırakılmıştır" ekranına yönlendirilir.
            const isFeatureDisabled =
              !isSuperAdmin &&
              currentUser?.features &&
              (item.featureKey
                ? item.href === '/maintenances'
                  ? currentUser.features.maintenance === false && currentUser.features.oilChange === false
                  : currentUser.features[item.featureKey] === false
                : false);

            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`group flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/25 ring-1 ring-amber-400/50'
                    : isFeatureDisabled
                    ? 'text-slate-400/70 hover:text-slate-200 hover:bg-slate-800/40 opacity-75'
                    : item.highlight
                    ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
                title={
                  isFeatureDisabled
                    ? language === 'sr'
                      ? 'Modul je deaktiviran za vašu flotu'
                      : language === 'en'
                      ? 'Module is disabled for your fleet'
                      : 'Filonuz için devre dışı bırakılmış modül'
                    : undefined
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-slate-950'
                        : isFeatureDisabled
                        ? 'text-slate-500'
                        : 'text-slate-400 group-hover:text-amber-400'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {isFeatureDisabled ? (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-800 text-amber-400/80 border border-amber-400/20 flex items-center gap-1 shrink-0">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{language === 'sr' ? 'Zaključano' : language === 'en' ? 'Locked' : 'Kilitli'}</span>
                  </span>
                ) : item.badge !== undefined ? (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-black rounded-full shrink-0 ${
                      isActive
                        ? 'bg-slate-950 text-white'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#091018] shrink-0">
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse shrink-0" />
              <div className="text-[11px] truncate">
                <span className="font-bold text-white block truncate">
                  {currentUser?.fleetName || 'Beograd Operasyon'}
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-semibold">
                  {language === 'sr' ? 'Kod Flote: ' : language === 'en' ? 'Fleet Code: ' : 'Filo Kodu: '}
                  <span className="text-white font-bold">{currentUser?.fleetCode || '-'}</span>
                </span>
              </div>
            </div>
            {currentUser?.fleetCode && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-black bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                {currentUser.fleetCode}
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
