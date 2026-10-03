'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, AlertTriangle, AlertCircle, Info, CheckCircle2, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { formatDateTime } from '@/lib/formatters';
import { AuthUser } from '@/lib/auth-client';
import { useLanguage } from '@/lib/i18n';

export default function NotificationsPage() {
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((u) => {
        if (u?.user) setCurrentUser(u.user);
        else window.location.href = '/login';
      });

    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      await loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    const confirmMsg =
      language === 'tr'
        ? 'Tüm bildirimleri kalıcı olarak silmek istediğinizden emin misiniz?'
        : language === 'sr'
        ? 'Da li ste sigurni da želite trajno obrisati sva obaveštenja?'
        : 'Are you sure you want to permanently clear all notifications?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await fetch('/api/notifications?clearAll=true', {
        method: 'DELETE',
      });
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'DANGER':
        return <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const titleText =
    language === 'tr'
      ? 'Bildirim Merkezi'
      : language === 'sr'
      ? 'Centar za Obaveštenja'
      : 'Notification Center';

  const subtitleText =
    language === 'tr'
      ? 'Bakım gecikmeleri, yaklaşan vadeler ve operasyonel sistem bildirimleri (Belgrad Saati)'
      : language === 'sr'
      ? 'Upozorenja o održavanju, rokovi registracije i operativna obaveštenja (Vreme: Beograd)'
      : 'Maintenance delays, upcoming due dates, and operational alerts (Belgrade Time)';

  const markAllReadText =
    language === 'tr'
      ? 'Tümünü Okundu İşaretle'
      : language === 'sr'
      ? 'Označi sve kao pročitano'
      : 'Mark All as Read';

  const clearAllText =
    language === 'tr'
      ? 'Tümünü Temizle'
      : language === 'sr'
      ? 'Obriši sve'
      : 'Clear All';

  const emptyTitle =
    language === 'tr'
      ? 'Hiç bildirim yok'
      : language === 'sr'
      ? 'Nema novih obaveštenja'
      : 'No notifications';

  const emptyDesc =
    language === 'tr'
      ? 'Sisteminizde şu an için bekleyen acil bildirim bulunmuyor.'
      : language === 'sr'
      ? 'Trenutno nema aktivnih operativnih obaveštenja u vašem sistemu.'
      : 'There are currently no urgent pending notifications in your system.';

  return (
    <AppLayout currentUser={currentUser}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            {titleText}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {subtitleText}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{markAllReadText}</span>
              </button>
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{clearAllText}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'tr' ? 'Bildirimler yükleniyor...' : language === 'sr' ? 'Učitavanje obaveštenja...' : 'Loading notifications...'}
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <Bell className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{emptyTitle}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{emptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-80'
                  : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/50 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900/30'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500 font-mono flex-wrap">
                    <span>{formatDateTime(n.createdAt)}</span>
                    {n.link && (
                      <Link
                        href={n.link}
                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                      >
                        {language === 'tr' ? 'İlgili Kayda Git →' : language === 'sr' ? 'Idi na detalje →' : 'View Record →'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/50 cursor-pointer"
                  >
                    {language === 'tr' ? 'Okundu' : language === 'sr' ? 'Pročitano' : 'Read'}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  title={language === 'tr' ? 'Sil' : language === 'sr' ? 'Obriši' : 'Delete'}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
