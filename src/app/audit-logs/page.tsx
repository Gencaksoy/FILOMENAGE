'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  FileSpreadsheet,
  Download,
  Car,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { exportToExcel, exportToCSV } from '@/lib/exportExcel';
import { AuthUser } from '@/lib/auth-client';
import { useLanguage } from '@/lib/i18n';

function formatFriendlyAudit(
  log: any,
  lang: 'tr' | 'en' | 'sr'
): { actionTitle: string; friendlyDesc: string; badgeStyle: string } {
  const action = (log.action || '').toUpperCase();
  const target = log.target || '';
  const desc = log.description || '';

  // 1. Rental start (araba verildi)
  if (action.includes('RENTAL') && (action.includes('CREATE') || action.includes('START'))) {
    return {
      actionTitle:
        lang === 'sr' ? 'Vozilo Iznajmljeno' : lang === 'en' ? 'Vehicle Rented' : 'Araba Verildi',
      friendlyDesc: target
        ? lang === 'sr'
          ? `Vozilo ${target} je iznajmljeno i predato klijentu.`
          : lang === 'en'
          ? `Vehicle ${target} rented and delivered to client.`
          : `${target} aracı kiralandı ve müşteriye teslim edildi.`
        : desc || (lang === 'sr' ? 'Vozilo je iznajmljeno.' : lang === 'en' ? 'Vehicle rented.' : 'Araç kiralandı.'),
      badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    };
  }

  // 2. Rental return (araba alındı)
  if (action.includes('RETURN') || desc.toLowerCase().includes('teslim alındı') || desc.toLowerCase().includes('iade') || desc.toLowerCase().includes('preuzeto')) {
    return {
      actionTitle:
        lang === 'sr' ? 'Vozilo Vraćeno' : lang === 'en' ? 'Vehicle Returned' : 'Araba Alındı',
      friendlyDesc: target
        ? lang === 'sr'
          ? `Vozilo ${target} je uspešno preuzeto nazad od klijenta.`
          : lang === 'en'
          ? `Vehicle ${target} successfully returned from client.`
          : `${target} aracı müşteriden geri teslim alındı.`
        : desc || (lang === 'sr' ? 'Vozilo je preuzeto.' : lang === 'en' ? 'Vehicle returned.' : 'Araç teslim alındı.'),
      badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    };
  }

  // 3. Rental extension (süre uzatıldı)
  if (action.includes('EXTEND') || desc.toLowerCase().includes('uzat') || desc.toLowerCase().includes('produž')) {
    return {
      actionTitle:
        lang === 'sr' ? 'Produžen Najam' : lang === 'en' ? 'Rental Extended' : 'Süre Uzatıldı',
      friendlyDesc: target
        ? lang === 'sr'
          ? `Rok najma za vozilo ${target} je produžen.`
          : lang === 'en'
          ? `Rental period for vehicle ${target} was extended.`
          : `${target} aracının kiralama süresi uzatıldı.`
        : desc || (lang === 'sr' ? 'Rok najma produžen.' : lang === 'en' ? 'Rental extended.' : 'Kira süresi uzatıldı.'),
      badgeStyle: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    };
  }

  // 4. Oil change (yağ değiştirildi)
  if (action.includes('OIL') || desc.toLowerCase().includes('yağ') || desc.toLowerCase().includes('ulje')) {
    return {
      actionTitle:
        lang === 'sr' ? 'Zamenjeno Motorno Ulje' : lang === 'en' ? 'Oil Changed' : 'Yağ Değiştirildi',
      friendlyDesc: target
        ? lang === 'sr'
          ? `Motorno ulje i filter za vozilo ${target} su zamenjeni.`
          : lang === 'en'
          ? `Engine oil and filter replaced for vehicle ${target}.`
          : `${target} aracının motor yağı ve filtresi değiştirildi.`
        : desc || (lang === 'sr' ? 'Zamenjeno motorno ulje.' : lang === 'en' ? 'Oil change performed.' : 'Motor yağı değişimi yapıldı.'),
      badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    };
  }

  // 5. Maintenance (bakım yapıldı)
  if (action.includes('MAINTENANCE') || desc.toLowerCase().includes('bakım') || desc.toLowerCase().includes('servis')) {
    return {
      actionTitle:
        lang === 'sr' ? 'Servis Urađen' : lang === 'en' ? 'Maintenance Done' : 'Bakım Yapıldı',
      friendlyDesc: target
        ? lang === 'sr'
          ? `Vozilo ${target} je završilo servisno održavanje.`
          : lang === 'en'
          ? `Service maintenance completed for vehicle ${target}.`
          : `${target} aracına servis bakımı yapıldı.`
        : desc || (lang === 'sr' ? 'Servisno održavanje urađeno.' : lang === 'en' ? 'Service maintenance performed.' : 'Servis bakımı yapıldı.'),
      badgeStyle: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    };
  }

  // 6. Inspection (muayene yapıldı)
  if (action.includes('INSPECTION') || desc.toLowerCase().includes('muayene') || desc.toLowerCase().includes('pregled')) {
    return {
      actionTitle:
        lang === 'sr' ? 'Tehnički Pregled Urađen' : lang === 'en' ? 'Inspection Completed' : 'Muayene Yapıldı',
      friendlyDesc: target
        ? lang === 'sr'
          ? `Godišnji tehnički pregled i registracija vozila ${target} su završeni.`
          : lang === 'en'
          ? `Annual technical inspection completed for vehicle ${target}.`
          : `${target} aracının yıllık araç muayenesi tamamlandı.`
        : desc || (lang === 'sr' ? 'Tehnički pregled završen.' : lang === 'en' ? 'Inspection completed.' : 'Araç muayenesi yapıldı.'),
      badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    };
  }

  // 7. Parking ticket (park cezası)
  if (action.includes('PARKING') || desc.toLowerCase().includes('ceza') || desc.toLowerCase().includes('edpk') || desc.toLowerCase().includes('kazna')) {
    return {
      actionTitle:
        lang === 'sr' ? 'Parking Kazna (eDPK)' : lang === 'en' ? 'Parking Ticket (eDPK)' : 'Park Cezası',
      friendlyDesc: target
        ? lang === 'sr'
          ? `Za vozilo ${target} je uneta parking kazna Parking Servisa (eDPK).`
          : lang === 'en'
          ? `Belgrade Parking Servis fine (eDPK) logged for ${target}.`
          : `${target} aracı için Belgrad park cezası (eDPK) işlendi.`
        : desc || (lang === 'sr' ? 'Parking kazna zabeležena.' : lang === 'en' ? 'Parking ticket logged.' : 'Park cezası kaydedildi.'),
      badgeStyle: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    };
  }

  // 8. Vehicle fault (arıza kaydı)
  if (action.includes('FAULT') || desc.toLowerCase().includes('arıza') || desc.toLowerCase().includes('kvar')) {
    return {
      actionTitle:
        lang === 'sr' ? 'Prijava Kvara' : lang === 'en' ? 'Fault Reported' : 'Arıza Kaydı',
      friendlyDesc: target
        ? lang === 'sr'
          ? `Za vozilo ${target} je zabeležen ili ažuriran kvar.`
          : lang === 'en'
          ? `Vehicle fault reported or updated for ${target}.`
          : `${target} aracı için arıza kaydı girildi / güncellendi.`
        : desc || (lang === 'sr' ? 'Kvar evidentiran.' : lang === 'en' ? 'Fault recorded.' : 'Arıza bildirimi yapıldı.'),
      badgeStyle: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    };
  }

  // 9. Vehicle create (araba eklendi)
  if (action.includes('VEHICLE') && action.includes('CREATE')) {
    return {
      actionTitle:
        lang === 'sr' ? 'Novo Vozilo Dodato' : lang === 'en' ? 'Vehicle Added' : 'Araba Eklendi',
      friendlyDesc: target
        ? lang === 'sr'
          ? `Vozilo ${target} je uspešno registrovano u flotu.`
          : lang === 'en'
          ? `Vehicle ${target} was added to the fleet inventory.`
          : `${target} yeni araç olarak filoya kaydedildi.`
        : desc || (lang === 'sr' ? 'Novo vozilo dodato u flotu.' : lang === 'en' ? 'New vehicle added.' : 'Yeni araç eklendi.'),
      badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    };
  }

  // 10. Customer create (müşteri eklendi)
  if (action.includes('CUSTOMER') && action.includes('CREATE')) {
    return {
      actionTitle:
        lang === 'sr' ? 'Novi Klijent Dodat' : lang === 'en' ? 'Customer Added' : 'Müşteri Eklendi',
      friendlyDesc: target
        ? lang === 'sr'
          ? `Klijent ${target} je dodat u bazu klijenata.`
          : lang === 'en'
          ? `Customer ${target} was added to client directory.`
          : `${target} sisteme yeni müşteri olarak eklendi.`
        : desc || (lang === 'sr' ? 'Novi klijent registrovan.' : lang === 'en' ? 'New customer registered.' : 'Yeni müşteri kaydedildi.'),
      badgeStyle: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    };
  }

  // 11. User password change / suspend
  if (action.includes('PASSWORD') || action.includes('SUSPEND') || action.includes('USER')) {
    return {
      actionTitle: action.includes('SUSPEND')
        ? lang === 'sr' ? 'Korisnik Suspendovan' : lang === 'en' ? 'User Suspended' : 'Kullanıcı Askıya Alındı'
        : lang === 'sr' ? 'Korisnik Ažuriran' : lang === 'en' ? 'User Updated' : 'Kullanıcı Güncellendi',
      friendlyDesc: desc || (lang === 'sr' ? `Izvršena radnja nad korisnikom ${target}.` : lang === 'en' ? `Action performed on user ${target}.` : `${target} kullanıcısı işlem gördü.`),
      badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    };
  }

  // Default clean fallback
  return {
    actionTitle: action.replace(/_/g, ' '),
    friendlyDesc: desc || (lang === 'sr' ? 'Sistemska operacija izvršena.' : lang === 'en' ? 'System action performed.' : 'Sistem işlemi yapıldı.'),
    badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };
}

export default function AuditLogsPage() {
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((u) => {
        if (u?.user) setCurrentUser(u.user);
        else window.location.href = '/login';
      });

    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      !search ||
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.target && l.target.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExportExcel = () => {
    const data = filteredLogs.map((l) => {
      const friendly = formatFriendlyAudit(l, language);
      return {
        [language === 'sr' ? 'Datum i Vreme' : language === 'en' ? 'Date & Time' : 'Tarih']: formatDateTime(l.createdAt),
        [language === 'sr' ? 'Korisnik' : language === 'en' ? 'User' : 'İşlemi Yapan']: l.userName,
        [language === 'sr' ? 'Vozilo / Cilj' : language === 'en' ? 'Target Vehicle' : 'İlgili Araç / Hedef']: l.target || '-',
        [language === 'sr' ? 'Akcija' : language === 'en' ? 'Action' : 'İşlem']: friendly.actionTitle,
        [language === 'sr' ? 'Opis' : language === 'en' ? 'Description' : 'Açıklama']: friendly.friendlyDesc,
      };
    });
    exportToExcel(data, `Audit_Log_${new Date().toISOString().slice(0, 10)}.xlsx`, 'Audit Log');
  };

  const handleExportCSV = () => {
    const data = filteredLogs.map((l) => {
      const friendly = formatFriendlyAudit(l, language);
      return {
        [language === 'sr' ? 'Datum' : language === 'en' ? 'Date' : 'Tarih']: formatDate(l.createdAt),
        [language === 'sr' ? 'Korisnik' : language === 'en' ? 'User' : 'Kullanici']: l.userName,
        [language === 'sr' ? 'Cilj' : language === 'en' ? 'Target' : 'Hedef']: l.target || '-',
        [language === 'sr' ? 'Akcija' : language === 'en' ? 'Action' : 'Islem']: friendly.actionTitle,
        [language === 'sr' ? 'Opis' : language === 'en' ? 'Description' : 'Aciklama']: friendly.friendlyDesc,
      };
    });
    exportToCSV(data, `Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AppLayout currentUser={currentUser} requiredFeature="auditLogs" adminOnly={true}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-amber-500" />
            {t.audit_title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.audit_subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6 shadow-xs transition-colors">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === 'sr'
                ? 'Pretraži tablicu (npr: BG 1709-OT), akciju ili korisnika...'
                : language === 'en'
                ? 'Search plate (e.g. BG 1709-OT), action or user...'
                : 'Plaka (Örn: BG 1709-OT), işlem veya kullanıcı ara...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Log Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'sr'
              ? 'Evidencija aktivnosti se učitava...'
              : language === 'en'
              ? 'Loading activity logs...'
              : 'İşlem kayıtları yükleniyor...'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">
                    {language === 'sr' ? 'Datum i Vreme' : language === 'en' ? 'Date & Time' : 'Tarih & Saat'}
                  </th>
                  <th className="py-3 px-4">
                    {language === 'sr' ? 'Korisnik' : language === 'en' ? 'User' : 'İşlemi Yapan'}
                  </th>
                  <th className="py-3 px-4">
                    {language === 'sr' ? 'Vozilo / Cilj' : language === 'en' ? 'Vehicle / Target' : 'İlgili Araç / Hedef'}
                  </th>
                  <th className="py-3 px-4">
                    {language === 'sr' ? 'Događaj / Akcija' : language === 'en' ? 'Event / Action' : 'İşlem'}
                  </th>
                  <th className="py-3 px-4">
                    {language === 'sr' ? 'Opis Izvršene Radnje' : language === 'en' ? 'Action Description' : 'Yapılan İşlem Açıklaması'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-900 dark:text-white">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                      {language === 'sr'
                        ? 'Nisu pronađeni zapisi aktivnosti po zadatim kriterijumima.'
                        : language === 'en'
                        ? 'No activity logs found matching criteria.'
                        : 'Kriterlere uygun işlem geçmişi bulunamadı.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const friendly = formatFriendlyAudit(log, language);
                    return (
                      <tr key={log.id} className="hover:bg-amber-50/20 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {log.userName}
                        </td>
                        <td className="py-3.5 px-4">
                          {log.target ? (
                            <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                              <Car className="w-3 h-3 text-amber-500" />
                              {log.target}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              {language === 'sr' ? 'Opšti Sistem' : language === 'en' ? 'General System' : 'Genel Sistem'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${friendly.badgeStyle}`}
                          >
                            {friendly.actionTitle}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                          {friendly.friendlyDesc}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
