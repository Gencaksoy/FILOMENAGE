'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'tr' | 'en' | 'sr';

export interface Translations {
  // Navigation / Sidebar
  nav_dashboard: string;
  nav_super_admin: string;
  nav_vehicles: string;
  nav_customers: string;
  nav_maintenance: string;
  nav_inspection: string;
  nav_parking_tickets: string;
  nav_notifications: string;
  nav_audit_logs: string;
  nav_users: string;
  nav_settings: string;
  nav_main_menu: string;
  nav_belgrade_operation: string;

  // Header
  header_search_placeholder: string;
  header_notifications: string;
  header_my_profile: string;
  header_change_password: string;
  header_sign_out: string;
  header_staff_mode: string;
  header_admin_mode: string;
  header_super_admin_mode: string;
  header_theme_toggle: string;
  header_theme_light: string;
  header_theme_dark: string;
  header_language: string;

  // Dashboard & KPIs
  kpi_rented: string;
  kpi_available: string;
  kpi_post_check: string;
  kpi_maintenance: string;
  kpi_return_7days: string;
  kpi_total_revenue: string;
  kpi_total_expenses: string;
  kpi_net_profit: string;
  kpi_cost_per_car: string;
  kpi_occupancy: string;
  kpi_amortization_left: string;
  kpi_investment_progress: string;

  // Actions
  action_rent_vehicle: string;
  action_oil_change: string;
  action_refresh: string;
  action_save: string;
  action_cancel: string;
  action_close: string;
  action_details: string;
  action_filter: string;
  action_search: string;
  action_extend_rental: string;
  action_return_vehicle: string;
  action_whatsapp_remind: string;
  action_add_new: string;
  action_edit: string;
  action_delete: string;

  // Alerts & Operational Badges
  alert_registration_expiring: string;
  alert_registration_desc: string;
  alert_parking_tickets: string;
  alert_active_faults: string;
  alert_fleet_suspended: string;
  alert_module_disabled: string;

  // Authentication & Validation
  auth_login: string;
  auth_register: string;
  auth_fleet_code: string;
  auth_email: string;
  auth_password: string;
  auth_password_rules: string;
  auth_password_rule_len: string;
  auth_password_rule_upper: string;
  auth_password_rule_lower: string;
  auth_password_rule_number: string;
  auth_email_invalid: string;
  auth_email_disposable: string;
  auth_email_not_exist: string;
  auth_realistic_email_hint: string;
}

const translations: Record<Language, Translations> = {
  tr: {
    nav_dashboard: 'Dashboard',
    nav_super_admin: 'Süper Yönetici Paneli',
    nav_vehicles: 'Araçlar',
    nav_customers: 'Müşteriler & Belgeler',
    nav_maintenance: 'Bakım & Yağ Takibi',
    nav_inspection: 'Yıllık Muayene & Registracija',
    nav_parking_tickets: 'Park Cezaları (eDPK)',
    nav_notifications: 'Bildirimler',
    nav_audit_logs: 'İşlem Geçmişi (Audit)',
    nav_users: 'Kullanıcılar',
    nav_settings: 'Sistem Ayarları',
    nav_main_menu: 'Ana Menü',
    nav_belgrade_operation: 'Beograd Operasyon (EUR)',

    header_search_placeholder: 'Plaka, müşteri veya telefon ara...',
    header_notifications: 'Bildirimler',
    header_my_profile: 'Profilim',
    header_change_password: 'Şifre Değiştir',
    header_sign_out: 'Çıkış Yap',
    header_staff_mode: 'Çalışan Modu',
    header_admin_mode: 'Filo Yöneticisi',
    header_super_admin_mode: 'Süper Yönetici',
    header_theme_toggle: 'Temayı Değiştir',
    header_theme_light: 'Açık Tema',
    header_theme_dark: 'Koyu Tema',
    header_language: 'Dil',

    kpi_rented: 'Kirada',
    kpi_available: 'Boşta (Hazır)',
    kpi_post_check: 'Kira Sonrası Kontrol',
    kpi_maintenance: 'Serviste',
    kpi_return_7days: '1 Hafta İçinde Dönecek',
    kpi_total_revenue: 'Toplam Ciro (Kira)',
    kpi_total_expenses: 'Toplam Masraflar',
    kpi_net_profit: 'Net Kâr / Bakiye',
    kpi_cost_per_car: 'Araç Başı Masraf',
    kpi_occupancy: 'Filo Doluluk',
    kpi_amortization_left: 'Amorti Kalan',
    kpi_investment_progress: 'Yatırımın Kendini Çıkarma İlerlemesi',

    action_rent_vehicle: 'Araç Kirala',
    action_oil_change: 'Yağ Değişimi',
    action_refresh: 'Verileri Yenile',
    action_save: 'Kaydet',
    action_cancel: 'İptal',
    action_close: 'Kapat',
    action_details: 'Detay',
    action_filter: 'Filtrele',
    action_search: 'Ara',
    action_extend_rental: 'Süre Uzat',
    action_return_vehicle: 'Aracı Teslim Al',
    action_whatsapp_remind: 'WhatsApp ile Hatırlat',
    action_add_new: 'Yeni Ekle',
    action_edit: 'Düzenle',
    action_delete: 'Sil',

    alert_registration_expiring: 'Zorunlu Registracija (Tescil) Süresi Biten / Yaklaşan Araçlar',
    alert_registration_desc: 'Sırbistan yasalarına göre register süresi biten araç trafiğe çıkamaz. Lütfen süresi bitmeden yenileyiniz.',
    alert_parking_tickets: 'Bekleyen Belgrad Parking Servis Cezaları (eDPK)',
    alert_active_faults: 'Devam Eden Kritik Araç Arızaları',
    alert_fleet_suspended: 'Filonuz Askıya Alınmıştır - Lisans / Abonelik Ödemenizi Yenileyiniz',
    alert_module_disabled: 'Bu Modül Filonuz İçin Devre Dışı Bırakılmıştır',

    auth_login: 'Giriş Yap',
    auth_register: 'Filo Kodu İle Kayıt Ol',
    auth_fleet_code: 'Filo Kodu',
    auth_email: 'E-posta Adresi',
    auth_password: 'Şifre',
    auth_password_rules: 'Şifreniz en az 6 karakter olmalı; büyük harf, küçük harf ve rakam içermelidir.',
    auth_password_rule_len: 'En az 6 karakter',
    auth_password_rule_upper: 'En az 1 büyük harf (A-Z)',
    auth_password_rule_lower: 'En az 1 küçük harf (a-z)',
    auth_password_rule_number: 'En az 1 rakam (0-9)',
    auth_email_invalid: 'Lütfen geçerli ve gerçek bir e-posta adresi giriniz.',
    auth_email_disposable: 'Geçici / tek kullanımlık e-posta adresleri kabul edilmemektedir.',
    auth_email_not_exist: 'Girilen e-posta alan adına ait aktif bir posta sunucusu bulunamadı.',
    auth_realistic_email_hint: 'Örn: ad.soyad@sirketiniz.com veya ad@gmail.com',
  },
  en: {
    nav_dashboard: 'Dashboard',
    nav_super_admin: 'Super Admin Panel',
    nav_vehicles: 'Vehicles',
    nav_customers: 'Customers & Documents',
    nav_maintenance: 'Maintenance & Oil',
    nav_inspection: 'Annual Inspection & Regi',
    nav_parking_tickets: 'Parking Tickets (eDPK)',
    nav_notifications: 'Notifications',
    nav_audit_logs: 'Audit Logs',
    nav_users: 'Users',
    nav_settings: 'System Settings',
    nav_main_menu: 'Main Menu',
    nav_belgrade_operation: 'Belgrade Operations (EUR)',

    header_search_placeholder: 'Search plate, customer or phone...',
    header_notifications: 'Notifications',
    header_my_profile: 'My Profile',
    header_change_password: 'Change Password',
    header_sign_out: 'Sign Out',
    header_staff_mode: 'Staff Mode',
    header_admin_mode: 'Fleet Admin',
    header_super_admin_mode: 'Super Admin',
    header_theme_toggle: 'Toggle Theme',
    header_theme_light: 'Light Theme',
    header_theme_dark: 'Dark Theme',
    header_language: 'Language',

    kpi_rented: 'Rented',
    kpi_available: 'Available',
    kpi_post_check: 'Post-Rental Check',
    kpi_maintenance: 'In Service',
    kpi_return_7days: 'Returning in 7 Days',
    kpi_total_revenue: 'Total Revenue (Rent)',
    kpi_total_expenses: 'Total Expenses',
    kpi_net_profit: 'Net Profit / Balance',
    kpi_cost_per_car: 'Avg Cost / Vehicle',
    kpi_occupancy: 'Fleet Occupancy',
    kpi_amortization_left: 'Amortization Left',
    kpi_investment_progress: 'Fleet Amortization & ROI Progress',

    action_rent_vehicle: 'Rent Vehicle',
    action_oil_change: 'Oil Change',
    action_refresh: 'Refresh Data',
    action_save: 'Save',
    action_cancel: 'Cancel',
    action_close: 'Close',
    action_details: 'Details',
    action_filter: 'Filter',
    action_search: 'Search',
    action_extend_rental: 'Extend Rental',
    action_return_vehicle: 'Return Vehicle',
    action_whatsapp_remind: 'Remind on WhatsApp',
    action_add_new: 'Add New',
    action_edit: 'Edit',
    action_delete: 'Delete',

    alert_registration_expiring: 'Mandatory Vehicle Registracija Expiring Soon',
    alert_registration_desc: 'According to Serbian traffic law, vehicles with expired registration cannot drive. Please renew promptly.',
    alert_parking_tickets: 'Unpaid Belgrade Parking Servis Tickets (eDPK)',
    alert_active_faults: 'Critical Active Vehicle Faults',
    alert_fleet_suspended: 'Fleet Suspended - Please Renew License / Subscription',
    alert_module_disabled: 'This Module is Disabled for Your Fleet',

    auth_login: 'Sign In',
    auth_register: 'Register with Fleet Code',
    auth_fleet_code: 'Fleet Code',
    auth_email: 'Email Address',
    auth_password: 'Password',
    auth_password_rules: 'Password must be at least 6 characters and contain uppercase, lowercase letters and numbers.',
    auth_password_rule_len: 'At least 6 characters',
    auth_password_rule_upper: 'At least 1 uppercase (A-Z)',
    auth_password_rule_lower: 'At least 1 lowercase (a-z)',
    auth_password_rule_number: 'At least 1 number (0-9)',
    auth_email_invalid: 'Please enter a valid and realistic email address.',
    auth_email_disposable: 'Disposable / temporary email services are not allowed.',
    auth_email_not_exist: 'No active mail server found for this domain.',
    auth_realistic_email_hint: 'E.g.: name.surname@company.com or name@gmail.com',
  },
  sr: {
    nav_dashboard: 'Kontrolna tabla',
    nav_super_admin: 'Super Admin Panel',
    nav_vehicles: 'Vozni park',
    nav_customers: 'Klijenti i dokumenti',
    nav_maintenance: 'Održavanje i ulje',
    nav_inspection: 'Tehnički pregled i registracija',
    nav_parking_tickets: 'Parking kazne (eDPK)',
    nav_notifications: 'Obaveštenja',
    nav_audit_logs: 'Istorija aktivnosti',
    nav_users: 'Korisnici',
    nav_settings: 'Podešavanja sistema',
    nav_main_menu: 'Glavni meni',
    nav_belgrade_operation: 'Beogradska operacija (EUR)',

    header_search_placeholder: 'Pretraži tablicu, klijenta ili telefon...',
    header_notifications: 'Obaveštenja',
    header_my_profile: 'Moj profil',
    header_change_password: 'Promeni lozinku',
    header_sign_out: 'Odjavi se',
    header_staff_mode: 'Zaposleni režim',
    header_admin_mode: 'Upravnik flote',
    header_super_admin_mode: 'Super administrator',
    header_theme_toggle: 'Promeni temu',
    header_theme_light: 'Svetla tema',
    header_theme_dark: 'Tamna tema',
    header_language: 'Jezik',

    kpi_rented: 'Iznajmljeno',
    kpi_available: 'Slobodno (spremno)',
    kpi_post_check: 'Kontrola nakon zakupa',
    kpi_maintenance: 'U servisu',
    kpi_return_7days: 'Vraća se za 7 dana',
    kpi_total_revenue: 'Ukupan prihod (zakup)',
    kpi_total_expenses: 'Ukupni troškovi',
    kpi_net_profit: 'Neto dobit / saldo',
    kpi_cost_per_car: 'Trošak po vozilu',
    kpi_occupancy: 'Popunjenost flote',
    kpi_amortization_left: 'Preostala amortizacija',
    kpi_investment_progress: 'Napredak amortizacije flote',

    action_rent_vehicle: 'Iznajmi vozilo',
    action_oil_change: 'Zamena ulja',
    action_refresh: 'Osveži podatke',
    action_save: 'Sačuvaj',
    action_cancel: 'Otkaži',
    action_close: 'Zatvori',
    action_details: 'Detalji',
    action_filter: 'Filter',
    action_search: 'Pretraži',
    action_extend_rental: 'Produži zakup',
    action_return_vehicle: 'Preuzmi vozilo nazad',
    action_whatsapp_remind: 'Podseti preko WhatsApp-a',
    action_add_new: 'Dodaj novo',
    action_edit: 'Izmeni',
    action_delete: 'Obriši',

    alert_registration_expiring: 'Vozila kojima ističe obavezna registracija',
    alert_registration_desc: 'Prema zakonima Republike Srbije vozilo bez važeće registracije ne sme učestvovati u saobraćaju. Molimo obnovite na vreme.',
    alert_parking_tickets: 'Neplaćene kazne Parking Servisa Beograd (eDPK)',
    alert_active_faults: 'Kritični aktivni kvarovi na vozilima',
    alert_fleet_suspended: 'Flota je suspendovana - Molimo obnovite licencu / pretplatu',
    alert_module_disabled: 'Ovaj modul je isključen za vašu flotu',

    auth_login: 'Prijavi se',
    auth_register: 'Registracija pomoću koda flote',
    auth_fleet_code: 'Kod flote',
    auth_email: 'Imejl adresa',
    auth_password: 'Lozinka',
    auth_password_rules: 'Lozinka mora imati najmanje 6 karaktera, velika i mala slova i brojeve.',
    auth_password_rule_len: 'Najmanje 6 karaktera',
    auth_password_rule_upper: 'Najmanje 1 veliko slovo (A-Z)',
    auth_password_rule_lower: 'Najmanje 1 malo slovo (a-z)',
    auth_password_rule_number: 'Najmanje 1 broj (0-9)',
    auth_email_invalid: 'Molimo unesite ispravnu i realnu imejl adresu.',
    auth_email_disposable: 'Privremeni (jednokratni) imejlovi nisu dozvoljeni.',
    auth_email_not_exist: 'Nije pronađen aktivan imejl server za ovaj domen.',
    auth_realistic_email_hint: 'Npr: ime.prezime@kompanija.rs ili ime@gmail.com',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'tr',
  setLanguage: () => {},
  t: translations.tr,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('tr');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('filo_language') as Language;
      if (saved && (saved === 'tr' || saved === 'en' || saved === 'sr')) {
        setLanguageState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('filo_language', lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  };

  const t = translations[language] || translations.tr;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
