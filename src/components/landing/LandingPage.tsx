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

export function LandingPage() {
  const router = useRouter();
  const [fleetCodeInput, setFleetCodeInput] = useState('');

  const handleFleetCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fleetCodeInput.trim()) {
      router.push(`/register?code=${encodeURIComponent(fleetCodeInput.trim().toUpperCase())}`);
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <img src="/icon.png" alt="Filo Yönetim" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white">FİLO YÖNETİM</span>
              <span className="block text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                Takip & Operasyon SaaS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#ozellikler" className="hover:text-amber-400 transition-colors">
              Özellikler
            </a>
            <a href="#avantajlar" className="hover:text-amber-400 transition-colors">
              Avantajlar
            </a>
            <a href="#nasil-calisir" className="hover:text-amber-400 transition-colors">
              Nasıl Çalışır?
            </a>
            <a href="#fiyatlandirma" className="hover:text-amber-400 transition-colors">
              Paketler & Fiyatlandırma
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle variant="landing" />
            <LanguageSelector variant="landing" />

            <Link
              href="/login"
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-700"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-2 text-xs sm:text-sm font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4" />
              <span>Filo Koduyla Kayıt Ol</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 overflow-hidden border-b border-slate-850">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sırbistan & Balkanlar İçin Özelleştirilmiş Filo Platformu</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none">
              Filo Operasyonlarınızı, Muayeneleri ve Cezaları{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                Tek Merkezden Yönetin
              </span>
            </h1>

            <p className="mt-6 text-sm sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Registracija muayene takvimi, Belgrad Parking Servis (eDPK) park cezası entegrasyonu, teslimat öncesi 4 açılı fotoğraflama, araç amortismanı ve anlık ortaklık kasasını tek çatı altında birleştirin.
            </p>

            {/* Quick Fleet Code Registration Form */}
            <div className="mt-10 p-2 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl max-w-xl mx-auto backdrop-blur-md">
              <form onSubmit={handleFleetCodeSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fleetCodeInput}
                    onChange={(e) => setFleetCodeInput(e.target.value.toUpperCase())}
                    placeholder="Filo Kodunuzu Girin (Örn: FL-7085)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm tracking-wider uppercase focus:outline-hidden focus:border-amber-400 transition-all placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>Kayıt Ol & Başla</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <div className="mt-2 text-left px-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>* SaaS Yöneticisi tarafından size iletilen lisans kodudur.</span>
                <Link href="/login" className="text-amber-400 hover:underline font-semibold">
                  Zaten üye misiniz? Giriş Yapın →
                </Link>
              </div>
            </div>

            {/* Quick Feature Badges */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">eDPK Park Cezaları</div>
                  <div className="text-[10px] text-slate-400">Otomatik ceza sorgulama</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">Registracija & Muayene</div>
                  <div className="text-[10px] text-slate-400">WhatsApp hatırlatıcıları</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">Amortisman & Kasa</div>
                  <div className="text-[10px] text-slate-400">Canlı net kar hesabı</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">PWA Mobil Uyum</div>
                  <div className="text-[10px] text-slate-400">Telefona doğrudan kurulum</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NE İŞE YARAR & MODÜLLER (FEATURES) */}
      <section id="ozellikler" className="py-20 bg-slate-900/50 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Kapsamlı Çözümler</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
              Filo Yönetimi Ne İşe Yarar?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Her araç kiralama şirketinin günlük operasyonda yaşadığı takip karmaşasını tek bir güvenli SaaS panelinde çözer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Araç Envanteri & Kilometre Takibi</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Her aracın plakası, şasi ve motor numarası, 100 km yakıt tüketimi (Dinar/EUR), aksesuarları ve kronik arızaları tek noktadan arşivlenir.
              </p>
            </div>

            {/* 2 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">4 Fotoğraflı Kiralama & İade</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Araç teslim edilirken ön, arka, sağ ve sol 4 açıdan fotoğraflanır. İade edildiğinde hasar kontrolü, aksesuar checklist&apos;i ve tek tıkla süre uzatma sağlanır.
              </p>
            </div>

            {/* 3 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Belgrade Parking Servis (eDPK)</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Sırbistan Belgrad&apos;da araçlarınıza kesilen elektronik park cezaları otomatik taranır. %50 indirimli ödeme süresi dolmadan anında bildirim alınır.
              </p>
            </div>

            {/* 4 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Registracija & Yıllık Muayene</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Trafiğe çıkış izni (Registracija) ve yıllık muayene bitiş tarihleri 14, 7 ve 3 gün kala renk kodlu uyarı verir. Tek tıkla müşteriye WhatsApp hatırlatması gönderilir.
              </p>
            </div>

            {/* 5 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Periyodik Bakım & Motor Yağı</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Değişen parçalar, işçilik masrafları, yağ değişim kilometreleri ve servis geçmişi kayıt altına alınır. EUR ve RSD para birimleri tam desteklenir.
              </p>
            </div>

            {/* 6 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Finansal Kasa & Ortaklık Payları</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Hangi aracın hangi ortağa ait olduğu, aracın satın alma maliyetini ne kadar sürede amorti ettiği ve net kar payları anlık olarak hesaplanır.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AVANTAJLAR (BENEFITS) */}
      <section id="avantajlar" className="py-20 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Neden Filo Yönetim?</span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2 leading-tight">
                Gecikme Cezalarını Sıfırlayın, Kazancınızı Maksimize Edin
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Filo işletmeciliği yaparken unutulan bir registracija veya geç fark edilen bir park cezası binlerce Euro maliyete yol açabilir. Sistemimiz tüm operasyonel riskleri otomatik denetler.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">%50 Erken Ödeme İndirimini Yakalayın</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Belgrad Park Servisi cezalarını son gününe bırakmadan tespit edip müşteriye anında rücu edin.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Çalışan (STAFF) Yetkilendirmesiyle Tam Güvenlik</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Personeliniz kiralamaları ve araç durumunu güncellesin; şirket kasası, amortisman ve sistem ayarları personelinize gizli kalsın.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Şeffaf Ortaklık Hesapları</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ortaklı araçlarda gelir ve giderler otomatik ayrıştırılır. Hangi ortağın kasada ne kadar hakkı olduğu anında listelenir.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side graphical card */}
            <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Canlı Filo Simülasyonu</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Aktif Lisans
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Aylık Standart Kira</span>
                    <div className="text-xl font-black text-white mt-1">350 € / araç</div>
                    <span className="text-[10px] text-emerald-400">Sözleşme garantili</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Park Cezası Tasarrufu</span>
                    <div className="text-xl font-black text-amber-400 mt-1">-%50 Erken Ödeme</div>
                    <span className="text-[10px] text-slate-400">eDPK Belgrade</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-300">Araç Amortisman İlerlemesi</span>
                    <span className="font-bold text-emerald-400">%82 Tamamlandı</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full w-[82%]" />
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300"
                  >
                    <span>Filonuzu Şimdi Kaydedin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.5. FILORAPOR İLHAMLI KARŞILAŞTIRMA MATRİSİ: ESKİ YÖNTEMLER VS MODERN FİLO PLATFORMU */}
      <section className="py-20 border-b border-slate-850 bg-slate-900/60 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-pine-500/20 text-chartreuse-500 border border-pine-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Geleneksel vs Modern Operasyon
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3">
              Excel ve Defter Karmaşasından, Akıllı Raporlamaya Geçin
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Belgrad ve Balkanlar'daki filo operatörlerinin zamanını çalan ve gereksiz maliyet yaratan süreçleri sıfırlıyoruz.
            </p>
          </div>

          <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            {/* Headers */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-800">
              <div className="p-5 sm:p-6 bg-slate-900/80 border-b md:border-b-0 md:border-r border-slate-800 flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Eski Yöntemler
                  </span>
                  <h3 className="text-base font-black text-slate-300 mt-2">Excel, Defter & WhatsApp</h3>
                </div>
                <XCircle className="w-6 h-6 text-rose-500/60 shrink-0" />
              </div>
              <div className="p-5 sm:p-6 bg-[#002828] flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c5c23d]/20 text-[#c5c23d] border border-[#c5c23d]/40">
                    Filo Yönetim Platformu
                  </span>
                  <h3 className="text-base font-black text-white mt-2">Bulut Tabanlı Raporlama & Takip</h3>
                </div>
                <CheckCircle2 className="w-6 h-6 text-[#c5c23d] shrink-0" />
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="divide-y divide-slate-800/80">
              {/* Row 1: Registracija & Muayene */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-5 sm:p-6 bg-slate-950/60 md:border-r border-slate-800/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">✕</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 line-through decoration-rose-500/60">Unutulan Registracija (Tescil) Tarihleri</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Sırbistan polis kontrolünde register süresi bitmiş aracın çekilmesi, yüzbinlerce dinar ceza ve aracın haftalarca otoparkta bağlanması.
                    </p>
                  </div>
                </div>
                <div className="p-5 sm:p-6 bg-[#001f1f]/50 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#c5c23d]/20 text-[#c5c23d] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">✓</div>
                  <div>
                    <h4 className="text-xs font-bold text-white">30 Gün Önceden Otomatik Registracija Alarmları</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Kritik uyarı paneli, süresi biten aracın sistem tarafından otomatik olarak kiralamaya kapatılması ve sıfır ceza güvencesi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Belgrade Parking Servis (eDPK) */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-5 sm:p-6 bg-slate-950/60 md:border-r border-slate-800/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">✕</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 line-through decoration-rose-500/60">Postayla Gelen Sürpriz Park Cezaları</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Parking Servis cezalarının haftalar sonra şirkete tebliğ edilmesi, o gün hangi müşteride olduğunun bulunamaması ve filonun zarara uğraması.
                    </p>
                  </div>
                </div>
                <div className="p-5 sm:p-6 bg-[#001f1f]/50 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#c5c23d]/20 text-[#c5c23d] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">✓</div>
                  <div>
                    <h4 className="text-xs font-bold text-white">eDPK Plaka Sorgusu & Müşteri Eşleştirme</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Ceza saatinde aracı kullanan müşterinin telefon ve kira sözleşmesiyle anında eşleştirilmesi, %50 erken ödeme indirimiyle tahsilat.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 3: 4 Angle Photos */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-5 sm:p-6 bg-slate-950/60 md:border-r border-slate-800/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">✕</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 line-through decoration-rose-500/60">WhatsApp Sohbetlerinde Kaybolan Fotoğraflar</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Araç teslim edilirken çekilen fotoğrafların silinmesi, araç geri dönerken "bu vuruk önceden de vardı" tartışmaları ve hasar maliyeti.
                    </p>
                  </div>
                </div>
                <div className="p-5 sm:p-6 bg-[#001f1f]/50 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#c5c23d]/20 text-[#c5c23d] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">✓</div>
                  <div>
                    <h4 className="text-xs font-bold text-white">4 Açı HD Teslimat Tutanakları (Ön, Arka, Sağ, Sol)</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Kiralama başlatılırken 4 cephe fotoğrafı ve kilometre kaydı doğrudan sözleşmeye dijital olarak işlenir; lightbox ile tam ekran incelenir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 4: Amortization & Profit */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-5 sm:p-6 bg-slate-950/60 md:border-r border-slate-800/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">✕</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 line-through decoration-rose-500/60">Kör Uçuş Muhasebe & Belirsiz Kârlılık</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Kiranın gelip gelmediği, hangi araca ne kadar parça/işçilik harcandığı ve bir aracın kendini kaç ayda amorti ettiğinin bilinememesi.
                    </p>
                  </div>
                </div>
                <div className="p-5 sm:p-6 bg-[#001f1f]/50 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#c5c23d]/20 text-[#c5c23d] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">✓</div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Araç Başı Net Kâr/Zarar ve Amortisman Takibi</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Her aracın kazandırdığı kira cirosu, toplam bakım gideri, net katkı yüzdesi ve yatırımın kendini çıkarma oranı anlık grafiklerle önünüzde.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. NASIL ÇALIŞIR? (HOW IT WORKS) */}
      <section id="nasil-calisir" className="py-20 bg-slate-900/40 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">3 Kolay Adım</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
              Sisteme Nasıl Kayıt Olunur?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Filonuzun açılması, güvenli çok kiracılı mimarimiz gereği SaaS yöneticisi tarafından sağlanır.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Filo Kurulumu & Kod Tanımı</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                SaaS yöneticisi filonuzu sisteme tanımlar, talep ettiğiniz modülleri (park cezaları, muayene, finans vb.) aktive eder ve size benzersiz bir <span className="font-mono font-bold text-amber-400">Filo Kodu (Örn: FL-7085)</span> tahsis eder.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">Filo Kodu İle Kayıt Olun</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kayıt sayfamıza giderek şirket yetkilisi adı, e-posta adresiniz ve size iletilen Filo Kodunu girin. Sistem anında filonuzu eşleştirir ve yönetici hesabınızı oluşturur.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Giriş Yapın & Yönetin</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Oturum açtığınızda yalnızca firmanıza tahsis edilen modülleri görürsünüz. Personel ekleyebilir, araçlarınızı ve kiralamalarınızı güvenle takip edebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PAKETLER & FİYATLANDIRMA (PRICING) */}
      <section id="fiyatlandirma" className="py-20 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Lisans ve Paketler</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
              İhtiyacınıza Uygun Filo Lisansı
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Filo büyüklüğünüze göre özelleştirilebilir modül seçenekleri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Başlangıç</span>
                <h3 className="text-2xl font-black text-white mt-1">Starter</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-white">1 - 10</span>
                  <span className="text-xs text-slate-400 ml-1.5">Araç Kapasitesi</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Araç ve Envanter Yönetimi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Müşteri & Kiralama Kayıtları</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Periyodik Bakım ve Yağ Takibi</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Belgrad Parking Servis Otomatik Tarama</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Ortaklık Kasası & Detaylı ROI</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800">
                <Link
                  href="/register"
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <span>Filo Kodu İle Başla</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Pro - Featured */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-amber-500 flex flex-col justify-between relative shadow-xl shadow-amber-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                En Çok Tercih Edilen
              </div>
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Profesyonel</span>
                <h3 className="text-2xl font-black text-white mt-1">Pro Filo</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-white">10 - 30</span>
                  <span className="text-xs text-slate-400 ml-1.5">Araç Kapasitesi</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Tüm Starter Özellikleri</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Belgrade Parking Servis (eDPK) Entegrasyonu</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Registracija Muayene Takvimi & WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>4 Açılı Fotoğraflı Teslimat Formu</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Ortaklık Kasası & Amortisman</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800">
                <Link
                  href="/register"
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/25"
                >
                  <span>Filo Kodu İle Başla</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Enterprise */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kurumsal</span>
                <h3 className="text-2xl font-black text-white mt-1">Enterprise</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-white">Sınırsız</span>
                  <span className="text-xs text-slate-400 ml-1.5">Araç & Çoklu Ortak</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sınırsız Araç ve Kullanıcı Kotası</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tüm SaaS Modülleri Tam Yetkilendirme</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>İşlem Geçmişi (Audit Logs) ve Güvenlik</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Özel Süper Yönetici Desteği</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800">
                <a
                  href="https://wa.me/381659988771?text=Merhaba,%20kurumsal%20filo%20lisansı%20hakkında%20bilgi%20almak%20istiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>SaaS Yöneticisiyle Görüş</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="py-12 bg-slate-950 border-t border-slate-850 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 p-0.5 flex items-center justify-center">
              <img src="/icon.png" alt="Filo Yönetim" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-white">FİLO YÖNETİM SİSTEMİ</span>
              <span className="block text-[10px] text-slate-500">Beograd & Balkanlar Araç Takip ve Operasyon</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">
              Yönetici Girişi
            </Link>
            <Link href="/register" className="hover:text-amber-400 transition-colors font-bold">
              Filo Kodu İle Kayıt Ol
            </Link>
            <a
              href="https://wa.me/381659988771"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1 text-emerald-400"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Destek</span>
            </a>
          </div>

          <div>
            © {new Date().getFullYear()} Filo Yönetim. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}
