import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Filo Yönetim | Profesyonel Filo ve Araç Takip Paneli',
  description: 'Filo Yönetim - Araç Kiralama, Registracija / Muayene, Bakım, Masraf ve Amortisman Takip Sistemi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="antialiased font-sans bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
