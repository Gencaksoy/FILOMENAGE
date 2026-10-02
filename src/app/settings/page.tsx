'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Building, BellRing, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthUser } from '@/lib/auth';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    company_name: 'Filo Yönetim Paneli',
    company_phone: '+381 11 123 4567',
    company_email: 'akif@filoyonetim.com',
    default_currency: 'EUR',
    warn_days_yellow: '7',
    warn_days_orange: '3',
    maintenance_interval_months: '1',
    inspection_interval_years: '1',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((u) => {
        if (u?.user) setCurrentUser(u.user);
        else window.location.href = '/login';
      });

    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Ayarlar kaydedilemedi.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout currentUser={currentUser}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            Sistem ve Operasyon Ayarları
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Belgrad kurumsal bilgileri, EUR para birimi, 1 aylık bakım periyodu ve yıllık muayene parametreleri
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" />
            Ayarlar Başarıyla Kaydedildi!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Şirket Bilgileri */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-amber-500" />
            Kurumsal Bilgiler & Para Birimi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Şirket Ünvanı</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">İletişim Telefonu (Sırbistan)</label>
              <input
                type="text"
                value={settings.company_phone}
                onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Operasyon E-postası</label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Varsayılan Para Birimi</label>
              <select
                value={settings.default_currency}
                onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-amber-500"
              >
                <option value="EUR">EUR (€) - Sırbistan Operasyonu</option>
                <option value="USD">USD ($)</option>
                <option value="RSD">RSD (Dinar)</option>
                <option value="TRY">TRY (₺)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bakım ve Muayene Döngüleri */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
            <BellRing className="w-4 h-4 text-amber-500" />
            Bakım ve Muayene Hatırlatma Parametreleri
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Sistemde araç bakım ve muayene tarihlerinin otomatik hesaplanma ve uyarı periyotları
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
              <span className="text-xs font-bold text-amber-900 block mb-2">Periyodik Bakım Döngüsü</span>
              <p className="text-xs text-slate-600 mb-3">
                Araç teslim/bakım tarihinden itibaren sonraki periyodik bakım (Tam 1 Ay).
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bakım Aralığı (Ay):
                </label>
                <input
                  type="text"
                  disabled
                  value="1 Ay (Sabit Döngü)"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl font-mono font-bold text-slate-700"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200">
              <span className="text-xs font-bold text-purple-900 block mb-2">Sırbistan Tehnicki Pregled (Yıllık Muayene)</span>
              <p className="text-xs text-slate-600 mb-3">
                Araç muayene tarihinden itibaren bir sonraki muayene periyodu (Senede 1 kez).
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Muayene Aralığı (Yıl):
                </label>
                <input
                  type="text"
                  disabled
                  value="1 Yıl (Yıllık Zorunlu)"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-purple-300 rounded-xl font-mono font-bold text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            Ayarları Kaydet
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
