'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Wrench,
  Droplet,
  FileCheck2,
  Users,
  BarChart3,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  Sparkles,
  Smartphone,
  Lock,
  Layers,
  ChevronRight,
  Check,
  XCircle,
} from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/lib/i18n';

export function LandingPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [fleetCodeInput, setFleetCodeInput] = useState('');

  const handleFleetCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fleetCodeInput.trim()) {
      router.push(`/register?code=${encodeURIComponent(fleetCodeInput.trim().toUpperCase())}`);
    } else {
      router.push('/register');
    }
  };

  const waNumber = '381617027504';
  const waDisplayPhone = '+381 617 027 504';
  const waBuyUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    language === 'tr'
      ? 'Merhaba, Filo Yönetim Sistemi için filo kodu satın almak ve detaylı bilgi edinmek istiyorum.'
      : language === 'sr'
      ? 'Zdravo, želim da kupim kod flote i dobijem više informacija o SaaS sistemu za upravljanje flotom.'
      : 'Hello, I would like to purchase a Fleet Code and get more information regarding the Fleet Management SaaS.'
  )}`;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-amber-500 selection:text-slate-950">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
              <img src="/icon.png" alt="Filo Yönetim" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <span className="text-sm sm:text-lg font-black tracking-wider text-slate-900 dark:text-white truncate block">
                FİLO YÖNETİM
              </span>
              <span className="hidden xs:block text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest truncate">
                {t.landing_hero_badge}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">
            <a href="#ozellikler" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              {t.landing_features}
            </a>
            <a href="#avantajlar" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              {t.landing_advantages}
            </a>
            <a href="#nasil-calisir" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              {t.landing_how_it_works}
            </a>
            <a href="#fiyatlandirma" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              {t.landing_pricing}
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <ThemeToggle variant="landing" />
            <LanguageSelector variant="landing" />

            <Link
              href="/login"
              className="hidden md:inline-flex px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-300 dark:border-slate-700"
            >
              {t.auth_login}
            </Link>
            <Link
              href="/register"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1 sm:gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t.auth_register}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.landing_hero_badge}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-tight sm:leading-none">
              {t.landing_hero_title_1}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-200">
                {t.landing_hero_title_2}
              </span>
            </h1>

            <p className="mt-6 text-sm sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              {t.landing_hero_desc}
            </p>

            {/* Quick Fleet Code Registration Form */}
            <div className="mt-10 p-2 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl mx-auto backdrop-blur-md">
              <form onSubmit={handleFleetCodeSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fleetCodeInput}
                    onChange={(e) => setFleetCodeInput(e.target.value.toUpperCase())}
                    placeholder={t.landing_fleet_code_placeholder}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm tracking-wider uppercase focus:outline-hidden focus:border-amber-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>{t.landing_verify_btn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <div className="mt-2 text-left px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <a
                  href={waBuyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t.landing_hero_cta_buy} ({waDisplayPhone})</span>
                </a>
                <Link href="/login" className="text-slate-600 dark:text-slate-400 hover:underline">
                  {language === 'tr' ? 'Zaten üye misiniz? Giriş Yapın →' : language === 'sr' ? 'Već imate nalog? Prijavite se →' : 'Already have an account? Sign In →'}
                </Link>
              </div>
            </div>

            {/* Quick Feature Badges */}
            <div className="mt-10 sm:mt-12 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-left">
              <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 truncate">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">Belgrad eDPK</span>
                  <span className="text-[10px] text-slate-500 block truncate">Parking Servis</span>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0 truncate">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">Registracija</span>
                  <span className="text-[10px] text-slate-500 block truncate">{language === 'sr' ? 'TÜV i Pregled' : 'TÜV & Muayene'}</span>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Droplet className="w-4 h-4" />
                </div>
                <div className="min-w-0 truncate">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{t.nav_maintenance}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{language === 'sr' ? 'Servisni interval' : 'Periyot & Maliyet'}</span>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="min-w-0 truncate">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{t.kpi_net_profit}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{language === 'sr' ? 'Transparentna kasa' : 'Şeffaf Ortak Kasası'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STATS STRIP */}
      <section className="py-12 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
                {t.landing_stat_1_val}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                {t.landing_stat_1_lbl}
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                {t.landing_stat_2_val}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                {t.landing_stat_2_lbl}
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">
                {t.landing_stat_3_val}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                {t.landing_stat_3_lbl}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPARISON MATRIX (Filorapor Style) */}
      <section id="avantajlar" className="py-20 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t.landing_advantages}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 dark:text-white mt-2">
              {t.landing_comparison_title}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.landing_comparison_subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Eski Yöntemler */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-sm relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold mb-6">
                <XCircle className="w-4 h-4" />
                <span>{t.landing_comparison_old}</span>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{language === 'sr' ? 'Zaboravljeni datumi registracije i saobraćajne kazne' : 'Unutulan registracija süreleri yüzünden araçların bağlanması ve ağır cezalar'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{language === 'sr' ? 'Neplaćene parking kazne koje gube 50% popusta' : 'Belgrad Parking Servis cezalarının geç fark edilmesi ve %50 indirimin kaçırılması'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{language === 'sr' ? 'Sporenja između partnera o prihodima i troškovima' : 'Ortaklar arasında hangi aracın ne kadar masraf çıkardığı konusunda tartışmalar'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{language === 'sr' ? 'Nejasan pregled preuzetih i vraćenih vozila' : 'Hasar ve teslimat fotoğraflarının WhatsApp sohbetlerinde kaybolması'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{language === 'sr' ? 'Netačni proračuni kursa dinar / euro i kašnjenja servisa' : 'Dinar ve Euro kurlarının manuel hesaplanırken karışması ve yanlış kayıtlar'}</span>
                </li>
              </ul>
            </div>

            {/* Modern Filo Platformu */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500 dark:border-emerald-500/80 shadow-lg shadow-emerald-500/10 relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-6">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.landing_comparison_new}</span>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{language === 'sr' ? 'Automatska upozorenja 15 dana pre isteka registracije' : 'Registracija bitimine 15 gün kala otomatik renkli alarmlar ve WhatsApp bildirimleri'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{language === 'sr' ? 'Integracija sa Parking Servisom Beograd i jednim klikom WhatsApp slanje' : 'Tek tıkla eDPK sorgusu ve müşteriye hazır %50 indirim süresi şablonlu WhatsApp bildirimi'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{language === 'sr' ? 'Zasebna kasa za svakog partnera i transparentan ROI' : 'Her ortağın kendi araçları için ayrı yatırım, masraf ve net kârlılık takibi'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{language === 'sr' ? 'Čuvanje 4 fotografije primopredaje i kontrolna lista' : 'Ön, arka, sağ, sol fotoğraflar ve teslimat aksesuar kontrol listesi'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{language === 'sr' ? 'Automatska konverzija RSD / EUR (1 EUR = 117 RSD) i Beograd vreme' : 'Sabit kur (1 EUR = 117 RSD) ve Sırbistan saatine göre hatasız finansal hesaplama'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. NASIL ÇALIŞIR? (HOW IT WORKS) */}
      <section id="nasil-calisir" className="py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {language === 'sr' ? '3 Jednostavna Koraka' : '3 Kolay Adım'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 dark:text-white mt-2">
              {language === 'sr' ? 'Kako Početi sa Radom?' : 'Sisteme Nasıl Kayıt Olunur?'}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'sr'
                ? 'Flota se postavlja od strane SaaS administratora radi bezbednosti i kontrole modula.'
                : 'Filonuzun açılması ve yetkilerinin atanması SaaS yöneticisi tarafından sağlanır.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
                1
              </div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">
                {language === 'sr' ? 'Kontaktirajte Nas za Kod Flote' : 'Filo Kodu Satın Alın & Tanımlayın'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'sr'
                  ? 'Javite se SaaS menadžeru preko WhatsApp-a (+381 617 027 504) i dobijte svoj jedinstveni kod flote.'
                  : 'SaaS yöneticisi ile iletişime geçerek filonuz için benzersiz filo kodunuzu temin edin.'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
                2
              </div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">
                {language === 'sr' ? 'Registrujte se uz Kod Flote' : 'Filo Kodu İle Kayıt Olun'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'sr'
                  ? 'Unesite naziv firme, email adresu i dobijeni kod flote na stranici za registraciju.'
                  : 'Kayıt sayfamıza giderek şirket yetkilisi adı, güvenli e-posta adresiniz ve size iletilen Filo Kodunu girin.'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
                3
              </div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">
                {language === 'sr' ? 'Prijavite se i Upravljajte' : 'Giriş Yapın & Profesyonelce Yönetin'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'sr'
                  ? 'Prijavite se i pratite vozila, tehničke preglede, troškove i ugovore bezbedno i tačno.'
                  : 'Oturum açtığınızda firmanıza tahsis edilen modülleri görürsünüz. Araçlarınızı ve personelinizi yönetin.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PAKETLER & FİYATLANDIRMA (PRICING) */}
      <section id="fiyatlandirma" className="py-20 border-b border-slate-200 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t.landing_pricing}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 dark:text-white mt-2">
              {t.landing_pricing_title}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.landing_pricing_subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t.landing_pricing_starter}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Starter</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">1 - 10</span>
                  <span className="text-xs text-slate-500 ml-1.5">{language === 'sr' ? 'Vozila' : 'Araç'}</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t.nav_vehicles} & {t.nav_customers}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t.nav_maintenance}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t.alert_registration_expiring}</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 dark:text-slate-600">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Belgrade Parking Servis (eDPK)</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <a
                  href={waBuyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.landing_pricing_btn}</span>
                </a>
              </div>
            </div>

            {/* Pro - Featured */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500 flex flex-col justify-between relative shadow-xl shadow-amber-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                {language === 'sr' ? 'Najpopularniji' : 'En Çok Tercih Edilen'}
              </div>
              <div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {t.landing_pricing_pro}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Pro Filo</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">10 - 30</span>
                  <span className="text-xs text-slate-500 ml-1.5">{language === 'sr' ? 'Vozila' : 'Araç'}</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{language === 'sr' ? 'Sve iz Starter paketa' : 'Tüm Starter Özellikleri'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Belgrade Parking Servis (eDPK)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{language === 'sr' ? 'Foto zapisi primopredaje i ugovori' : '4 Açılı Fotoğraflı Teslimat Formu'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{t.kpi_net_profit} & ROI</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <a
                  href={waBuyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/25 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.landing_pricing_btn}</span>
                </a>
              </div>
            </div>

            {/* Enterprise */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t.landing_pricing_enterprise}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Enterprise</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">30+</span>
                  <span className="text-xs text-slate-500 ml-1.5">{language === 'sr' ? 'Neograničeno' : 'Sınırsız Kapasite'}</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{language === 'sr' ? 'Neograničena vozila i nalozi' : 'Sınırsız Araç ve Kullanıcı Kotası'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{language === 'sr' ? 'Svi SaaS moduli uključeni' : 'Tüm SaaS Modülleri Aktif'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t.nav_audit_logs}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{language === 'sr' ? 'Direktna tehnička podrška 24/7' : 'Özel SaaS Yöneticisi Desteği'}</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <a
                  href={waBuyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.landing_pricing_btn}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CONTACT BANNER */}
      <section className="py-16 bg-amber-500 text-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            {t.landing_contact_title}
          </h2>
          <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto font-medium opacity-90">
            {t.landing_contact_desc}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={waBuyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-sm rounded-2xl shadow-xl transition-all"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>{t.landing_contact_whatsapp}</span>
            </a>
            <a
              href={`tel:+${waNumber}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/90 hover:bg-white text-slate-950 font-bold text-sm rounded-2xl shadow-md transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{waDisplayPhone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="py-12 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-0.5 flex items-center justify-center">
              <img src="/icon.png" alt="Filo Yönetim" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white">FİLO YÖNETİM SİSTEMİ</span>
              <span className="block text-[10px] text-slate-400">Beograd & Balkanlar</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-6 text-center">
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {t.auth_login}
            </Link>
            <Link href="/register" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-bold">
              {t.auth_register}
            </Link>
            <a
              href={waBuyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp: {waDisplayPhone}</span>
            </a>
          </div>

          <div>
            © {new Date().getFullYear()} Filo Yönetim. {t.landing_footer_rights}
          </div>
        </div>
      </footer>
    </div>
  );
}
