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
  KeyRound,
  Lock,
  Check,
  AlertCircle,
} from 'lucide-react';
import { AuthUser } from '@/lib/auth-client';
import { Modal } from '@/components/ui/Modal';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/lib/i18n';
import { validatePassword } from '@/lib/validation';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentUser: AuthUser | null;
  unreadCount?: number;
}

export function Header({ onToggleSidebar, currentUser, unreadCount = 0 }: HeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [timeStr, setTimeStr] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    vehicles: any[];
    customers: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setPwdError(validation.errors.join(' '));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Yeni şifreler birbiriyle uyuşmuyor.');
      return;
    }

    try {
      setPwdLoading(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Şifre güncellenemedi.');
      }
      setPwdSuccess('Giriş şifreniz başarıyla güncellendi!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPwdError(err.message);
    } finally {
      setPwdLoading(false);
    }
  };

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
    <header
      className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs pt-safe transition-colors"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)' }}
    >
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
        {/* Left side: Hamburger + Search */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="lg:hidden flex items-center shrink-0 mr-1 group">
            <img
              src="/icon.png"
              alt="Filo Yönetim"
              className="w-8 h-8 rounded-lg object-contain shadow-xs border border-slate-700 bg-slate-900 group-hover:scale-105 transition-transform"
            />
          </Link>

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
                placeholder={t.header_search_placeholder}
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden rounded-xl transition-all font-sans"
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults && (
              <div
                className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 max-h-96 overflow-y-auto"
                onMouseLeave={() => setShowSearchDropdown(false)}
              >
                {(() => {
                  const isSuper = currentUser?.role === 'SUPER_ADMIN';
                  const canViewVehicles = isSuper || currentUser?.features?.vehicles !== false;
                  const canViewCustomers = isSuper || currentUser?.features?.customers !== false;
                  const visibleVehicles = canViewVehicles ? searchResults.vehicles : [];
                  const visibleCustomers = canViewCustomers ? searchResults.customers : [];

                  if (visibleVehicles.length === 0 && visibleCustomers.length === 0) {
                    return (
                      <div className="p-4 text-center text-xs text-slate-500">
                        &quot;{searchQuery}&quot; ile eşleşen sonuç bulunamadı.
                      </div>
                    );
                  }

                  return (
                    <div className="p-2 divide-y divide-slate-100 dark:divide-slate-800">
                      {visibleVehicles.length > 0 && (
                        <div className="py-2">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                            {t.nav_vehicles}
                          </div>
                          {visibleVehicles.map((v) => (
                            <Link
                              key={v.id}
                              href={`/vehicles/${v.id}`}
                              onClick={() => {
                                setShowSearchDropdown(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <Car className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">{v.plate}</span>
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

                      {visibleCustomers.length > 0 && (
                        <div className="py-2">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                            {t.nav_customers}
                          </div>
                          {visibleCustomers.map((c) => (
                            <Link
                              key={c.id}
                              href={`/customers`}
                              onClick={() => {
                                setShowSearchDropdown(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</span>
                              </div>
                              <span className="text-xs text-slate-400">{c.phone}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Clock, Language, Theme, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono">{timeStr}</span>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Language Selector */}
          <LanguageSelector />

          {/* Super Admin Direct Link */}
          {currentUser?.role === 'SUPER_ADMIN' && (
            <Link
              href="/super-admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>SaaS Master Paneli</span>
            </Link>
          )}

          {/* Notifications Icon */}
          <Link
            href="/notifications"
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title={t.header_notifications}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </Link>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                {currentUser?.name?.charAt(0) || 'Y'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {currentUser?.name || 'Yönetici'}
                </div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {currentUser?.role === 'SUPER_ADMIN'
                    ? 'SaaS Sahibi & Yapımcısı'
                    : currentUser?.role === 'STAFF'
                    ? 'Filo Çalışanı'
                    : 'Filo Yöneticisi'}
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentUser?.name || 'Yönetici'}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</div>
                  {currentUser?.fleetCode && (
                    <div className="mt-1 text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md inline-block">
                      {t.auth_fleet_code}: {currentUser.fleetCode}
                    </div>
                  )}
                </div>

                {currentUser?.role === 'SUPER_ADMIN' && (
                  <Link
                    href="/super-admin"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors border-b border-slate-100 dark:border-slate-800"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    {t.nav_super_admin}
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setPwdError(null);
                    setPwdSuccess(null);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowPasswordModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors text-left cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {t.header_change_password}
                </button>

                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  {t.nav_settings}
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left border-t border-slate-100 dark:border-slate-800 mt-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  {t.header_sign_out}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ŞİFRE DEĞİŞTİRME MODAL */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Giriş Şifremi Değiştir"
        subtitle={`${currentUser?.name || 'Kullanıcı'} (${currentUser?.email || ''}) hesabınızın giriş şifresini güncelleyin`}
        maxWidth="sm"
      >
        {pwdSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{pwdSuccess}</span>
          </div>
        )}

        {pwdError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{pwdError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mevcut Şifre
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mevcut şifreniz"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Süper adminler için mevcut şifre isteğe bağlıdır.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yeni Şifre *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter, büyük/küçük harf & rakam"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:border-amber-500 font-mono"
              />
            </div>
            {newPassword && (
              <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-300">{t.auth_password_rules}</div>
                <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{newPassword.length >= 6 ? '✓' : '○'}</span> {t.auth_password_rule_len}
                </div>
                <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span> {t.auth_password_rule_upper}
                </div>
                <div className={`flex items-center gap-1.5 ${/[a-z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{/[a-z]/.test(newPassword) ? '✓' : '○'}</span> {t.auth_password_rule_lower}
                </div>
                <div className={`flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{/[0-9]/.test(newPassword) ? '✓' : '○'}</span> {t.auth_password_rule_number}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yeni Şifre (Tekrar) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni şifreyi onaylayın"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={pwdLoading}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {pwdLoading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
