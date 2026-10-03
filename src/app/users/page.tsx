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

export default function UsersPage() {
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
      .then((res) => (res.ok ? res.json() : null))
      .then((u) => {
        if (u?.user) setCurrentUser(u.user);
        else window.location.href = '/login';
      });

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
      title: 'Yönetici (Tam Yetkili)',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      desc: 'Tüm filo araçları, kiralamalar, finansal amortisman, kullanıcı ve sistem parametrelerine tam yetkili erişim.',
    },
    STAFF: {
      title: 'Filo Çalışanı (Operasyonel)',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      desc: 'Araç durumu güncelleme, kiralama başlatma/bitirme, bakım, arıza ve masraf girişi yapabilir. Veri silme ve amortisman/kazanç istatistiklerine erişimi kısıtlıdır.',
    },
  };

  return (
    <AppLayout currentUser={currentUser} adminOnly={true}>
      {/* Header and Add User Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-amber-500" />
            Kullanıcı ve Yetki Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sisteme erişimi olan filo yöneticileri ve operasyonel çalışanlar
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
            Yeni Kullanıcı Ekle
          </button>
        )}
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Yönetici Rolü (ADMIN)</span>
          </div>
          <p className="text-xs text-amber-950/80 leading-relaxed">
            Araç ekleme, silme, kira fiyatlandırma, tüm amortisman / finansal kâr raporlarını görüntüleme ve kullanıcı yönetimi yetkisine sahiptir.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Filo Çalışanı Rolü (STAFF)</span>
          </div>
          <p className="text-xs text-blue-950/80 leading-relaxed">
            Kiralama başlatma, iade alma, teslimat fotoğrafı ve hasar/arıza ekleme, masraf fişi girme yetkisi vardır. <b>Veri silme ve finansal istatistikler kısıtlıdır.</b>
          </p>
        </div>
      </div>

      {/* Users List Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Kullanıcılar listeleniyor...</p>
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
              badge: 'bg-slate-100 text-slate-700 border-slate-200',
              desc: 'Standart kullanıcı',
            };

            return (
              <div
                key={u.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {u.name}
                          {isSuperAdmin && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.email === 'akif@filoyonetim.com') && (
                            <span className="text-xs font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Panel Sahibi
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
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                          title={isSelf ? "Profilimi / Şifremi Güncelle" : "Kullanıcıyı Düzenle / Şifre Sıfırla"}
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
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                            }`}
                            title={u.isActive ? 'Kullanıcıyı Askıya Al' : 'Askıyı Kaldır (Aktif Et)'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-800">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Kayıt Tarihi: {formatDate(u.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-700 font-semibold">Hesap Durumu: Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-rose-700 font-bold">Hesap Durumu: Askıya Alındı</span>
                          </>
                        )}
                      </div>

                      {!isSuperAdmin && !isSelf && (
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(u)}
                          className={`text-xs font-bold underline cursor-pointer ${
                            u.isActive ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {u.isActive ? 'Askıya Al' : 'Aktif Et'}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 leading-relaxed">
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
        title="Yeni Kullanıcı Ekle"
        subtitle="Filo sistemine yeni yönetici veya operasyonel çalışan tanımlayın"
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
              Ad Soyad *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-posta Adresi *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="ahmet@filoyonetim.com"
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
                💡 Bunu mu demek istediniz: <b>{validateRealisticEmail(newEmail).suggestion}</b>?
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Giriş Şifresi *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter (büyük/küçük harf & rakam)"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono"
              />
            </div>
            {newPassword && (
              <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div className="font-bold text-slate-700">Şifre Kriterleri:</div>
                <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{newPassword.length >= 6 ? '✓' : '○'}</span> En az 6 karakter
                </div>
                <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span> En az 1 büyük harf (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${/[a-z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{/[a-z]/.test(newPassword) ? '✓' : '○'}</span> En az 1 küçük harf (a-z)
                </div>
                <div className={`flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>{/[0-9]/.test(newPassword) ? '✓' : '○'}</span> En az 1 rakam (0-9)
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kullanıcı Rolü & Yetki Düzeyi *
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-bold text-slate-800"
            >
              <option value="STAFF">Filo Çalışanı (Operasyonel Giriş - Silme Yetkisi Yok)</option>
              <option value="ADMIN">Yönetici / Filo Sahibi (Tam Yetkili - Finansallar Açık)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kullanıcıyı Kaydet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT USER & RESET PASSWORD */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Kullanıcıyı Düzenle: ${editingUser.name}`}
          subtitle={`${editingUser.email} kullanıcısının bilgilerini veya şifresini güncelleyin`}
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
                Ad Soyad *
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
                  Yeni Şifre Belirle (Boş bırakırsanız mevcut şifre değişmez)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Değiştirmek istemiyorsanız boş bırakın"
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Şifre Değiştirme Yetkisi Sınırlandırılmıştır</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Süper yönetici haricindeki kullanıcılar yalnızca kendi şifrelerini profil ayarlarından değiştirebilir. Başka bir kullanıcının şifresini değiştiremezsiniz.
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kullanıcı Rolü & Yetki Düzeyi *
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
                <option value="ADMIN">Yönetici / Filo Sahibi (Tam Yetkili - Finansallar Açık)</option>
                <option value="STAFF">Filo Çalışanı (Operasyonel Giriş - Silme Yetkisi Yok)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingEdit ? 'Güncelleniyor...' : 'Güncellemeyi Kaydet'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
