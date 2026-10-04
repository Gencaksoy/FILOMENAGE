'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Settings,
  Save,
  Building,
  BellRing,
  Check,
  ShieldAlert,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthUser } from '@/lib/auth-client';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { validatePassword } from '@/lib/validation';
import { TableSkeleton } from '@/components/ui/Skeleton';

function SettingsContent() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'password'>('system');

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
  const isSuper = currentUser?.role === 'SUPER_ADMIN';

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Sync tab with URL search parameter or hash
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'password' || tabParam === 'security' || window.location.hash === '#password') {
      setActiveTab('password');
    } else if (tabParam === 'system' || tabParam === 'general') {
      setActiveTab('system');
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'system' | 'password') => {
    setActiveTab(tab);
    setPwdError(null);
    setPwdSuccess(null);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const pwdValidation = validatePassword(newPassword);
  const isPwdMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (!isSuper && !currentPassword) {
      const msg = language === 'sr'
        ? 'Morate uneti trenutnu lozinku.'
        : language === 'en'
        ? 'Please enter your current password.'
        : 'Lütfen mevcut şifrenizi giriniz.';
      setPwdError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword.length < 6) {
      const msg = language === 'sr'
        ? 'Nova lozinka mora imati najmanje 6 karaktera.'
        : language === 'en'
        ? 'New password must be at least 6 characters.'
        : 'Yeni şifre en az 6 karakter olmalıdır.';
      setPwdError(msg);
      toast.error(msg);
      return;
    }

    if (!pwdValidation.isValid) {
      const msg = language === 'sr'
        ? 'Nova lozinka ne ispunjava sve bezbednosne kriterijume.'
        : language === 'en'
        ? 'New password does not satisfy all security requirements.'
        : pwdValidation.errors.join(' ');
      setPwdError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = language === 'sr'
        ? 'Nove lozinke se ne podudaraju.'
        : language === 'en'
        ? 'New passwords do not match.'
        : 'Yeni şifreler birbiriyle uyuşmuyor.';
      setPwdError(msg);
      toast.error(msg);
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
        const successMsg = language === 'sr'
          ? 'Vaša lozinka za prijavu je uspešno promenjena!'
          : language === 'en'
          ? 'Your login password has been successfully updated!'
          : 'Giriş şifreniz başarıyla güncellendi!';
        setPwdSuccess(successMsg);
        toast.success(successMsg);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwdSuccess(null), 5000);
      } else {
        const errorMsg = data.error || (
          language === 'sr'
            ? 'Promena lozinke nije uspela.'
            : language === 'en'
            ? 'Failed to update password.'
            : 'Şifre değiştirilemedi.'
        );
        setPwdError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || (
        language === 'sr'
          ? 'Greška u vezi.'
          : language === 'en'
          ? 'Connection error.'
          : 'Bağlantı hatası.'
      );
      setPwdError(errorMsg);
      toast.error(errorMsg);
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
      toast.error(
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
        toast.success(
          language === 'sr'
            ? 'Podešavanja su uspešno sačuvana.'
            : language === 'en'
            ? 'Settings saved successfully.'
            : 'Ayarlar başarıyla kaydedildi.'
        );
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await res.json();
        toast.error(err.error || (language === 'sr' ? 'Podešavanja nisu sačuvana.' : language === 'en' ? 'Settings could not be saved.' : 'Ayarlar kaydedilemedi.'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || (language === 'sr' ? 'Greška pri čuvanju.' : language === 'en' ? 'Save error.' : 'Kaydetme hatası.'));
    }
  };

  return (
    <AppLayout currentUser={currentUser} adminOnly={true}>
      {/* Header and Save Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-xl mb-6 border border-slate-200/80 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => handleTabChange('system')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'system'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building className={`w-4 h-4 ${activeTab === 'system' ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>{t.sett_tab_system}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('password')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'password'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <KeyRound className={`w-4 h-4 ${activeTab === 'password' ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>{t.sett_tab_password}</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM & FLEET SETTINGS */}
      {activeTab === 'system' && (
        <>
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
        </>
      )}

      {/* TAB 2: PASSWORD CHANGE VIEW */}
      {activeTab === 'password' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors max-w-3xl">
          <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {t.sett_security_title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'sr'
                  ? 'Ažurirajte lozinku koju koristite za prijavu na sistem.'
                  : language === 'en'
                  ? 'Update the password you use to sign in to your fleet account.'
                  : 'Sisteme giriş yaparken kullandığınız şifrenizi güvenli bir şekilde güncelleyin.'}
              </p>
            </div>
          </div>

          {pwdSuccess && (
            <div className="my-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{pwdSuccess}</span>
            </div>
          )}

          {pwdError && (
            <div className="my-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-5 mt-5">
            {/* Mevcut Şifre */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.sett_current_pwd} {!isSuper && <span className="text-rose-500">*</span>}
                </label>
                {isSuper && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    {language === 'sr' ? '(Opciono za Super Admina)' : language === 'en' ? '(Optional for Super Admin)' : '(Süper Admin için İsteğe Bağlı)'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={language === 'sr' ? 'Unesite trenutnu lozinku' : language === 'en' ? 'Enter current password' : 'Mevcut şifrenizi giriniz'}
                  required={!isSuper}
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  tabIndex={-1}
                >
                  {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Yeni Şifre */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.sett_new_pwd} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={language === 'sr' ? 'Unesite novu sigurnu lozinku' : language === 'en' ? 'Enter new secure password' : 'Yeni güvenli şifrenizi giriniz'}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  tabIndex={-1}
                >
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength checklist */}
              {newPassword && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px] space-y-1.5">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    {t.auth_password_rules}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    <div className={`flex items-center gap-1.5 ${pwdValidation.checklist.minLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {pwdValidation.checklist.minLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 inline-block text-center">○</span>}
                      <span>{t.auth_password_rule_len}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdValidation.checklist.hasUppercase ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {pwdValidation.checklist.hasUppercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 inline-block text-center">○</span>}
                      <span>{t.auth_password_rule_upper}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdValidation.checklist.hasLowercase ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {pwdValidation.checklist.hasLowercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 inline-block text-center">○</span>}
                      <span>{t.auth_password_rule_lower}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdValidation.checklist.hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {pwdValidation.checklist.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 inline-block text-center">○</span>}
                      <span>{t.auth_password_rule_number}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Yeni Şifre Tekrar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.sett_confirm_pwd} <span className="text-rose-500">*</span>
                </label>
                {confirmPassword && (
                  <span className={`text-[11px] font-bold flex items-center gap-1 ${isPwdMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isPwdMatch ? (
                      <>
                        <Check className="w-3 h-3" />
                        {language === 'sr' ? 'Lozinke se podudaraju' : language === 'en' ? 'Passwords match' : 'Şifreler eşleşiyor'}
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        {language === 'sr' ? 'Lozinke se ne podudaraju' : language === 'en' ? 'Passwords do not match' : 'Şifreler eşleşmiyor'}
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={language === 'sr' ? 'Ponovite novu lozinku' : language === 'en' ? 'Repeat new password' : 'Yeni şifrenizi tekrar giriniz'}
                  required
                  minLength={6}
                  className={`w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono ${
                    confirmPassword && !isPwdMatch
                      ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-amber-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  tabIndex={-1}
                >
                  {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={pwdLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {pwdLoading
                    ? (language === 'sr' ? 'Ažuriranje...' : language === 'en' ? 'Updating...' : 'Güncelleniyor...')
                    : (language === 'sr' ? 'Ažuriraj Lozinku' : language === 'en' ? 'Update Password' : 'Şifreyi Güncelle')}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={4} cols={2} />}>
      <SettingsContent />
    </Suspense>
  );
}
