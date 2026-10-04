'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AuthUser, isSuperAdmin } from '@/lib/auth-client';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { triggerNotificationAlertOnce } from '@/lib/soundAlert';
import {
  ShieldAlert,
  PhoneCall,
  MessageSquare,
  Lock,
  ArrowLeft,
  Home,
  AlertTriangle,
  FolderLock,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  currentUser: AuthUser | null;
  unreadCount?: number;
  requiredFeature?: string | string[];
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const FEATURE_NAMES: Record<string, string> = {
  vehicles: 'Araç Yönetimi & Envanter',
  excelImport: 'AI Excel Aktarım & Veri Entegrasyonu',
  rentals: 'Kiralama & Teslimat Takibi',
  customers: 'Müşteri & Belge Yönetimi',
  maintenance: 'Periyodik Bakım & Onarım',
  oilChange: 'Motor Yağı Takibi',
  inspection: 'Yıllık Muayene & Registracija',
  parkingTickets: 'Park Cezaları (eDPK)',
  faults: 'Hasar & Arıza Takibi',
  finance: 'Finansal Analiz & Kasa',
  auditLogs: 'İşlem Geçmişi (Audit)',
};

export function AppLayout({
  children,
  currentUser,
  unreadCount: initialUnreadCount = 0,
  requiredFeature,
  adminOnly = false,
  superAdminOnly = false,
}: AppLayoutProps) {
  const { t, language } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveUnreadCount, setLiveUnreadCount] = useState<number>(initialUnreadCount);
  const chimeTriggeredRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const json = await res.json();
          const count = json.unreadCount || 0;
          if (isMounted) {
            setLiveUnreadCount(count);

            // Play chime if unread notifications exist and not chimed recently
            if (count > 0 && !chimeTriggeredRef.current) {
              const lastChimedSession = sessionStorage.getItem('filo_last_chime_time');
              const now = Date.now();
              if (!lastChimedSession || now - parseInt(lastChimedSession, 10) > 15 * 60 * 1000) {
                chimeTriggeredRef.current = true;
                sessionStorage.setItem('filo_last_chime_time', now.toString());
                triggerNotificationAlertOnce();
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load notifications in AppLayout:', err);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const { user: authUser } = useAuth();
  const effectiveUser = currentUser || authUser;

  const isSuper = isSuperAdmin(effectiveUser);
  const isStaff = effectiveUser?.role === 'STAFF';

  // 1. Super Admin Only Kontrolü
  let accessDeniedReason: {
    type: 'superAdmin' | 'adminOnly' | 'featureDisabled';
    title: string;
    description: string;
    featureTitle?: string;
  } | null = null;

  if (superAdminOnly && effectiveUser && !isSuper) {
    accessDeniedReason = {
      type: 'superAdmin',
      title: 'Erişim Engellendi (Süper Yönetici Paneli)',
      description:
        'Bu sayfa yalnızca sistem sahibi (SaaS Süper Yöneticisi) tarafından görüntülenebilir ve işlem yapılabilir.',
    };
  } else if (adminOnly && isStaff) {
    // 2. Staff Admin Kontrolü
    accessDeniedReason = {
      type: 'adminOnly',
      title: 'Yetki Kısıtlaması (Personel / STAFF Modu)',
      description:
        'Bu sayfaya (Kullanıcılar, Ayarlar veya Denetim Kayıtları) yalnızca Filo Yöneticisi (ADMIN) yetkisine sahip kullanıcılar erişebilir. Personel hesaplarının bu bölüme erişim ve işlem izni bulunmamaktadır.',
    };
  } else if (requiredFeature && effectiveUser && !isSuper) {
    // 3. SaaS Özellik / Modül Kontrolü
    const featuresList = Array.isArray(requiredFeature) ? requiredFeature : [requiredFeature];
    const userFeatures = effectiveUser.features || {};

    // En az biri açıksa izin ver (örn: maintenance veya oilChange)
    const hasAnyAllowed = featuresList.some((feat) => userFeatures[feat] !== false);

    if (!hasAnyAllowed) {
      const featNames = featuresList.map((f) => FEATURE_NAMES[f] || f).join(' / ');
      accessDeniedReason = {
        type: 'featureDisabled',
        title: 'Bu Modül Filonuz İçin Devre Dışı Bırakılmıştır',
        featureTitle: featNames,
        description: `SaaS Yöneticisi "${featNames}" özelliğini filonuz için henüz aktifleştirmemiştir. Tarayıcı adres çubuğuna doğrudan URL yazarak veya arama ile bu ekrana erişilemez ve işlem yapılamaz. Modülün açılması için lütfen sistem yöneticinizle iletişime geçiniz.`,
      };
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadCount={liveUnreadCount}
        userRole={effectiveUser?.role}
        currentUser={effectiveUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentUser={effectiveUser}
          unreadCount={liveUnreadCount}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
          {/* Askıya Alınmış Filo Uyarısı */}
          {currentUser?.fleetStatus && currentUser.fleetStatus !== 'ACTIVE' && !isSuper && (
            <div className="mb-6 p-4 sm:p-6 rounded-3xl bg-rose-50 border-2 border-rose-400 text-rose-950 shadow-md animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-200 text-rose-900 border border-rose-300">
                        {currentUser.fleetStatus === 'SUSPENDED' ? 'FİLO ASKIYA ALINDI' : 'LİSANS SÜRESİ DOLDU'}
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-800">
                        Filo: {currentUser.fleetName || 'Filo'} ({currentUser.fleetCode || ''})
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-rose-950 mt-1">
                      Filonuz Askıya Alınmıştır - Lisans / Abonelik Ödemenizi Yenileyiniz
                    </h2>
                    <p className="text-xs sm:text-sm text-rose-900/90 mt-1 leading-relaxed max-w-3xl">
                      Abonelik süresi veya lisans ödemesi yenilenmediği için bu filoya ait yeni araç kiralama, araç ekleme ve operasyonel kayıt işlemleri dondurulmuştur. Mevcut verilerinizi inceleyebilirsiniz. Sistemin tekrar tam aktif edilmesi için lütfen filo yöneticiniz veya sistem yetkilisi ile irtibata geçiniz.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <a
                    href="tel:+381617027504"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <PhoneCall className="w-4 h-4 text-rose-600" />
                    <span>{language === 'sr' ? 'Pozovite Podršku' : language === 'en' ? 'Call Support' : 'Yetkiliyi Ara'}</span>
                  </a>
                  <a
                    href="https://wa.me/381617027504?text=Merhaba,%20filo%20lisans%20yenileme%20hakkında%20bilgi%20almak%20istiyorum."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{language === 'sr' ? 'Obnovi Licencu (WhatsApp)' : language === 'en' ? 'Renew License (WhatsApp)' : 'Ödemeyi Yenile (WhatsApp)'}</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Sayfa Erişim Engeli & Modül Kapalı Ekranı */}
          {accessDeniedReason ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 sm:p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900 text-rose-600 flex items-center justify-center mb-6 shadow-inner">
                {accessDeniedReason.type === 'featureDisabled' ? (
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 dark:text-amber-400" />
                ) : (
                  <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-rose-600 dark:text-rose-400" />
                )}
              </div>

              {accessDeniedReason.featureTitle && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-3">
                  <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>{language === 'sr' ? 'Modul: ' : language === 'en' ? 'Module: ' : 'Modül: '}{accessDeniedReason.featureTitle}</span>
                </div>
              )}

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight max-w-xl">
                {accessDeniedReason.title}
              </h1>

              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
                {accessDeniedReason.description}
              </p>

              {currentUser?.fleetCode && (
                <div className="mt-4 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300">
                  {language === 'sr' ? 'Flota: ' : language === 'en' ? 'Fleet: ' : 'Filo: '}
                  <span className="font-bold text-slate-900 dark:text-white">{currentUser.fleetName}</span> ({currentUser.fleetCode})
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm"
                >
                  <Home className="w-4 h-4" />
                  <span>{language === 'sr' ? 'Nazad na Kontrolnu tablu' : language === 'en' ? 'Back to Dashboard' : 'Dashboard\'a Dön'}</span>
                </Link>

                <a
                  href="https://wa.me/381617027504?text=Merhaba,%20filo%20modül%20erişimi%20ve%20yetkilendirme%20hakkında%20bilgi%20almak%20istiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{language === 'sr' ? 'Kontaktirajte Nas (WhatsApp)' : language === 'en' ? 'Contact Us (WhatsApp)' : 'Bizimle İletişime Geçin (WhatsApp)'}</span>
                </a>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
