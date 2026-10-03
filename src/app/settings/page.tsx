'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Building, BellRing, Check, ShieldAlert, Lock, KeyRound } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthUser } from '@/lib/auth-client';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    company_name: 'Filo Yönetim Paneli',
    company_phone: '+381 11 123 4567',
    company_email: 'operasyon@belgradfilo.com',
    default_currency: 'EUR',
    warn_days_yellow: '7',
    warn_days_orange: '3',
    maintenance_interval_months: '1',
    inspection_interval_years: '1',
  });

  const isStaff = currentUser?.role === 'STAFF';

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (newPassword.length < 6) {
      setPwdError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('Yeni şifreler birbiriyle uyuşmuyor.');
      return;
    }

    try {
      setPwdLoading(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdSuccess('Giriş şifreniz başarıyla güncellendi!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwdSuccess(null), 4000);
      } else {
        setPwdError(data.error || 'Şifre değiştirilemedi.');
      }
    } catch (err: any) {
      setPwdError(err.message || 'Bağlantı hatası.');
    } finally {
      setPwdLoading(false);
    }
  };

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
    if (isStaff) {
      alert('Çalışanların şirket adını veya sistem ayarlarını değiştirme yetkisi yoktur.');
      return;
    }
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
        const err = await res.json();
        alert(err.error || 'Ayarlar kaydedilemedi.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout currentUser={currentUser} adminOnly={true}>
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

      {isStaff && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="text-xs font-black">Yetki Kısıtlaması (Çalışan / STAFF Modu)</div>
            <div className="text-xs text-amber-800">
              Şirket adını ve sistem parametrelerini yalnızca yöneticiler ve şirket ortakları değiştirebilir. Çalışanların bu ayarları düzenleme yetkisi yoktur.
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Şirket Bilgileri */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-amber-500" />
            Kurumsal Bilgiler & Para Birimi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Şirket / Filo Ünvanı</label>
              <input
                type="text"
                disabled={isStaff}
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 disabled:bg-slate-100 disabled:text-slate-500 font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Bu isim müşterilere giden WhatsApp bildirimlerinde ve başlıkta görünür.
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">İletişim Telefonu (Sırbistan)</label>
              <input
                type="text"
                disabled={isStaff}
                value={settings.company_phone}
                onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:border-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
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
            disabled={isStaff}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isStaff ? 'Yetki Yok (Yalnızca Yönetici Kaydedebilir)' : 'Ayarları Kaydet'}
          </button>
        </div>
      </form>

      {/* ŞİFRE DEĞİŞTİRME FORMU */}
      <div className="mt-8 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
          <KeyRound className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-black text-slate-900">Hesap Güvenliği & Şifre Değiştir</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Sisteme giriş yaparken kullandığınız şifrenizi buradan güncelleyebilirsiniz.
        </p>

        {pwdSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600" />
            {pwdSuccess}
          </div>
        )}

        {pwdError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            {pwdError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mevcut Şifre</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Yeni Şifre</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="En az 6 karakter"
              required
              minLength={6}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Yeni Şifre Tekrar</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifreyi tekrar yazın"
              required
              minLength={6}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={pwdLoading}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{pwdLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
