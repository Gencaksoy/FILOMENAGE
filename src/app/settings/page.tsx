'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Building, BellRing, Check, ShieldAlert, Lock, KeyRound } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthUser } from '@/lib/auth-client';
import { useLanguage } from '@/lib/i18n';

export default function SettingsPage() {
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    company_name: 'Filo Yönetim Paneli',
    company_phone: '+381 617 027 504',
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
      setPwdError(
        language === 'sr'
          ? 'Nova lozinka mora imati najmanje 6 karaktera.'
          : language === 'en'
          ? 'New password must be at least 6 characters.'
          : 'Yeni şifre en az 6 karakter olmalıdır.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError(
        language === 'sr'
          ? 'Nove lozinke se ne podudaraju.'
          : language === 'en'
          ? 'New passwords do not match.'
          : 'Yeni şifreler birbiriyle uyuşmuyor.'
      );
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
        setPwdSuccess(
          language === 'sr'
            ? 'Vaša lozinka za prijavu je uspešno promenjena!'
            : language === 'en'
            ? 'Your login password has been successfully updated!'
            : 'Giriş şifreniz başarıyla güncellendi!'
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwdSuccess(null), 4000);
      } else {
        setPwdError(data.error || (language === 'sr' ? 'Promena lozinke nije uspela.' : language === 'en' ? 'Failed to update password.' : 'Şifre değiştirilemedi.'));
      }
    } catch (err: any) {
      setPwdError(err.message || (language === 'sr' ? 'Greška u vezi.' : language === 'en' ? 'Connection error.' : 'Bağlantı hatası.'));
    } finally {
      setPwdLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 401) window.location.href = '/login';
        return null;
      })
      .then((u) => {
        if (u?.user) setCurrentUser(u.user);
      })
      .catch(() => {});

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
      alert(
        language === 'sr'
          ? 'Osoblje nema dozvolu za izmenu naziva firme ili sistemskih podešavanja.'
          : language === 'en'
          ? 'Staff members do not have permission to modify company name or system settings.'
          : 'Çalışanların şirket adını veya sistem ayarlarını değiştirme yetkisi yoktur.'
      );
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
        alert(err.error || (language === 'sr' ? 'Podešavanja nisu sačuvana.' : language === 'en' ? 'Settings could not be saved.' : 'Ayarlar kaydedilemedi.'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout currentUser={currentUser} adminOnly={true}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            {t.sett_title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.sett_subtitle}
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" />
            {language === 'sr' ? 'Podešavanja su uspešno sačuvana!' : language === 'en' ? 'Settings saved successfully!' : 'Ayarlar Başarıyla Kaydedildi!'}
          </div>
        )}
      </div>

      {isStaff && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-black">
              {language === 'sr' ? 'Ograničenje Dozvole (Režim Osoblja / STAFF)' : language === 'en' ? 'Permission Restriction (Staff Mode)' : 'Yetki Kısıtlaması (Çalışan / STAFF Modu)'}
            </div>
            <div className="text-xs text-amber-800 dark:text-amber-300">
              {language === 'sr'
                ? 'Naziv firme i parametre sistema mogu menjati samo administratori i ortaci flote. Osoblje nema ovlašćenje za izmenu ovih podešavanja.'
                : language === 'en'
                ? 'Company name and system parameters can only be modified by fleet administrators and partners. Staff does not have permission to edit these settings.'
                : 'Şirket adını ve sistem parametrelerini yalnızca yöneticiler ve şirket ortakları değiştirebilir. Çalışanların bu ayarları düzenleme yetkisi yoktur.'}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Şirket Bilgileri */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Building className="w-4 h-4 text-amber-500" />
            {t.sett_general_title}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.sett_company_name}
              </label>
              <input
                type="text"
                disabled={isStaff}
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-500 font-bold"
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                {language === 'sr'
                  ? 'Ovaj naziv se prikazuje u WhatsApp obaveštenjima klijentima i u zaglavlju.'
                  : language === 'en'
                  ? 'This name appears in WhatsApp notifications sent to customers and in the header.'
                  : 'Bu isim müşterilere giden WhatsApp bildirimlerinde ve başlıkta görünür.'}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.sett_phone}
              </label>
              <input
                type="text"
                disabled={isStaff}
                value={settings.company_phone}
                onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.sett_email}
              </label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.sett_currency}
              </label>
              <select
                value={settings.default_currency}
                onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:border-amber-500"
              >
                <option value="EUR">EUR (€) - {language === 'sr' ? 'Beograd Operacije' : language === 'en' ? 'Belgrade Operations' : 'Sırbistan Operasyonu'}</option>
                <option value="USD">USD ($)</option>
                <option value="RSD">RSD ({language === 'sr' ? 'Dinar' : language === 'en' ? 'Dinar' : 'Dinar'})</option>
                <option value="TRY">TRY (₺)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bakım ve Muayene Döngüleri */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <BellRing className="w-4 h-4 text-amber-500" />
            {language === 'sr' ? 'Parametri Podsetnika za Servis i Registraciju' : language === 'en' ? 'Maintenance & Registration Alert Parameters' : 'Bakım ve Muayene Hatırlatma Parametreleri'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            {language === 'sr' ? 'Automatski obračun i periodi upozorenja za servise i registraciju vozila' : language === 'en' ? 'Automated calculation and alert cycles for vehicle maintenance and inspection' : 'Sistemde araç bakım ve muayene tarihlerinin otomatik hesaplanma ve uyarı periyotları'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-2">
                {language === 'sr' ? 'Ciklus Redovnog Održavanja' : language === 'en' ? 'Periodic Maintenance Cycle' : 'Periyodik Bakım Döngüsü'}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                {language === 'sr'
                  ? 'Od datuma preuzimanja/servisa do sledećeg redovnog servisa (Tačno 1 Mesec).'
                  : language === 'en'
                  ? 'From vehicle delivery/service date to next service (Exactly 1 Month).'
                  : 'Araç teslim/bakım tarihinden itibaren sonraki periyodik bakım (Tam 1 Ay).'}
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'sr' ? 'Interval Održavanja (Meseci):' : language === 'en' ? 'Maintenance Interval (Months):' : 'Bakım Aralığı (Ay):'}
                </label>
                <input
                  type="text"
                  disabled
                  value={language === 'sr' ? '1 Mesec (Fiksni Ciklus)' : language === 'en' ? '1 Month (Fixed Cycle)' : '1 Ay (Sabit Döngü)'}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 rounded-xl font-mono font-bold text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block mb-2">
                {language === 'sr' ? 'Tehnički Pregled i Registracija (Srbija)' : language === 'en' ? 'Annual Inspection & Registracija (Serbia)' : 'Sırbistan Tehnicki Pregled (Yıllık Muayene)'}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                {language === 'sr'
                  ? 'Od datuma tehničkog pregleda do sledeće registracije (Srbija zakon: 1 godišnje).'
                  : language === 'en'
                  ? 'From inspection date to next registration cycle (Once a year mandatory in Serbia).'
                  : 'Araç muayene tarihinden itibaren bir sonraki muayene periyodu (Senede 1 kez).'}
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'sr' ? 'Interval Registracije (Godina):' : language === 'en' ? 'Inspection Interval (Years):' : 'Muayene Aralığı (Yıl):'}
                </label>
                <input
                  type="text"
                  disabled
                  value={language === 'sr' ? '1 Godina (Obavezno Godišnje)' : language === 'en' ? '1 Year (Annual Mandatory)' : '1 Yıl (Yıllık Zorunlu)'}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700/60 rounded-xl font-mono font-bold text-slate-700 dark:text-slate-200"
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
            {isStaff
              ? (language === 'sr' ? 'Nema Dozvole (Samo Administrator)' : language === 'en' ? 'No Permission (Admin Only)' : 'Yetki Yok (Yalnızca Yönetici Kaydedebilir)')
              : t.sett_btn_save}
          </button>
        </div>
      </form>

      {/* ŞİFRE DEĞİŞTİRME FORMU */}
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <KeyRound className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-black text-slate-900 dark:text-white">{t.sett_security_title}</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {language === 'sr'
            ? 'Ovde možete ažurirati lozinku koju koristite za prijavu na sistem.'
            : language === 'en'
            ? 'You can update the password you use to sign in here.'
            : 'Sisteme giriş yaparken kullandığınız şifrenizi buradan güncelleyebilirsiniz.'}
        </p>

        {pwdSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {pwdSuccess}
          </div>
        )}

        {pwdError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            {pwdError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.sett_current_pwd}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.sett_new_pwd}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={language === 'sr' ? 'Najmanje 6 karaktera' : language === 'en' ? 'At least 6 characters' : 'En az 6 karakter'}
              required
              minLength={6}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.sett_confirm_pwd}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={language === 'sr' ? 'Ponovite novu lozinku' : language === 'en' ? 'Repeat new password' : 'Şifreyi tekrar yazın'}
              required
              minLength={6}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={pwdLoading}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {pwdLoading
                  ? (language === 'sr' ? 'Ažuriranje...' : language === 'en' ? 'Updating...' : 'Güncelleniyor...')
                  : (language === 'sr' ? 'Ažuriraj Lozinku' : language === 'en' ? 'Update Password' : 'Şifreyi Güncelle')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
