'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  title?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt = 'Görsel', title, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!src) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Bar with Title and Actions */}
      <div
        className="w-full max-w-5xl flex items-center justify-between gap-3 text-white mb-3 px-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <ZoomIn className="w-5 h-5 text-amber-400 shrink-0" />
          <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
            {title || alt}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            title="Orijinal boyutta yeni sekmede aç"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Yeni Sekmede Aç</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
            <span>Kapat</span>
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="relative max-w-5xl max-h-[82vh] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/40 border border-white/10 shadow-2xl p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[80vh] max-w-full w-auto h-auto object-contain rounded-xl select-none"
        />
      </div>

      <p className="text-slate-400 text-xs mt-2 hidden sm:block">
        Kapatmak için dış alana veya ESC tuşuna basabilirsiniz.
      </p>
    </div>
  );
}
