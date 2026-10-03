'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCog,
  ShieldCheck,
  UserCheck,
  Mail,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  Lock,
  User,
  AlertCircle,
  Edit,
  Power,
  KeyRound,
  XCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/formatters';
import { AuthUser } from '@/lib/auth-client';
import { validatePassword, validateRealisticEmail } from '@/lib/validation';
import { useLanguage } from '@/lib/i18n';

export default function UsersPage() {
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: Add User
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal: Edit User & Reset Password
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'STAFF' | 'SUPER_ADMIN'>('STAFF');
  const [editPassword, setEditPassword] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isSuper =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.email === 'akif@filoyonetim.com' ||
    currentUser?.email === 'gencaksoy@outlook.com';

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditRole(u.role as any);
    setEditPassword('');
    setEditError(null);
  };

  const handleToggleSuspend = async (user: any) => {
    const actionText = user.isActive ? 'askıya almak (girişini engellemek)' : 'tekrar aktif etmek';
    if (!confirm(`${user.name} kullanıcısını ${actionText} istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        await loadUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'İşlem başarısız.');
      }
    } catch (e: any) {
      alert(e.message || 'Hata oluştu.');
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      const payload: any = {
        name: editName,
        role: editRole,
      };
      if (editPassword.trim()) {
        if (editPassword.trim().length < 6) {
          throw new Error('Yeni şifre en az 6 karakter olmalıdır.');
        }
        if (isSuper || editingUser.id === currentUser?.id) {
          payload.password = editPassword.trim();
        }
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kullanıcı güncellenemedi.');
      }

      setEditingUser(null);
      setEditPassword('');
      await loadUsers();
      alert('Kullanıcı bilgileri başarıyla güncellendi.');
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const emailCheck = validateRealisticEmail(newEmail);
    if (!emailCheck.isValid) {
      setErrorMsg(emailCheck.error || 'Geçersiz e-posta adresi.');
      setIsSubmitting(false);
      return;
    }

    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.isValid) {
      setErrorMsg(pwdCheck.errors.join(' '));
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kullanıcı oluşturulamadı.');
      }

      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('STAFF');
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`${userName} isimli kullanıcıyı sistemden silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Kullanıcı silinemedi.');
        return;
      }
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Bir hata oluştu.');
    }
  };

  const roleDescriptions: Record<string, { title: string; badge: string; desc: string }> = {
    ADMIN: {
      title: language === 'sr' ? 'Menadžer (Puna Prava)' : language === 'en' ? 'Administrator (Full Access)' : 'Yönetici (Tam Yetkili)',
      badge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700',
      desc: language === 'sr'
        ? 'Potpun pristup dodavanju, brisanju vozila, cenama zakupa, svim finansijskim izveštajima/amortizaciji i upravljanju korisnicima.'
        : language === 'en'
        ? 'Full authority to add/delete vehicles, pricing, view all amortization/profit reports, and manage users.'
        : 'Tüm filo araçları, kiralamalar, finansal amortisman, kullanıcı ve sistem parametrelerine tam yetkili erişim.',
    },
    STAFF: {
      title: language === 'sr' ? 'Osoblje Flote (Operativno)' : language === 'en' ? 'Fleet Staff (Operational)' : 'Filo Çalışanı (Operasyonel)',
      badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
      desc: language === 'sr'
        ? 'Može pokretati/završavati zakup, unositi fotografije primopredaje, kvarove i troškove. Brisanje podataka i finansijska statistika su ograničeni.'
        : language === 'en'
        ? 'Can start/end rentals, upload delivery photos, log faults and expenses. Data deletion and financial stats are restricted.'
        : 'Kiralama başlatma, iade alma, teslimat fotoğrafı ve hasar/arıza ekleme, masraf fişi girme yetkisi vardır. Veri silme ve finansal istatistikler kısıtlıdır.',
    },
  };

  return (
    <AppLayout currentUser={currentUser} adminOnly={true}>
      {/* Header and Add User Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="w-6 h-6 text-amber-500" />
            {t.users_title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.users_subtitle}
          </p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => {
              setErrorMsg(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.users_btn_new}
          </button>
        )}
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{language === 'sr' ? 'Uloga Menadžera (ADMIN)' : language === 'en' ? 'Manager Role (ADMIN)' : 'Yönetici Rolü (ADMIN)'}</span>
          </div>
          <p className="text-xs text-amber-950/80 dark:text-amber-200/80 leading-relaxed">
            {language === 'sr'
              ? 'Ima pun pristup dodavanju, brisanju vozila, cenama zakupa, svim finansijskim izveštajima/amortizaciji i upravljanju korisnicima.'
              : language === 'en'
              ? 'Has full authority to add/delete vehicles, pricing, view all amortization/profit reports, and manage users.'
              : 'Araç ekleme, silme, kira fiyatlandırma, tüm amortisman / finansal kâr raporlarını görüntüleme ve kullanıcı yönetimi yetkisine sahiptir.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{language === 'sr' ? 'Uloga Osoblja Flote (STAFF)' : language === 'en' ? 'Fleet Staff Role (STAFF)' : 'Filo Çalışanı Rolü (STAFF)'}</span>
          </div>
          <p className="text-xs text-blue-950/80 dark:text-blue-200/80 leading-relaxed">
            {language === 'sr'
              ? 'Može pokretati/završavati zakup, unositi fotografije primopredaje, kvarove i troškove. Brisanje podataka i finansijska statistika su ograničeni.'
              : language === 'en'
              ? 'Can start/end rentals, upload delivery photos, log faults and expenses. Data deletion and financial stats are restricted.'
              : 'Kiralama başlatma, iade alma, teslimat fotoğrafı ve hasar/arıza ekleme, masraf fişi girme yetkisi vardır. Veri silme ve finansal istatistikler kısıtlıdır.'}
          </p>
        </div>
      </div>

      {/* Users List Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'sr' ? 'Učitavanje korisnika...' : language === 'en' ? 'Loading users...' : 'Kullanıcılar listeleniyor...'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users
            .filter((u) => {
              const isSuper = currentUser?.role === 'SUPER_ADMIN' || currentUser?.email === 'akif@filoyonetim.com';
              if (isSuper) return true;
              return u.role !== 'SUPER_ADMIN' && u.email !== 'akif@filoyonetim.com' && u.name !== 'Akif Aksoy';
            })
            .map((u) => {
            const isSuperAdmin = u.email === 'akif@filoyonetim.com' || u.role === 'SUPER_ADMIN';
            const isSelf = u.id === currentUser?.id;
            const info = roleDescriptions[u.role] || {
              title: u.role,
              badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
              desc: language === 'sr' ? 'Standardni korisnik' : language === 'en' ? 'Standard user' : 'Standart kullanıcı',
            };

            return (
              <div
                key={u.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {u.name}
                          {isSuperAdmin && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.email === 'akif@filoyonetim.com') && (
                            <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                              {language === 'sr' ? 'Vlasnik Panela' : language === 'en' ? 'Panel Owner' : 'Panel Sahibi'}
                            </span>
                          )}
                        </h3>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-xs font-bold border ${info.badge}`}
                        >
                          {info.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {(isSelf || currentUser?.role === 'SUPER_ADMIN' || (!isSuperAdmin && currentUser?.role === 'ADMIN')) && (
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-xl transition-colors cursor-pointer"
                          title={isSelf ? (language === 'sr' ? 'Ažuriraj Profil / Lozinku' : language === 'en' ? 'Update Profile / Password' : 'Profilimi / Şifremi Güncelle') : (language === 'sr' ? 'Izmeni Korisnika / Resetuj Lozinku' : language === 'en' ? 'Edit User / Reset Password' : 'Kullanıcıyı Düzenle / Şifre Sıfırla')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {!isSuperAdmin && !isSelf && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleSuspend(u)}
                            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                              u.isActive
                                ? 'text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                                : 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                            }`}
                            title={u.isActive ? (language === 'sr' ? 'Suspenduj Korisnika' : language === 'en' ? 'Suspend User' : 'Kullanıcıyı Askıya Al') : (language === 'sr' ? 'Aktiviraj Korisnika' : language === 'en' ? 'Activate User' : 'Askıyı Kaldır (Aktif Et)')}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                            title={language === 'sr' ? 'Obriši Korisnika' : language === 'en' ? 'Delete User' : 'Kullanıcıyı Sil'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{language === 'sr' ? 'Datum Registracije: ' : language === 'en' ? 'Registered: ' : 'Kayıt Tarihi: '} {formatDate(u.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              {language === 'sr' ? 'Status: Aktivan' : language === 'en' ? 'Status: Active' : 'Hesap Durumu: Aktif'}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-rose-700 dark:text-rose-400 font-bold">
                              {language === 'sr' ? 'Status: Suspendovan' : language === 'en' ? 'Status: Suspended' : 'Hesap Durumu: Askıya Alındı'}
                            </span>
                          </>
                        )}
                      </div>

                      {!isSuperAdmin && !isSelf && (
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(u)}
                          className={`text-xs font-bold underline cursor-pointer ${
                            u.isActive ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {u.isActive ? (language === 'sr' ? 'Suspenduj' : language === 'en' ? 'Suspend' : 'Askıya Al') : (language === 'sr' ? 'Aktiviraj' : language === 'en' ? 'Activate' : 'Aktif Et')}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {info.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD NEW USER */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={language === 'sr' ? 'Dodaj Novog Korisnika' : language === 'en' ? 'Add New User' : 'Yeni Kullanıcı Ekle'}
        subtitle={language === 'sr' ? 'Definišite novog administratora ili operativnog člana osoblja' : language === 'en' ? 'Define a new administrator or operational staff member' : 'Filo sistemine yeni yönetici veya operasyonel çalışan tanımlayın'}
        maxWidth="md"
      >
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'sr' ? 'Ime i Prezime *' : language === 'en' ? 'Full Name *' : 'Ad Soyad *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={language === 'sr' ? 'Npr: Marko Petrović' : language === 'en' ? 'E.g.: John Doe' : 'Örn: Ahmet Yılmaz'}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'sr' ? 'Email Adresa *' : language === 'en' ? 'Email Address *' : 'E-posta Adresi *'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="korisnik@filo.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-medium"
              />
            </div>
            {newEmail && !validateRealisticEmail(newEmail).isValid && (
              <p className="text-[11px] text-rose-600 mt-1">
                ⚠️ {validateRealisticEmail(newEmail).error}
              </p>
            )}
            {newEmail && validateRealisticEmail(newEmail).suggestion && (
              <button
                type="button"
                onClick={() => setNewEmail(validateRealisticEmail(newEmail).suggestion!)}
                className="text-[11px] text-amber-600 hover:underline mt-1 block text-left"
              >
                💡 {language === 'sr' ? 'Da li ste mislili: ' : language === 'en' ? 'Did you mean: ' : 'Bunu mu demek istediniz: '}<b>{validateRealisticEmail(newEmail).suggestion}</b>?
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'sr' ? 'Lozinka *' : language === 'en' ? 'Password *' : 'Giriş Şifresi *'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === 'sr' ? 'Najmanje 6 karaktera (veliko/malo slovo i broj)' : language === 'en' ? 'At least 6 characters (upper/lower case & number)' : 'En az 6 karakter (büyük/küçük harf & rakam)'}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono"
              />
            </div>
            {newPassword && (
              <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div className="font-bold text-slate-700">
                  {language === 'sr' ? 'Kriterijumi za lozinku:' : language === 'en' ? 'Password Requirements:' : 'Şifre Kriterleri:'}
                </div>
                <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{newPassword.length >= 6 ? '✓' : '○'}</span> {language === 'sr' ? 'Najmanje 6 karaktera' : language === 'en' ? 'At least 6 characters' : 'En az 6 karakter'}
                </div>
                <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span> {language === 'sr' ? 'Najmanje 1 veliko slovo (A-Z)' : language === 'en' ? 'At least 1 uppercase letter (A-Z)' : 'En az 1 büyük harf (A-Z)'}
                </div>
                <div className={`flex items-center gap-1.5 ${/[a-z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{/[a-z]/.test(newPassword) ? '✓' : '○'}</span> {language === 'sr' ? 'Najmanje 1 malo slovo (a-z)' : language === 'en' ? 'At least 1 lowercase letter (a-z)' : 'En az 1 küçük harf (a-z)'}
                </div>
                <div className={`flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{/[0-9]/.test(newPassword) ? '✓' : '○'}</span> {language === 'sr' ? 'Najmanje 1 broj (0-9)' : language === 'en' ? 'At least 1 number (0-9)' : 'En az 1 rakam (0-9)'}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'sr' ? 'Uloga / Nivo Ovlašćenja *' : language === 'en' ? 'Role / Access Level *' : 'Kullanıcı Rolü & Yetki Düzeyi *'}
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-bold text-slate-800"
            >
              <option value="STAFF">{language === 'sr' ? 'Osoblje Flote (Operativni Unos - Bez Brisanja)' : language === 'en' ? 'Fleet Staff (Operational Access - No Deletion)' : 'Filo Çalışanı (Operasyonel Giriş - Silme Yetkisi Yok)'}</option>
              <option value="ADMIN">{language === 'sr' ? 'Menadžer / Vlasnik Flote (Puna Prava - Finansije Otvorene)' : language === 'en' ? 'Administrator / Fleet Owner (Full Authority - Financials Visible)' : 'Yönetici / Filo Sahibi (Tam Yetkili - Finansallar Açık)'}</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {t.common_cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? (language === 'sr' ? 'Kreiranje...' : language === 'en' ? 'Creating...' : 'Kaydediliyor...')
                : (language === 'sr' ? 'Kreiraj Korisnika' : language === 'en' ? 'Create User' : 'Kullanıcıyı Kaydet')}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT USER & RESET PASSWORD */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={editingUser.id === currentUser?.id ? (language === 'sr' ? 'Moj Profil i Lozinka' : language === 'en' ? 'My Profile & Password' : 'Profilimi ve Şifremi Güncelle') : (language === 'sr' ? `Izmeni Korisnika: ${editingUser.name}` : language === 'en' ? `Edit User: ${editingUser.name}` : `Kullanıcıyı Düzenle: ${editingUser.name}`)}
          subtitle={language === 'sr' ? `Ažurirajte podatke ili lozinku za ${editingUser.email}` : language === 'en' ? `Update details or password for ${editingUser.email}` : `${editingUser.email} kullanıcısının bilgilerini veya şifresini güncelleyin`}
          maxWidth="md"
        >
          {editError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <form onSubmit={handleEditUserSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Ime i Prezime *' : language === 'en' ? 'Full Name *' : 'Ad Soyad *'}
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-medium"
              />
            </div>

            {isSuper || editingUser.id === currentUser?.id ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'sr' ? 'Nova Lozinka (Ostavite prazno ako ne menjate)' : language === 'en' ? 'New Password (Leave blank to keep current)' : 'Yeni Şifre Belirle (Boş bırakırsanız mevcut şifre değişmez)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder={language === 'sr' ? 'Ostavite prazno ako ne želite promenu' : language === 'en' ? 'Leave blank to keep current' : 'Değiştirmek istemiyorsanız boş bırakın'}
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">
                    {language === 'sr' ? 'Pravo promene lozinke je ograničeno' : language === 'en' ? 'Password change restricted' : 'Şifre Değiştirme Yetkisi Sınırlandırılmıştır'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'sr' ? 'Samo administrator može resetovati lozinke drugih korisnika.' : language === 'en' ? 'Only administrators can reset other users passwords.' : 'Süper yönetici haricindeki kullanıcılar yalnızca kendi şifrelerini profil ayarlarından değiştirebilir. Başka bir kullanıcının şifresini değiştiremezsiniz.'}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Uloga / Nivo Ovlašćenja *' : language === 'en' ? 'Role / Access Level *' : 'Kullanıcı Rolü & Yetki Düzeyi *'}
              </label>
              <select
                value={editRole}
                disabled={editingUser.id === currentUser?.id && currentUser?.role !== 'SUPER_ADMIN'}
                onChange={(e) => setEditRole(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
              >
                {editingUser.role === 'SUPER_ADMIN' && (
                  <option value="SUPER_ADMIN">Süper Yönetici (Tüm Sistemler / SaaS Sahibi)</option>
                )}
                <option value="ADMIN">{language === 'sr' ? 'Menadžer / Vlasnik Flote (Puna Prava)' : language === 'en' ? 'Administrator / Fleet Owner (Full Authority)' : 'Yönetici / Filo Sahibi (Tam Yetkili - Finansallar Açık)'}</option>
                <option value="STAFF">{language === 'sr' ? 'Osoblje Flote (Operativni Unos - Bez Brisanja)' : language === 'en' ? 'Fleet Staff (Operational Access - No Deletion)' : 'Filo Çalışanı (Operasyonel Giriş - Silme Yetkisi Yok)'}</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {t.common_cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingEdit
                  ? (language === 'sr' ? 'Ažuriranje...' : language === 'en' ? 'Updating...' : 'Güncelleniyor...')
                  : (language === 'sr' ? 'Sačuvaj Izmene' : language === 'en' ? 'Save Changes' : 'Güncellemeyi Kaydet')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
