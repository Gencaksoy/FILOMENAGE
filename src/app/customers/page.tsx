'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Phone,
  Car,
  Clock,
  Edit,
  Trash2,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileImage,
  Upload,
  Eye,
  X,
  CreditCard,
  UserCheck,
  MessageCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { formatDate } from '@/lib/formatters';
import { AuthUser } from '@/lib/auth-client';
import { useLanguage } from '@/lib/i18n';

function CustomersContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // New & Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const initialForm = {
    name: '',
    phone: '',
    identityNo: '',
    email: '',
    address: '',
    notes: '',
    passportPhoto: '',
    licensePhoto: '',
    idPhoto: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Documents Modal
  const [docModalCustomer, setDocModalCustomer] = useState<any | null>(null);
  const [uploadDocType, setUploadDocType] = useState('PASSPORT');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Filo Yönetim & Rent a Car');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 401) window.location.href = '/login';
        return null;
      })
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.company_name) setCompanyName(data.company_name);
      })
      .catch(() => {});

    loadCustomers();
    const s = searchParams.get('search');
    if (s) {
      setSearch(s);
    }
  }, [searchParams]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
        if (docModalCustomer) {
          const updated = data.find((c: any) => c.id === docModalCustomer.id);
          if (updated) setDocModalCustomer(updated);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData(initialForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setIsEditing(true);
    setCurrentId(c.id);
    setFormData({
      name: c.name,
      phone: c.phone,
      identityNo: c.identityNo || '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
      passportPhoto: '',
      licensePhoto: '',
      idPhoto: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: data });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Dosya yüklenemedi');
    }
    const json = await res.json();
    const url = json.fileUrl || json.url;
    if (!url) throw new Error('Dosya URL adresi oluşturulamadı.');
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const url = isEditing ? `/api/customers/${currentId}` : '/api/customers';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'İşlem başarısız.');

      setIsModalOpen(false);
      await loadCustomers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (customer: any) => {
    if (!confirm(`"${customer.name}" müşterisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Müşteri silinemedi.');
      await loadCustomers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add document to existing customer
  const handleAddDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!docModalCustomer) return;

    const form = e.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      alert('Lütfen bir belge fotoğrafı seçiniz.');
      return;
    }

    setUploading(true);
    try {
      const fileUrl = await handleFileUpload(file);
      const res = await fetch(`/api/customers/${docModalCustomer.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: uploadDocType,
          title: uploadDocTitle || `${docModalCustomer.name} - ${uploadDocType}`,
          fileUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Belge kaydedilemedi');
      }

      setUploadDocTitle('');
      fileInput.value = '';
      await loadCustomers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete customer document
  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Bu belgeyi silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/customers/${docModalCustomer.id}/documents?documentId=${docId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Belge silinemedi');
      await loadCustomers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.identityNo && c.identityNo.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q)) ||
      (c.activeVehicle && c.activeVehicle.plate.toLowerCase().includes(q))
    );
  });

  return (
    <AppLayout currentUser={currentUser} requiredFeature="customers">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            {t.cust_title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.cust_subtitle}
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t.cust_btn_new}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === 'sr'
                ? 'Pretraži ime klijenta, telefon, pasoš/JMBG, beleške ili tablicu...'
                : language === 'en'
                ? 'Search customer name, phone, passport/ID, notes, or plate...'
                : 'Müşteri adı, telefon, pasaport/kimlik no, notlar veya plaka ile ara...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'sr' ? 'Učitavanje klijenata...' : language === 'en' ? 'Loading customers...' : 'Müşteriler yükleniyor...'}
          </p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {language === 'sr' ? 'Klijent nije pronađen' : language === 'en' ? 'No customers found' : 'Müşteri Bulunamadı'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'sr' ? 'Nema klijenata koji odgovaraju pretrazi.' : language === 'en' ? 'No customers match your search criteria.' : 'Arama kriterlerine uygun müşteri kaydı yok.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">{language === 'sr' ? 'Ime i Prezime Klijenta' : language === 'en' ? 'Customer Name' : 'Müşteri Adı Soyadı'}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Kontakt' : language === 'en' ? 'Contact' : 'İletişim'}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Pasoš / Lična Karta' : language === 'en' ? 'Passport / ID' : 'Kimlik / Pasaport'}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Dokumenta' : language === 'en' ? 'Documents' : 'Kayıtlı Belgeler'}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Vozilo u Najmu' : language === 'en' ? 'Rented Vehicle' : 'Kiradaki Araç'}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Preostalo Vreme' : language === 'en' ? 'Remaining Time' : 'Kalan Süre'}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Beleška o Klijentu' : language === 'en' ? 'Customer Note' : 'Müşteri Notu'}</th>
                  <th className="py-3 px-4 text-right">{t.common_actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map((c) => {
                  const docCount = c.documents?.length || 0;
                  const hasPassport = c.documents?.some((d: any) => d.docType === 'PASSPORT');
                  const hasLicense = c.documents?.some((d: any) => d.docType === 'DRIVING_LICENSE');
                  const hasIdCard = c.documents?.some((d: any) => d.docType === 'ID_CARD');

                  return (
                    <tr key={c.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {language === 'sr' ? 'Registrovan: ' : language === 'en' ? 'Registered: ' : 'Kayıt: '} {formatDate(c.createdAt)}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {c.phone}
                        </div>
                        {/* Direct Call & WhatsApp Action Buttons */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <a
                            href={`tel:${(c.phone || '').replace(/[^0-9+]/g, '')}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                            title={language === 'sr' ? 'Pozovite direktno putem telefona' : language === 'en' ? 'Direct phone call' : 'GSM Üzerinden Doğrudan Ara'}
                          >
                            <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{language === 'sr' ? 'Pozovi' : language === 'en' ? 'Call' : 'Ara'}</span>
                          </a>
                          <a
                            href={`https://wa.me/${(c.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              language === 'sr'
                                ? `Poštovani ${c.name}, javljamo se iz firme ${companyName}.`
                                : language === 'en'
                                ? `Hello Mr/Ms ${c.name}, contacting you from ${companyName}.`
                                : `Merhaba Sayın ${c.name}, ${companyName} firmasından ulaşıyoruz.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-950/50 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 text-xs font-bold transition-colors cursor-pointer"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                        {c.email && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {c.email}
                          </div>
                        )}
                      </td>

                      {/* TC / Kimlik / Pasaport */}
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {c.identityNo || '-'}
                      </td>

                      {/* Belgeler (Fotoğraflar) */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setDocModalCustomer(c)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-slate-800 dark:text-slate-200 hover:text-amber-900 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          <FileImage className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span className="font-bold text-xs">{docCount} {language === 'sr' ? 'Dokumenata' : language === 'en' ? 'Docs' : 'Belge'}</span>
                          <div className="flex gap-1 ml-1">
                            {hasPassport && (
                              <span className="w-2 h-2 rounded-full bg-blue-500" title={language === 'sr' ? 'Ima Pasoš' : language === 'en' ? 'Has Passport' : 'Pasaport Var'} />
                            )}
                            {hasLicense && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" title={language === 'sr' ? 'Ima Vozačku' : language === 'en' ? 'Has License' : 'Ehliyet Var'} />
                            )}
                            {hasIdCard && (
                              <span className="w-2 h-2 rounded-full bg-purple-500" title={language === 'sr' ? 'Ima Ličnu Kartu' : language === 'en' ? 'Has ID' : 'Kimlik Var'} />
                            )}
                          </div>
                        </button>
                      </td>

                      {/* Kiradaki Araç */}
                      <td className="py-3.5 px-4">
                        {c.activeVehicle ? (
                          <Link
                            href={`/vehicles/${c.activeVehicle.vehicleId}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono font-bold transition-colors"
                          >
                            <Car className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            {c.activeVehicle.plate}
                            <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                              ({c.activeVehicle.owner})
                            </span>
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">
                            {language === 'sr' ? 'Slobodno' : language === 'en' ? 'Available' : 'Boşta'}
                          </span>
                        )}
                      </td>

                      {/* Kalan Süre */}
                      <td className="py-3.5 px-4">
                        {c.activeVehicle ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${
                              c.activeVehicle.remainingDays < 0
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                : c.activeVehicle.remainingDays === 0
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {c.activeVehicle.remainingText}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Müşteri Notu */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {c.notes ? (
                          <span className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-md border border-slate-200/60 dark:border-slate-700 block">
                            {c.notes}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDocModalCustomer(c)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg cursor-pointer transition-colors"
                            title={language === 'sr' ? 'Pregledaj / Dodaj Dokumenta' : language === 'en' ? 'View / Add Documents' : 'Belgeleri Görüntüle / Ekle'}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg cursor-pointer transition-colors"
                            title={t.common_edit}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer transition-colors"
                            title={t.common_delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Customer Documents View & Upload */}
      {docModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-amber-500" />
                  {language === 'sr' ? `Dokumenta Klijenta: ${docModalCustomer.name}` : language === 'en' ? `Customer Documents: ${docModalCustomer.name}` : `Müşteri Belgeleri: ${docModalCustomer.name}`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'sr' ? 'Upravljajte fotografijama lične karte, vozačke dozvole i pasoša' : language === 'en' ? 'Manage ID, driver license, and passport photos' : 'Kimlik, ehliyet ve pasaport fotoğraflarını yönetin'}
                </p>
              </div>
              <button
                onClick={() => setDocModalCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Gallery */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                {language === 'sr' ? `Priložena Dokumenta (${docModalCustomer.documents?.length || 0})` : language === 'en' ? `Uploaded Documents (${docModalCustomer.documents?.length || 0})` : `Yüklü Belgeler (${docModalCustomer.documents?.length || 0})`}
              </h4>

              {(!docModalCustomer.documents || docModalCustomer.documents.length === 0) ? (
                <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                  {language === 'sr' ? 'Trenutno nema priloženih dokumenata za ovog klijenta. Možete ih dodati putem forme ispod.' : language === 'en' ? 'No documents uploaded for this customer yet. You can add them using the form below.' : 'Henüz bu müşteri için yüklenmiş belge bulunmuyor. Aşağıdaki formdan ekleyebilirsiniz.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {docModalCustomer.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50/60 dark:bg-slate-800/40 relative group hover:border-amber-400 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Image preview / thumbnail */}
                        <div
                          onClick={() => setPreviewImage(doc.fileUrl)}
                          className="w-full h-32 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden cursor-pointer relative mb-2 flex items-center justify-center group-hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={doc.fileUrl}
                            alt={doc.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                            <Eye className="w-4 h-4 mr-1" /> {language === 'sr' ? 'Pregledaj' : language === 'en' ? 'View' : 'İncele'}
                          </div>
                        </div>

                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{doc.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {doc.docType === 'PASSPORT'
                            ? (language === 'sr' ? 'Pasoš' : language === 'en' ? 'Passport' : 'Pasaport')
                            : doc.docType === 'DRIVING_LICENSE'
                            ? (language === 'sr' ? 'Vozačka Dozvola' : language === 'en' ? 'Driver License' : 'Ehliyet')
                            : doc.docType === 'ID_CARD'
                            ? (language === 'sr' ? 'Lična Karta' : language === 'en' ? 'ID Card' : 'Kimlik Kartı')
                            : (language === 'sr' ? 'Ostali Dokument' : language === 'en' ? 'Other Document' : 'Diğer Belge')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
                        <span>{formatDate(doc.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                        >
                          {language === 'sr' ? 'Obriši' : language === 'en' ? 'Delete' : 'Sil'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload New Document Form */}
            <form onSubmit={handleAddDocument} className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-500" />
                {language === 'sr' ? 'Dodaj Novu Fotografiju Dokumenta' : language === 'en' ? 'Upload New Document Photo' : 'Yeni Belge Fotoğrafı Ekle'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'sr' ? 'Vrsta Dokumenta' : language === 'en' ? 'Document Type' : 'Belge Türü'}
                  </label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:border-amber-500 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="PASSPORT">{language === 'sr' ? 'Pasoš (Passport)' : language === 'en' ? 'Passport' : 'Pasaport (Passport)'}</option>
                    <option value="DRIVING_LICENSE">{language === 'sr' ? 'Vozačka Dozvola (Driving License)' : language === 'en' ? 'Driving License' : 'Sürücü Belgesi (Ehliyet)'}</option>
                    <option value="ID_CARD">{language === 'sr' ? 'Lična Karta (ID Card)' : language === 'en' ? 'ID Card' : 'Kimlik Kartı (ID Card)'}</option>
                    <option value="OTHER">{language === 'sr' ? 'Ostalo / Ugovor' : language === 'en' ? 'Other Document / Contract' : 'Diğer Evrak / Sözleşme'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'sr' ? 'Naziv Dokumenta' : language === 'en' ? 'Document Title' : 'Belge Başlığı'}
                  </label>
                  <input
                    type="text"
                    value={uploadDocTitle}
                    onChange={(e) => setUploadDocTitle(e.target.value)}
                    placeholder={language === 'sr' ? 'Npr: Boravak / Pasoš' : language === 'en' ? 'E.g. Resident Permit / Passport' : 'Örn: Sırbistan Oturum / Pasaport'}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:border-amber-500 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'sr' ? 'Izaberite Fajl (Fotografiju) *' : language === 'en' ? 'Select File (Photo) *' : 'Dosya Seç (Fotoğraf) *'}
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    required
                    className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
                >
                  {uploading
                    ? (language === 'sr' ? 'Otpremanje...' : language === 'en' ? 'Uploading...' : 'Yükleniyor...')
                    : (language === 'sr' ? 'Otpremi i Sačuvaj' : language === 'en' ? 'Upload & Save' : 'Belgeyi Yükle & Kaydet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-size Image Preview Modal via ImageLightbox */}
      {previewImage && (
        <ImageLightbox
          src={previewImage}
          title={docModalCustomer ? `${language === 'sr' ? 'Dokument' : language === 'en' ? 'Document' : 'Belge'}: ${docModalCustomer.name}` : (language === 'sr' ? 'Dokument Klijenta' : language === 'en' ? 'Customer Document' : 'Müşteri Belgesi')}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Modal: New / Edit Customer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? (language === 'sr' ? 'Izmeni Podatke o Klijentu' : language === 'en' ? 'Edit Customer Information' : 'Müşteri Bilgilerini Düzenle') : (language === 'sr' ? 'Dodaj Novog Klijenta' : language === 'en' ? 'Add New Customer' : 'Yeni Müşteri Ekle')}
        subtitle={language === 'sr' ? 'Evidencija klijenta i dokumenata za operacije' : language === 'en' ? 'Customer registration and documents for fleet operations' : 'Belgrad operasyonu için müşteri kaydı ve belgeleri'}
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'sr' ? 'Ime i Prezime / Naziv Preduzeća *' : language === 'en' ? 'Full Name / Company Name *' : 'Müşteri Adı Soyadı / Şirket Adı *'}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'sr' ? 'Npr: Marko Jovanović' : language === 'en' ? 'E.g. Marko Jovanovic' : 'Örn: Marko Jovanovic'}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Broj Telefona *' : language === 'en' ? 'Phone Number *' : 'Telefon Numarası *'}
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Örn: +381 64 123 4567"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Broj Pasoša / JMBG' : language === 'en' ? 'Passport / ID No' : 'Pasaport / Kimlik (JMBG) No'}
              </label>
              <input
                type="text"
                value={formData.identityNo}
                onChange={(e) => setFormData({ ...formData, identityNo: e.target.value })}
                placeholder={language === 'sr' ? 'Pasoš ili JMBG' : language === 'en' ? 'Passport or National ID' : 'Pasaport veya Sırbistan ID'}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Email Adresa' : language === 'en' ? 'Email Address' : 'E-posta Adresi'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="klijent@mail.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Adresa (Beograd)' : language === 'en' ? 'Address (Belgrade)' : 'Adres (Belgrad)'}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={language === 'sr' ? 'Knez Mihailova, Beograd' : language === 'en' ? 'Knez Mihailova, Belgrade' : 'Knez Mihailova, Belgrad'}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'sr' ? 'Posebne Beleške o Klijentu' : language === 'en' ? 'Special Notes About Customer' : 'Müşteri Hakkında Özel Notlar'}
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={language === 'sr' ? 'Pouzdanost klijenta, posebni zahtevi, depozit...' : language === 'en' ? 'Reliability rating, special requests, deposit notes...' : 'Müşteri güvenilirlik notu, özel istekler, depozito detayları...'}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* If creating new customer, allow uploading initial photos */}
          {!isEditing && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                {language === 'sr' ? 'Fotografije Dokumenata (Opciono)' : language === 'en' ? 'Document Photos (Optional)' : 'Belge Fotoğrafları (İsteğe Bağlı)'}
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-slate-600 mb-0.5">{language === 'sr' ? 'Pasoš' : language === 'en' ? 'Passport' : 'Pasaport'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleFileUpload(file);
                        setFormData((prev) => ({ ...prev, passportPhoto: url }));
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200 file:text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">{language === 'sr' ? 'Vozačka' : language === 'en' ? 'License' : 'Ehliyet'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleFileUpload(file);
                        setFormData((prev) => ({ ...prev, licensePhoto: url }));
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200 file:text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">{language === 'sr' ? 'Lična Karta' : language === 'en' ? 'ID Card' : 'Kimlik'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleFileUpload(file);
                        setFormData((prev) => ({ ...prev, idPhoto: url }));
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200 file:text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              {t.common_cancel}
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {formLoading
                ? (language === 'sr' ? 'Čuvanje...' : language === 'en' ? 'Saving...' : 'Kaydediliyor...')
                : isEditing
                ? (language === 'sr' ? 'Ažuriraj' : language === 'en' ? 'Update' : 'Güncelle')
                : (language === 'sr' ? 'Sačuvaj Klijenta' : language === 'en' ? 'Save Customer' : 'Müşteriyi Kaydet')}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CustomersContent />
    </Suspense>
  );
}
