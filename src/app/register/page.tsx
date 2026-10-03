'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  Lock,
  Mail,
  User,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { validatePassword, validateRealisticEmail } from '@/lib/validation';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/lib/i18n';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [fleetCode, setFleetCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Live validation
  const emailValidation = email ? validateRealisticEmail(email) : null;
  const pwdValidation = password ? validatePassword(password) : null;

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setFleetCode(codeParam.toUpperCase().trim());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // E-posta doğrulama
    const checkEmail = validateRealisticEmail(email);
    if (!checkEmail.isValid) {
      setError(checkEmail.error || t.auth_email_invalid);
      return;
    }

    // Şifre karmaşıklık kontrolü
    const checkPwd = validatePassword(password);
    if (!checkPwd.isValid) {
      setError(checkPwd.errors.join(' '));
      return;
    }

    if (password !== confirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle uyuşmuyor.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          fleetCode,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Kayıt işlemi başarısız oldu.');
      }

      setSuccess(data.message || 'Kayıt başarılı! Filonuza yönlendiriliyorsunuz...');
      setTimeout(() => {
        router.push(data.redirectTo || '/');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 transition-colors relative">
      {/* Top right floating Language & Theme switches */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl border border-slate-800 bg-slate-900 p-1 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img
                src="/icon.png"
                alt="Filo Yönetim"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t.auth_register}
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          SaaS yöneticiniz tarafından şirketiniz için tanımlanan lisans koduyla hemen hesabınızı oluşturun.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-8 px-6 sm:px-10 shadow-lg rounded-3xl">
          {/* Bilgilendirme Kartı */}
          <div className="mb-5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">{t.auth_fleet_code} Zorunludur:</span> Filolar ve lisanslar SaaS yöneticisi tarafından kurulur. Size iletilen benzersiz kod ile firmanıza atanmış araç ve modülleri yönetebilirsiniz.
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Filo Kodu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.auth_fleet_code} *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fleetCode}
                  onChange={(e) => setFleetCode(e.target.value.toUpperCase())}
                  placeholder="Örn: FL-7085"
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 focus:border-amber-500 text-slate-900 dark:text-slate-100 font-mono font-bold tracking-wider text-sm rounded-xl outline-hidden uppercase transition-all"
                />
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                SaaS yetkilinizden aldığınız şirket filo kodu
              </span>
            </div>

            {/* Ad Soyad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ad Soyad (Yetkili) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl outline-hidden transition-all focus:border-amber-500"
                />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.auth_email} *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ahmet@sirketiniz.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl outline-hidden transition-all focus:border-amber-500"
                />
              </div>
              {emailValidation && !emailValidation.isValid && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                  ⚠️ {emailValidation.error}
                </p>
              )}
              {emailValidation?.suggestion && (
                <button
                  type="button"
                  onClick={() => setEmail(emailValidation.suggestion!)}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline mt-1 block text-left"
                >
                  💡 Bunu mu demek istediniz: <b>{emailValidation.suggestion}</b>?
                </button>
              )}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                {t.auth_realistic_email_hint}
              </span>
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.auth_password} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter (büyük/küçük harf & rakam)"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl outline-hidden transition-all font-mono focus:border-amber-500"
                />
              </div>

              {/* Canlı Şifre Kriterleri Checklist */}
              {password && (
                <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300">{t.auth_password_rules}</div>
                  <div className={`flex items-center gap-1.5 ${password.length >= 6 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                    <span>{password.length >= 6 ? '✓' : '○'}</span> {t.auth_password_rule_len}
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                    <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span> {t.auth_password_rule_upper}
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[a-z]/.test(password) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                    <span>{/[a-z]/.test(password) ? '✓' : '○'}</span> {t.auth_password_rule_lower}
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                    <span>{/[0-9]/.test(password) ? '✓' : '○'}</span> {t.auth_password_rule_number}
                  </div>
                </div>
              )}
            </div>

            {/* Şifre Tekrar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.auth_password} (Tekrar) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifrenizi onaylayın"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl outline-hidden transition-all font-mono focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-hidden disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <span>Filo Hesabını Oluştur & Başla</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Zaten bir hesabınız var mı? </span>
              <Link href="/login" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                {t.auth_login}
              </Link>
            </div>
            <Link href="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              ← Tanıtım & Fiyatlandırma Sayfasına Dön
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Filo Yönetim Sistemi © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
