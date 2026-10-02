'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AuthUser } from '@/lib/auth';
import { triggerNotificationAlertOnce } from '@/lib/soundAlert';

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
          {children}
        </main>
      </div>
    </div>
  );
}
