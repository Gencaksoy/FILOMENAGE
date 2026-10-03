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

  // Landing Page
  landing_features: string;
  landing_advantages: string;
  landing_how_it_works: string;
  landing_pricing: string;
  landing_hero_badge: string;
  landing_hero_title_1: string;
  landing_hero_title_2: string;
  landing_hero_desc: string;
  landing_hero_cta_register: string;
  landing_hero_cta_buy: string;
  landing_fleet_code_placeholder: string;
  landing_verify_btn: string;
  landing_stat_1_val: string;
  landing_stat_1_lbl: string;
  landing_stat_2_val: string;
  landing_stat_2_lbl: string;
  landing_stat_3_val: string;
  landing_stat_3_lbl: string;
  landing_comparison_title: string;
  landing_comparison_subtitle: string;
  landing_comparison_old: string;
  landing_comparison_new: string;
  landing_pricing_title: string;
  landing_pricing_subtitle: string;
  landing_pricing_starter: string;
  landing_pricing_pro: string;
  landing_pricing_enterprise: string;
  landing_pricing_btn: string;
  landing_contact_title: string;
  landing_contact_desc: string;
  landing_contact_whatsapp: string;
  landing_footer_rights: string;

  // Dashboard specifics
  dash_top_banner_title: string;
  dash_top_banner_subtitle: string;
  dash_all_fleet: string;
  dash_forecast_title: string;
  dash_forecast_overdue: string;
  dash_forecast_today: string;
  dash_forecast_3days: string;
  dash_forecast_7days: string;
  dash_top_expense_title: string;
  dash_top_fault_title: string;
  dash_analytics_table_title: string;
  dash_analytics_table_subtitle: string;
  dash_col_plate: string;
  dash_col_vehicle: string;
  dash_col_owner: string;
  dash_col_status: string;
  dash_col_investment: string;
  dash_col_revenue: string;
  dash_col_maint: string;
  dash_col_oil: string;
  dash_col_regi: string;
  dash_col_total_expense: string;
  dash_col_net_profit: string;
  dash_col_margin: string;
  dash_col_services: string;
  dash_col_actions: string;
  dash_btn_extend: string;
  dash_btn_return: string;
  dash_btn_remind: string;
  dash_loading_portal: string;
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

    landing_features: 'Özellikler',
    landing_advantages: 'Avantajlar',
    landing_how_it_works: 'Nasıl Çalışır?',
    landing_pricing: 'Paketler & Fiyatlandırma',
    landing_hero_badge: 'Modern Filo & Rent a Car SaaS',
    landing_hero_title_1: 'Filonuzu Akıllıca Yönetin,',
    landing_hero_title_2: 'Karmaşayı Arkada Bırakın.',
    landing_hero_desc: 'Belgrad Parking Servis cezaları, registracija muayene takvimi, motor yağı takibi, kiralama sözleşmeleri ve şeffaf ortak kasası tek bir modern platformda.',
    landing_hero_cta_register: 'Filo Koduyla Kayıt Ol',
    landing_hero_cta_buy: 'Filo Kodu Satın Al (WhatsApp)',
    landing_fleet_code_placeholder: 'Filo Kodunuzu Girin (Örn: FL-1001)',
    landing_verify_btn: 'Kodu Doğrula & Başla',
    landing_stat_1_val: '100+',
    landing_stat_1_lbl: 'Aktif Yönetilen Araç',
    landing_stat_2_val: '%40',
    landing_stat_2_lbl: 'Operasyonel Zaman Tasarrufu',
    landing_stat_3_val: '7/24',
    landing_stat_3_lbl: 'Kesintisiz Bildirim & Kontrol',
    landing_comparison_title: 'Eski Yöntemler vs. Modern Filo Yönetim & Raporlama Platformu',
    landing_comparison_subtitle: 'Kağıt, Excel ve unutulan tescil süreleri yüzünden para kaybetmeyi bırakın.',
    landing_comparison_old: 'Eski Yöntemler (Excel / Defter)',
    landing_comparison_new: 'Modern Filo SaaS Platformu',
    landing_pricing_title: 'Şeffaf & Ölçeklenebilir Filo Lisansları',
    landing_pricing_subtitle: 'SaaS yöneticisi ile doğrudan iletişime geçerek filonuza özel kodunuzu temin edin.',
    landing_pricing_starter: 'Başlangıç Filo',
    landing_pricing_pro: 'Profesyonel Filo',
    landing_pricing_enterprise: 'Kurumsal & Çok Ortaklı',
    landing_pricing_btn: 'Filo Kodu Satın Al (WhatsApp)',
    landing_contact_title: 'Filonuzu Bugün Geleceğe Taşıyın',
    landing_contact_desc: 'SaaS Yöneticisi ile iletişime geçerek hemen filo kodunuzu temin edin ve operasyonunuzu kontrol altına alın.',
    landing_contact_whatsapp: 'Yetkili ile İletişime Geç (+381 617 027 504)',
    landing_footer_rights: 'Tüm hakları saklıdır. Belgrad Filo Yönetim & Operasyon SaaS.',

    dash_top_banner_title: 'Filo Yönetim & Kiralama Takip Paneli',
    dash_top_banner_subtitle: 'Filo araçları, Registracija muayene takvimi, teslimat kontrolleri ve amortisman takibi.',
    dash_all_fleet: 'Tüm Filo',
    dash_forecast_title: 'Yaklaşan Araç Teslimatları & İade Takvimi',
    dash_forecast_overdue: 'Gecikmiş İadeler',
    dash_forecast_today: 'BUGÜN İade Alınacak',
    dash_forecast_3days: 'Gelecek 3 Günde',
    dash_forecast_7days: 'Bu Hafta (7 Gün)',
    dash_top_expense_title: 'En Çok Masraf Çıkaran Araçlar',
    dash_top_fault_title: 'En Çok Arıza Yapan Araçlar',
    dash_analytics_table_title: 'Araç Başına Detaylı Masraf, Gelir & Performans Tablosu',
    dash_analytics_table_subtitle: 'Her aracın kira geliri, yapılan bakım/onarım giderleri ve net kârlılığı',
    dash_col_plate: 'Plaka',
    dash_col_vehicle: 'Araç Marka & Model',
    dash_col_owner: 'Sahip / Ortak',
    dash_col_status: 'Durum',
    dash_col_investment: 'Satın Alma',
    dash_col_revenue: 'Kira Geliri',
    dash_col_maint: 'Bakım',
    dash_col_oil: 'Motor Yağı',
    dash_col_regi: 'Registracija',
    dash_col_total_expense: 'Toplam Masraf',
    dash_col_net_profit: 'Net Kâr',
    dash_col_margin: 'Masraf Oranı',
    dash_col_services: 'Servis & Arıza',
    dash_col_actions: 'İşlemler',
    dash_btn_extend: 'Süre Uzat',
    dash_btn_return: 'Teslim Al',
    dash_btn_remind: 'Hatırlat',
    dash_loading_portal: 'Filo Yönetim Portalı Açılıyor...',
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
    kpi_maintenance: 'Maintenance',
    kpi_return_7days: 'Returning in 7 Days',
    kpi_total_revenue: 'Total Revenue',
    kpi_total_expenses: 'Total Expenses',
    kpi_net_profit: 'Net Profit / Balance',
    kpi_cost_per_car: 'Avg Expense / Car',
    kpi_occupancy: 'Fleet Occupancy',
    kpi_amortization_left: 'Amortization Left',
    kpi_investment_progress: 'ROI & Amortization Progress',

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

    alert_registration_expiring: 'Mandatory Registracija Expiring / Overdue Vehicles',
    alert_registration_desc: 'According to Serbian law, vehicles with expired registration cannot be driven. Please renew immediately.',
    alert_parking_tickets: 'Pending Belgrade Parking Servis Fines (eDPK)',
    alert_active_faults: 'Active Critical Vehicle Faults',
    alert_fleet_suspended: 'Your Fleet is Suspended - Please Renew License / Subscription',
    alert_module_disabled: 'This Module is Disabled for Your Fleet',

    auth_login: 'Sign In',
    auth_register: 'Register with Fleet Code',
    auth_fleet_code: 'Fleet Code',
    auth_email: 'Email Address',
    auth_password: 'Password',
    auth_password_rules: 'Password must be at least 6 characters and include uppercase, lowercase, and numbers.',
    auth_password_rule_len: 'At least 6 characters',
    auth_password_rule_upper: 'At least 1 uppercase letter (A-Z)',
    auth_password_rule_lower: 'At least 1 lowercase letter (a-z)',
    auth_password_rule_number: 'At least 1 number (0-9)',
    auth_email_invalid: 'Please enter a valid, realistic email address.',
    auth_email_disposable: 'Disposable/temporary email domains are not accepted.',
    auth_email_not_exist: 'No active mail exchange server was found for this email domain.',
    auth_realistic_email_hint: 'e.g., name.surname@company.com or name@gmail.com',

    landing_features: 'Features',
    landing_advantages: 'Advantages',
    landing_how_it_works: 'How It Works',
    landing_pricing: 'Plans & Pricing',
    landing_hero_badge: 'Modern Fleet & Car Rental SaaS',
    landing_hero_title_1: 'Run Your Fleet Smarter,',
    landing_hero_title_2: 'Leave the Chaos Behind.',
    landing_hero_desc: 'Belgrade Parking Servis fines, registracija inspection calendar, oil change alerts, rental contracts, and transparent partner financial ledger in one unified platform.',
    landing_hero_cta_register: 'Register with Fleet Code',
    landing_hero_cta_buy: 'Buy Fleet Code (WhatsApp)',
    landing_fleet_code_placeholder: 'Enter Fleet Code (e.g. FL-1001)',
    landing_verify_btn: 'Verify & Start',
    landing_stat_1_val: '100+',
    landing_stat_1_lbl: 'Actively Managed Vehicles',
    landing_stat_2_val: '40%',
    landing_stat_2_lbl: 'Operational Time Saved',
    landing_stat_3_val: '24/7',
    landing_stat_3_lbl: 'Non-stop Monitoring & Alerts',
    landing_comparison_title: 'Old Methods vs. Modern Fleet Management Platform',
    landing_comparison_subtitle: 'Stop losing money to forgotten registration deadlines, missed parking fines, and manual spreadsheets.',
    landing_comparison_old: 'Old Ways (Excel & Paper)',
    landing_comparison_new: 'Modern Fleet SaaS Platform',
    landing_pricing_title: 'Transparent & Scalable Fleet Licenses',
    landing_pricing_subtitle: 'Contact the SaaS Manager directly to get your unique company fleet code.',
    landing_pricing_starter: 'Starter Fleet',
    landing_pricing_pro: 'Professional Fleet',
    landing_pricing_enterprise: 'Enterprise & Multi-Partner',
    landing_pricing_btn: 'Buy Fleet Code (WhatsApp)',
    landing_contact_title: 'Elevate Your Fleet Operations Today',
    landing_contact_desc: 'Contact the SaaS Manager to acquire your fleet code and gain complete operational clarity.',
    landing_contact_whatsapp: 'Contact Manager (+381 617 027 504)',
    landing_footer_rights: 'All rights reserved. Belgrade Fleet Management & Operations SaaS.',

    dash_top_banner_title: 'Fleet Management & Rental Operations Dashboard',
    dash_top_banner_subtitle: 'Fleet inventory, Registracija inspection calendar, delivery checklists, and vehicle amortization tracking.',
    dash_all_fleet: 'All Fleet',
    dash_forecast_title: 'Upcoming Vehicle Deliveries & Return Forecast',
    dash_forecast_overdue: 'Overdue Returns',
    dash_forecast_today: 'Returns Due TODAY',
    dash_forecast_3days: 'Next 3 Days',
    dash_forecast_7days: 'This Week (7 Days)',
    dash_top_expense_title: 'Top Expense Vehicles',
    dash_top_fault_title: 'Top Defect / Fault Vehicles',
    dash_analytics_table_title: 'Detailed Expense, Revenue & ROI Table by Vehicle',
    dash_analytics_table_subtitle: 'Breakdown of rental revenue, expenses, and net profit per vehicle',
    dash_col_plate: 'Plate',
    dash_col_vehicle: 'Brand & Model',
    dash_col_owner: 'Partner / Owner',
    dash_col_status: 'Status',
    dash_col_investment: 'Purchase Cost',
    dash_col_revenue: 'Rental Revenue',
    dash_col_maint: 'Maintenance',
    dash_col_oil: 'Engine Oil',
    dash_col_regi: 'Registracija',
    dash_col_total_expense: 'Total Expense',
    dash_col_net_profit: 'Net Profit',
    dash_col_margin: 'Expense Ratio',
    dash_col_services: 'Services & Faults',
    dash_col_actions: 'Actions',
    dash_btn_extend: 'Extend',
    dash_btn_return: 'Return',
    dash_btn_remind: 'Remind',
    dash_loading_portal: 'Opening Fleet Management Portal...',
  },

  sr: {
    nav_dashboard: 'Kontrolna tabla',
    nav_super_admin: 'Super Admin Panel',
    nav_vehicles: 'Vozila',
    nav_customers: 'Klijenti i Dokumenti',
    nav_maintenance: 'Održavanje i Ulje',
    nav_inspection: 'Godišnji Tehnički i Regi',
    nav_parking_tickets: 'Parking Kazne (eDPK)',
    nav_notifications: 'Obaveštenja',
    nav_audit_logs: 'Istorija Operacija',
    nav_users: 'Korisnici',
    nav_settings: 'Podešavanja Sistema',
    nav_main_menu: 'Glavni Meni',
    nav_belgrade_operation: 'Beograd Operacije (EUR)',

    header_search_placeholder: 'Pretraži tablicu, klijenta ili telefon...',
    header_notifications: 'Obaveštenja',
    header_my_profile: 'Moj Profil',
    header_change_password: 'Promeni Lozinku',
    header_sign_out: 'Odjavi se',
    header_staff_mode: 'Režim Osoblja',
    header_admin_mode: 'Administrator Flote',
    header_super_admin_mode: 'Super Admin',
    header_theme_toggle: 'Promeni Temu',
    header_theme_light: 'Svetla Tema',
    header_theme_dark: 'Tamna Tema',
    header_language: 'Jezik',

    kpi_rented: 'U Zakupu',
    kpi_available: 'Slobodno (Spremno)',
    kpi_post_check: 'Kontrola nakon Zakupa',
    kpi_maintenance: 'U Servisu',
    kpi_return_7days: 'Vraća se u 7 Dana',
    kpi_total_revenue: 'Ukupan Prihod (Zakup)',
    kpi_total_expenses: 'Ukupni Troškovi',
    kpi_net_profit: 'Čist Profit / Saldo',
    kpi_cost_per_car: 'Trošak po Vozilu',
    kpi_occupancy: 'Popunjenost Flote',
    kpi_amortization_left: 'Preostala Amortizacija',
    kpi_investment_progress: 'Napredak Otplate Investicije',

    action_rent_vehicle: 'Iznajmi Vozilo',
    action_oil_change: 'Zamena Ulja',
    action_refresh: 'Osveži Podatke',
    action_save: 'Sačuvaj',
    action_cancel: 'Otkaži',
    action_close: 'Zatvori',
    action_details: 'Detalji',
    action_filter: 'Filtriraj',
    action_search: 'Pretraži',
    action_extend_rental: 'Produži Zakup',
    action_return_vehicle: 'Preuzmi Vozilo',
    action_whatsapp_remind: 'Podseti preko WhatsApp-a',
    action_add_new: 'Dodaj Novo',
    action_edit: 'Izmeni',
    action_delete: 'Obriši',

    alert_registration_expiring: 'Vozila sa Isteklom ili Bližećom Registracijom',
    alert_registration_desc: 'Prema zakonima Republike Srbije, vozilo bez važeće registracije ne sme učestvovati u saobraćaju. Molimo obnovite na vreme.',
    alert_parking_tickets: 'Neplaćene Beograd Parking Servis Kazne (eDPK)',
    alert_active_faults: 'Aktivni Kritični Kvarovi na Vozilima',
    alert_fleet_suspended: 'Vaša Flota je Suspendovana - Molimo Obnovite Licencu',
    alert_module_disabled: 'Ovaj Modul je Onemogućen za Vašu Flotu',

    auth_login: 'Prijavi se',
    auth_register: 'Registracija uz Kod Flote',
    auth_fleet_code: 'Kod Flote',
    auth_email: 'Email Adresa',
    auth_password: 'Lozinka',
    auth_password_rules: 'Lozinka mora imati najmanje 6 karaktera, sa velikim, malim slovima i brojevima.',
    auth_password_rule_len: 'Najmanje 6 karaktera',
    auth_password_rule_upper: 'Najmanje 1 veliko slovo (A-Z)',
    auth_password_rule_lower: 'Najmanje 1 malo slovo (a-z)',
    auth_password_rule_number: 'Najmanje 1 broj (0-9)',
    auth_email_invalid: 'Molimo unesite ispravnu i realnu email adresu.',
    auth_email_disposable: 'Privremene i lažne email adrese nisu dozvoljene.',
    auth_email_not_exist: 'Nije pronađen aktivan email server (MX) za navedeni domen.',
    auth_realistic_email_hint: 'Npr: ime.prezime@kompanija.rs ili ime@gmail.com',

    landing_features: 'Funkcije',
    landing_advantages: 'Prednosti',
    landing_how_it_works: 'Kako Radi?',
    landing_pricing: 'Paketi i Cene',
    landing_hero_badge: 'Moderan SaaS za Flote i Rent a Car',
    landing_hero_title_1: 'Pametno Upravljajte Flotom,',
    landing_hero_title_2: 'Ostavite Haos Iza Sebe.',
    landing_hero_desc: 'Kazne Parking Servisa Beograd (eDPK), rokovi registracije, zamena motornog ulja, ugovori o zakupu i transparentna kasa partnera na jednoj modernoj platformi.',
    landing_hero_cta_register: 'Registruj se uz Kod Flote',
    landing_hero_cta_buy: 'Kupi Kod Flote (WhatsApp)',
    landing_fleet_code_placeholder: 'Unesite Kod Flote (Npr: FL-1001)',
    landing_verify_btn: 'Potvrdi Kod i Počni',
    landing_stat_1_val: '100+',
    landing_stat_1_lbl: 'Aktivno Praćenih Vozila',
    landing_stat_2_val: '40%',
    landing_stat_2_lbl: 'Ušteda Operativnog Vremena',
    landing_stat_3_val: '24/7',
    landing_stat_3_lbl: 'Kontinuirana Kontrola i Alarmi',
    landing_comparison_title: 'Stare Metode naspram Moderne Platforme za Upravljanje Flotom',
    landing_comparison_subtitle: 'Prestanite da gubite novac zbog zaboravljenih registracija, propuštenih parking kazni i Excel tabela.',
    landing_comparison_old: 'Stari Način (Excel i Papir)',
    landing_comparison_new: 'Moderna SaaS Platforma',
    landing_pricing_title: 'Transparentne i Skalabilne Licence za Flote',
    landing_pricing_subtitle: 'Kontaktirajte direktno SaaS Menadžera da biste dobili jedinstveni kod za vašu firmu.',
    landing_pricing_starter: 'Startna Flota',
    landing_pricing_pro: 'Profesionalna Flota',
    landing_pricing_enterprise: 'Korporativna Flota (Više Partnera)',
    landing_pricing_btn: 'Kupi Kod Flote (WhatsApp)',
    landing_contact_title: 'Unapredite Vaše Poslovanje Već Danas',
    landing_contact_desc: 'Kontaktirajte SaaS Menadžera da dobijete kod flote i preuzmete potpunu kontrolu nad vozilima.',
    landing_contact_whatsapp: 'Kontaktirajte Menadžera (+381 617 027 504)',
    landing_footer_rights: 'Sva prava zadržana. Beograd Upravljanje Flotom i Operativni SaaS.',

    dash_top_banner_title: 'Kontrolna Tabla za Upravljanje Flotom i Iznajmljivanje',
    dash_top_banner_subtitle: 'Inventar vozila, kalendar registracija i tehničkog pregleda, kontrolne liste i amortizacija.',
    dash_all_fleet: 'Cela Flota',
    dash_forecast_title: 'Predstojeća Vraćanja Vozila i Kalendar Isporuke',
    dash_forecast_overdue: 'Zakašnela Vraćanja',
    dash_forecast_today: 'Vraćanje DANAS',
    dash_forecast_3days: 'U Naredna 3 Dana',
    dash_forecast_7days: 'Ove Nedelje (7 Dana)',
    dash_top_expense_title: 'Vozila sa Najvećim Troškovima',
    dash_top_fault_title: 'Vozila sa Najviše Kvarova',
    dash_analytics_table_title: 'Detaljna Analitika Troškova, Prihoda i ROI po Vozilu',
    dash_analytics_table_subtitle: 'Pregled prihoda od zakupa, troškova servisa i neto profitabilnosti za svako vozilo',
    dash_col_plate: 'Tablica',
    dash_col_vehicle: 'Marka i Model',
    dash_col_owner: 'Vlasnik / Partner',
    dash_col_status: 'Status',
    dash_col_investment: 'Kupovna Cena',
    dash_col_revenue: 'Prihod od Zakupa',
    dash_col_maint: 'Održavanje',
    dash_col_oil: 'Motorno Ulje',
    dash_col_regi: 'Registracija',
    dash_col_total_expense: 'Ukupan Trošak',
    dash_col_net_profit: 'Čist Profit',
    dash_col_margin: 'Udeo Troškova',
    dash_col_services: 'Servisi i Kvarovi',
    dash_col_actions: 'Radnje',
    dash_btn_extend: 'Produži',
    dash_btn_return: 'Preuzmi',
    dash_btn_remind: 'Podseti',
    dash_loading_portal: 'Otvaranje Portala za Upravljanje Flotom...',
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
      if (saved === 'tr' || saved === 'en' || saved === 'sr') {
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

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
