import type { Metadata, Viewport } from 'next';
import './globals.css';
import { IosInstallPrompt } from '@/components/ui/IosInstallPrompt';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: 'Filo Yönetim | Profesyonel Filo ve Araç Takip Paneli',
  description: 'Filo Yönetim - Araç Kiralama, Registracija / Muayene, Bakım, Masraf ve Amortisman Takip Sistemi',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Filo Yönetim',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon-precomposed.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Filo Yönetim" />
      </head>
      <body className="antialiased font-sans bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-slate-950">
        {children}
        <IosInstallPrompt />
      </body>
    </html>
  );
}
