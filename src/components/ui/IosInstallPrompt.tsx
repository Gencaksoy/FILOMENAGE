'use client';

import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone, ArrowDown } from 'lucide-react';

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Sadece tarayıcıda çalıştır
    if (typeof window === 'undefined') return;

    // Zaten ana ekrandan açılmışsa (standalone mod) gösterme
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Daha önce kapatıldıysa 3 gün boyunca tekrar rahatsız etme
    const dismissedAt = localStorage.getItem('ios_install_dismissed_at');
    if (dismissedAt) {
      const daysPassed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 3) return;
    }

    // iOS cihaz tespiti (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isAppleDevice) {
      setIsIos(true);
      // Sayfa yüklendikten 1.5 saniye sonra göster
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios_install_dismissed_at', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl p-4 shadow-2xl border border-slate-700/80">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 shrink-0">
              <span className="text-xs font-black tracking-tighter">FİLO</span>
            </div>
            <div>
              <div className="text-sm font-extrabold text-white leading-tight">
                Ana Ekrana Uygulama Olarak Ekle
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Safari'den tam ekran uygulama gibi kullanın
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
              1
            </span>
            <span>
              Safari'nin alt menüsündeki <strong>Paylaş</strong> simgesine (
              <Share className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" />
              ) dokunun.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
              2
            </span>
            <span>
              Aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> (
              <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-0.5" />
              ) seçeneğine basın.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
              3
            </span>
            <span>
              Sağ üstteki <strong>"Ekle"</strong> butonuna basarak logomuzla uygulamayı yükleyin.
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-end">
          <button
            onClick={handleDismiss}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}
