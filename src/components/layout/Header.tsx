'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Car,
  Users,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { AuthUser } from '@/lib/auth';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentUser: AuthUser | null;
  unreadCount?: number;
}

export function Header({ onToggleSidebar, currentUser, unreadCount = 0 }: HeaderProps) {
  const router = useRouter();
  const [timeStr, setTimeStr] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    vehicles: any[];
    customers: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${day}.${month}.${year} ${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowSearchDropdown(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs pt-[env(safe-area-inset-top,0px)]">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
        {/* Left side: Hamburger + Search */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search */}
          <div className="relative w-full">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults) setShowSearchDropdown(true);
                }}
                placeholder="Plaka veya müşteri ara... (Örn: BG 890-CD, Nikola)"
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white focus:outline-hidden rounded-xl transition-all font-sans"
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults && (
              <div
                className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
                onMouseLeave={() => setShowSearchDropdown(false)}
              >
                {searchResults.vehicles.length === 0 && searchResults.customers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    &quot;{searchQuery}&quot; ile eşleşen sonuç bulunamadı.
                  </div>
                ) : (
                  <div className="p-2 divide-y divide-slate-100">
                    {searchResults.vehicles.length > 0 && (
                      <div className="py-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                          Araçlar
                        </div>
                        {searchResults.vehicles.map((v) => (
                          <Link
                            key={v.id}
                            href={`/vehicles/${v.id}`}
                            onClick={() => {
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Car className="w-4 h-4 text-sky-600" />
                              <div>
                                <span className="font-bold text-slate-800 font-mono">{v.plate}</span>
                                <span className="text-slate-500 ml-1.5">{v.brand} {v.model}</span>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-slate-400">
                              {new Intl.NumberFormat('de-DE').format(v.currentKm)} KM
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.customers.length > 0 && (
                      <div className="py-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                          Müşteriler
                        </div>
                        {searchResults.customers.map((c) => (
                          <Link
                            key={c.id}
                            href={`/customers`}
                            onClick={() => {
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Users className="w-4 h-4 text-emerald-600" />
                              <span className="font-semibold text-slate-800">{c.name}</span>
                            </div>
                            <span className="text-xs text-slate-400">{c.phone}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Clock, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-mono">{timeStr}</span>
          </div>

          {/* Super Admin Direct Link */}
          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.email === 'akif@filoyonetim.com') && (
            <Link
              href="/super-admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>SaaS Master Paneli</span>
            </Link>
          )}

          {/* Notifications Icon */}
          <Link
            href="/notifications"
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Bildirimler"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </Link>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                {currentUser?.name?.charAt(0) || 'Y'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.name || 'Yönetici'}
                </div>
                <div className="text-xs font-semibold text-amber-700">
                  {currentUser?.role === 'SUPER_ADMIN' || currentUser?.email === 'akif@filoyonetim.com'
                    ? 'SaaS Sahibi & Yapımcısı'
                    : currentUser?.role === 'STAFF'
                    ? 'Filo Çalışanı'
                    : 'Filo Yöneticisi'}
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{currentUser?.name || 'Yönetici'}</div>
                  <div className="text-xs text-slate-500 truncate">{currentUser?.email}</div>
                  {currentUser?.fleetCode && (
                    <div className="mt-1 text-xs font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block">
                      Filo: {currentUser.fleetCode}
                    </div>
                  )}
                </div>

                {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.email === 'akif@filoyonetim.com') && (
                  <Link
                    href="/super-admin"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors border-b border-slate-100"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Süper Yönetici Paneli
                  </Link>
                )}

                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Sistem Parametreleri
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left border-t border-slate-100 mt-1"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
