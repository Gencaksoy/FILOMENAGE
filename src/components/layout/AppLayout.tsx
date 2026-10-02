'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AuthUser } from '@/lib/auth';
import { triggerNotificationAlertOnce } from '@/lib/soundAlert';
import { ShieldAlert, PhoneCall, MessageSquare } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  currentUser: AuthUser | null;
  unreadCount?: number;
}

export function AppLayout({ children, currentUser, unreadCount: initialUnreadCount = 0 }: AppLayoutProps) {
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

            // Play chime if there are unread notifications and haven't chimed this session yet
            if (count > 0 && !chimeTriggeredRef.current) {
              const lastChimedSession = sessionStorage.getItem('filo_last_chime_time');
              const now = Date.now();
              // Chime if not chimed in the last 15 minutes in this browser session
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

    // Check periodically every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadCount={liveUnreadCount}
        userRole={currentUser?.role}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentUser={currentUser}
          unreadCount={liveUnreadCount}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
          {currentUser?.fleetStatus && currentUser.fleetStatus !== 'ACTIVE' && currentUser.role !== 'SUPER_ADMIN' && (
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
                    href="tel:+381111234567"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <PhoneCall className="w-4 h-4 text-rose-600" />
                    <span>Yetkiliyi Ara</span>
                  </a>
                  <a
                    href="https://wa.me/381659988771?text=Merhaba,%20filo%20lisans%20yenileme%20hakkında%20bilgi%20almak%20istiyorum."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Ödemeyi Yenile (WhatsApp)</span>
                  </a>
                </div>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
