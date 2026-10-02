'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AuthUser } from '@/lib/auth';

interface AppLayoutProps {
  children: React.ReactNode;
  currentUser: AuthUser | null;
  unreadCount?: number;
}

export function AppLayout({ children, currentUser, unreadCount = 0 }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadCount={unreadCount}
        userRole={currentUser?.role}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentUser={currentUser}
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
