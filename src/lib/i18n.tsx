'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'tr' | 'en' | 'sr';

export interface Translations {
  // Navigation / Sidebar
  nav_dashboard: string;
  nav_super_admin: string;
  nav_vehicles: string;
  nav_excel_import: string;
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
  dash_col_initial_expense: string;
  dash_col_operating_cost: string;
  dash_col_total_cost: string;
  dash_col_amortization_left: string;
  dash_col_amortization_progress: string;
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

  // Common UI
  common_all: string;
  common_search: string;
  common_filter: string;
  common_save: string;
  common_saving: string;
  common_cancel: string;
  common_edit: string;
  common_delete: string;
  common_actions: string;
  common_details: string;
  common_status: string;
  common_plate: string;
  common_vehicle: string;
  common_customer: string;
  common_phone: string;
  common_date: string;
  common_amount: string;
  common_notes: string;
  common_close: string;
  common_loading: string;
  common_success: string;
  common_error: string;
  common_no_data: string;
  common_all_owners: string;
  common_total: string;
  common_currency_eur: string;
  common_currency_rsd: string;

  // Parking Tickets
  parking_title: string;
  parking_subtitle: string;
  parking_scan_all: string;
  parking_scanning: string;
  parking_tab_all: string;
  parking_tab_unpaid: string;
  parking_tab_paid: string;
  parking_kpi_total: string;
  parking_kpi_unpaid: string;
  parking_kpi_notified: string;
  parking_kpi_waiting: string;
  parking_kpi_bot: string;
  parking_kpi_bot_status: string;
  parking_kpi_bot_desc: string;
  parking_search_placeholder: string;
  parking_col_ticket_no: string;
  parking_col_plate: string;
  parking_col_location: string;
  parking_col_amount: string;
  parking_col_status: string;
  parking_col_customer: string;
  parking_col_actions: string;
  parking_notify_wa: string;
  parking_notified: string;
  parking_mark_paid: string;
  parking_upload_receipt: string;
  parking_status_paid: string;
  parking_status_unpaid: string;
  parking_early_discount: string;
  parking_no_tickets: string;

  // Vehicles Module
  veh_title: string;
  veh_subtitle: string;
  veh_add_new: string;
  veh_tab_all: string;
  veh_tab_rented: string;
  veh_tab_available: string;
  veh_tab_returning_soon: string;
  veh_tab_reg_expiring: string;
  veh_tab_faults: string;
  veh_search_placeholder: string;
  veh_card_daily: string;
  veh_card_monthly: string;
  veh_card_km: string;
  veh_card_fuel: string;
  veh_card_reg_expiry: string;
  veh_card_owner: string;
  veh_btn_details: string;
  veh_btn_rent: string;
  veh_btn_make_available: string;
  veh_btn_service: string;
  veh_no_vehicles: string;
  veh_modal_add_title: string;
  veh_modal_plate: string;
  veh_modal_brand: string;
  veh_modal_model: string;
  veh_modal_year: string;
  veh_modal_color: string;
  veh_modal_fuel_type: string;
  veh_modal_km: string;
  veh_modal_reg_expiry: string;
  veh_modal_purchase_price: string;
  veh_modal_initial_expense: string;
  veh_modal_daily_price: string;
  veh_modal_monthly_price: string;
  veh_modal_owner: string;
  veh_modal_edit_title: string;
  veh_accessories_title: string;
  veh_accessories_subtitle: string;
  veh_tab_finance: string;
  veh_finance_title: string;
  veh_finance_subtitle: string;
  veh_finance_purchase_price: string;
  veh_finance_initial_expense: string;
  veh_finance_total_investment: string;
  veh_finance_operating_expenses: string;
  veh_finance_total_cost: string;
  veh_finance_total_revenue: string;
  veh_finance_net_profit: string;
  veh_finance_amortization_left: string;
  veh_finance_amortized_badge: string;
  veh_finance_amortizing_badge: string;
  veh_finance_quick_edit: string;
  veh_finance_edit_title: string;
  veh_finance_edit_desc: string;
  veh_finance_breakdown_title: string;
  veh_finance_cost_item: string;
  veh_finance_cost_type: string;
  veh_finance_cost_amount: string;
  veh_finance_cost_share: string;
  veh_finance_capex: string;
  veh_finance_opex: string;

  // Maintenances Module
  maint_title: string;
  maint_subtitle: string;
  maint_tab_services: string;
  maint_tab_oil: string;
  maint_btn_new_service: string;
  maint_btn_new_oil: string;
  maint_kpi_total_services: string;
  maint_kpi_total_cost: string;
  maint_kpi_oil_due: string;
  maint_kpi_oil_overdue: string;
  maint_col_date: string;
  maint_col_vehicle: string;
  maint_col_km: string;
  maint_col_cost: string;
  maint_col_shop: string;
  maint_col_parts: string;
  maint_oil_last_km: string;
  maint_oil_current_km: string;
  maint_oil_remaining: string;
  maint_oil_status_ok: string;
  maint_oil_status_warn: string;
  maint_oil_status_critical: string;

  // Inspections Module
  insp_title: string;
  insp_subtitle: string;
  insp_btn_new: string;
  insp_kpi_total: string;
  insp_kpi_cost: string;
  insp_kpi_expiring_soon: string;
  insp_kpi_expired: string;
  insp_col_expiry: string;
  insp_col_station: string;
  insp_status_valid: string;
  insp_status_expiring: string;
  insp_status_expired: string;

  // Customers Module
  cust_title: string;
  cust_subtitle: string;
  cust_btn_new: string;
  cust_search_placeholder: string;
  cust_col_name: string;
  cust_col_contact: string;
  cust_col_docs: string;
  cust_col_rentals: string;
  cust_col_active_car: string;
  cust_no_active_rental: string;

  // Users Module
  users_title: string;
  users_subtitle: string;
  users_btn_new: string;
  users_role_admin: string;
  users_role_staff: string;
  users_col_name: string;
  users_col_email: string;
  users_col_role: string;
  users_col_created: string;
  users_btn_edit: string;

  // Settings Module
  sett_title: string;
  sett_subtitle: string;
  sett_tab_system: string;
  sett_tab_password: string;
  sett_general_title: string;
  sett_company_name: string;
  sett_phone: string;
  sett_email: string;
  sett_currency: string;
  sett_security_title: string;
  sett_current_pwd: string;
  sett_new_pwd: string;
  sett_confirm_pwd: string;
  sett_btn_save: string;

  // Audit Logs Module
  audit_title: string;
  audit_subtitle: string;
}

const translations: Record<Language, Translations> = {
  tr: {
    nav_dashboard: 'Dashboard',
    nav_super_admin: 'Süper Yönetici Paneli',
    nav_vehicles: 'Araçlar',
    nav_excel_import: 'AI Excel Aktarım',
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
    dash_col_initial_expense: 'İlk Tescil & Noter',
    dash_col_operating_cost: 'İşletme Gideri',
    dash_col_total_cost: 'Genel Toplam Maliyet',
    dash_col_amortization_left: 'Kalan Amortisman',
    dash_col_amortization_progress: 'Amortisman Durumu',
    dash_col_revenue: 'Kira Geliri',
    dash_col_maint: 'Bakım',
    dash_col_oil: 'Motor Yağı',
    dash_col_regi: 'Registracija',
    dash_col_total_expense: 'Toplam Gider',
    dash_col_net_profit: 'Net Kâr / Bakiye',
    dash_col_margin: 'Masraf Oranı',
    dash_col_services: 'Servis & Arıza',
    dash_col_actions: 'İşlemler',
    dash_btn_extend: 'Süre Uzat',
    dash_btn_return: 'Teslim Al',
    dash_btn_remind: 'Hatırlat',
    dash_loading_portal: 'Filo Yönetim Portalı Açılıyor...',

    // Common UI
    common_all: 'Tümü',
    common_search: 'Ara',
    common_filter: 'Filtrele',
    common_save: 'Kaydet',
    common_saving: 'Kaydediliyor...',
    common_cancel: 'İptal',
    common_edit: 'Düzenle',
    common_delete: 'Sil',
    common_actions: 'İşlemler',
    common_details: 'Detay',
    common_status: 'Durum',
    common_plate: 'Plaka',
    common_vehicle: 'Araç',
    common_customer: 'Müşteri',
    common_phone: 'Telefon',
    common_date: 'Tarih',
    common_amount: 'Tutar',
    common_notes: 'Notlar',
    common_close: 'Kapat',
    common_loading: 'Yükleniyor...',
    common_success: 'İşlem Başarılı',
    common_error: 'Bir Hata Oluştu',
    common_no_data: 'Kayıt bulunamadı',
    common_all_owners: 'Tüm Ortaklar / Sahipler',
    common_total: 'Toplam',
    common_currency_eur: '€ (EUR)',
    common_currency_rsd: 'RSD (Dinar)',

    // Parking Tickets
    parking_title: 'Belgrad Park Cezaları (Parking Servis eDPK)',
    parking_subtitle: 'Belgrade Parking Servis sisteminden otomatik taranır, cezalar ve ihlaller anında tespit edilir.',
    parking_scan_all: 'Tüm Araçları Şimdi Tara',
    parking_scanning: 'Tüm Araçlar Taranıyor...',
    parking_tab_all: 'Tümü',
    parking_tab_unpaid: 'Ödenmemiş',
    parking_tab_paid: 'Ödenmiş',
    parking_kpi_total: 'Toplam Ceza',
    parking_kpi_unpaid: 'Ödenmemiş Borç',
    parking_kpi_notified: 'Müşteri Bildirimi',
    parking_kpi_waiting: 'müşteri bekliyor',
    parking_kpi_bot: 'Arka Plan Botu',
    parking_kpi_bot_status: 'Aktif (1-2 Saatlik)',
    parking_kpi_bot_desc: 'Parking Servis eDPK API bağlantısı devrede',
    parking_search_placeholder: 'Ceza no, plaka, sokak veya müşteri ara...',
    parking_col_ticket_no: 'Ceza No & Tarih',
    parking_col_plate: 'Araç & Plaka',
    parking_col_location: 'Konum & Bölge',
    parking_col_amount: 'Ceza Tutarı',
    parking_col_status: 'Durum',
    parking_col_customer: 'Müşteri & İletişim',
    parking_col_actions: 'İşlemler',
    parking_notify_wa: 'WhatsApp ile Bildir',
    parking_notified: 'Bildirildi',
    parking_mark_paid: 'Ödendi Olarak İşaretle',
    parking_upload_receipt: 'Makbuz / Fiş Yükle',
    parking_status_paid: 'Ödendi',
    parking_status_unpaid: 'Ödenmemiş',
    parking_early_discount: '20 gün içinde %50 indirimli',
    parking_no_tickets: 'Kayıtlı park cezası bulunmamaktadır.',

    // Vehicles Module
    veh_title: 'Filo Araçları ve Envanter Takibi',
    veh_subtitle: 'Filo envanterindeki araçlar, Registracija muayene takvimi, yakıt tüketimi ve kiralama durumu',
    veh_add_new: 'Yeni Araç Ekle',
    veh_tab_all: 'Tüm Araçlar',
    veh_tab_rented: 'Kirada',
    veh_tab_available: 'Boşta (Hazır)',
    veh_tab_returning_soon: '1 Hafta İçinde Dönecek',
    veh_tab_reg_expiring: 'Registracija Yaklaşan (30 Gün)',
    veh_tab_faults: 'Arızalı / Servis Bekleyen',
    veh_search_placeholder: 'Plaka, marka, model veya şasi no ara...',
    veh_card_daily: 'Günlük',
    veh_card_monthly: 'Aylık',
    veh_card_km: 'Kilometre',
    veh_card_fuel: 'Yakıt',
    veh_card_reg_expiry: 'Registracija Bitiş',
    veh_card_owner: 'Sahip / Ortak',
    veh_btn_details: 'Detay Gör',
    veh_btn_rent: 'Kirala',
    veh_btn_make_available: 'Boşa Çıkar',
    veh_btn_service: 'Bakım Girişi',
    veh_no_vehicles: 'Kriterlere uygun araç bulunamadı.',
    veh_modal_add_title: 'Filoya Yeni Araç Ekle',
    veh_modal_plate: 'Plaka (örn: BG-123-AB)',
    veh_modal_brand: 'Marka',
    veh_modal_model: 'Model',
    veh_modal_year: 'Model Yılı',
    veh_modal_color: 'Renk',
    veh_modal_fuel_type: 'Yakıt Türü',
    veh_modal_km: 'Mevcut KM',
    veh_modal_reg_expiry: 'Registracija (Muayene) Bitiş',
    veh_modal_purchase_price: 'Satın Alma Maliyeti (€)',
    veh_modal_initial_expense: 'İlk Masraflar (€)',
    veh_modal_daily_price: 'Günlük Kira Fiyatı (€)',
    veh_modal_monthly_price: 'Aylık Kira Fiyatı (€)',
    veh_modal_owner: 'Araç Sahibi / Ortak',
    veh_modal_edit_title: 'Araç Bilgilerini Düzenle',
    veh_accessories_title: 'Araç İçi Aksesuarlar & Donanımlar',
    veh_accessories_subtitle: 'Kira teslimatında ve iadelerinde kontrol edilecek araç donanımları',
    veh_tab_finance: 'Finans & Amortisman',
    veh_finance_title: 'Araç Maliyet, Gelir & Amortisman Analizi',
    veh_finance_subtitle: 'Satın alma bedeli, ilk tescil masrafları, tüm bakım giderleri ve kira cirosuna göre araç bazlı net kârlılık',
    veh_finance_purchase_price: 'Alış Fiyatı',
    veh_finance_initial_expense: 'İlk Tescil & Noter Masrafı',
    veh_finance_total_investment: 'Toplam İlk Yatırım (Alış + Tescil)',
    veh_finance_operating_expenses: 'İşletme Giderleri (Bakım + Yağ + Tescil + Arıza)',
    veh_finance_total_cost: 'Genel Toplam Araç Maliyeti',
    veh_finance_total_revenue: 'Toplam Kira Geliri (Ciro)',
    veh_finance_net_profit: 'Net Finansal Bakiye',
    veh_finance_amortization_left: 'Kalan Amortisman Tutarı',
    veh_finance_amortized_badge: 'Amorti Edildi (Kâra Geçti)',
    veh_finance_amortizing_badge: 'Amorti Aşamasında',
    veh_finance_quick_edit: 'Alış & Tescil Masrafını Güncelle',
    veh_finance_edit_title: 'Alış ve Tescil Masraflarını Düzenle',
    veh_finance_edit_desc: 'Aracın satın alma fiyatını ve ilk noter/tescil harçlarını güncelleyerek toplam maliyet ve amortisman hesaplamasını yenileyin.',
    veh_finance_breakdown_title: 'Detaylı Masraf ve Yatırım Kırılımı',
    veh_finance_cost_item: 'Gider Kalemi',
    veh_finance_cost_type: 'Gider Türü',
    veh_finance_cost_amount: 'Tutar (€)',
    veh_finance_cost_share: 'Toplam Maliyete Oranı',
    veh_finance_capex: 'Satın Alma & Yatırım',
    veh_finance_opex: 'İşletme & Servis Masrafı',

    // Maintenances Module
    maint_title: 'Bakım & Motor Yağı Takibi',
    maint_subtitle: 'Periyodik bakımlar, parça değişimleri ve 10.000 KM yağ kontrolleri',
    maint_tab_services: 'Genel Bakım & Onarımlar',
    maint_tab_oil: 'Motor Yağı Takibi (10.000 KM)',
    maint_btn_new_service: 'Yeni Bakım Kaydı',
    maint_btn_new_oil: 'Yeni Yağ Değişimi',
    maint_kpi_total_services: 'Toplam Bakım',
    maint_kpi_total_cost: 'Toplam Servis Masrafı',
    maint_kpi_oil_due: 'Yağ Değişimi Yaklaşan',
    maint_kpi_oil_overdue: 'KM Aşılan Araçlar',
    maint_col_date: 'Tarih',
    maint_col_vehicle: 'Araç & Plaka',
    maint_col_km: 'İşlem KM',
    maint_col_cost: 'Masraf',
    maint_col_shop: 'Servis / Usta',
    maint_col_parts: 'Değişen Parçalar',
    maint_oil_last_km: 'Son Yağ Değişimi',
    maint_oil_current_km: 'Güncel KM',
    maint_oil_remaining: 'Kalan KM',
    maint_oil_status_ok: 'İyi Durumda',
    maint_oil_status_warn: 'Yaklaşıyor (<1.000 KM)',
    maint_oil_status_critical: 'ACİL DEĞİŞİM GEREKLİ',

    // Inspections Module
    insp_title: 'Yıllık Muayene & Registracija',
    insp_subtitle: 'Sırbistan yıllık registracija ve teknik muayene takvimi',
    insp_btn_new: 'Yeni Muayene Kaydı',
    insp_kpi_total: 'Kayıtlı Muayene',
    insp_kpi_cost: 'Toplam Registracija Masrafı',
    insp_kpi_expiring_soon: '30 Gün Kalanlar',
    insp_kpi_expired: 'Süresi Dolanlar',
    insp_col_expiry: 'Geçerlilik Bitiş',
    insp_col_station: 'Muayene İstasyonu',
    insp_status_valid: 'Geçerli',
    insp_status_expiring: 'Süresi Yaklaşıyor',
    insp_status_expired: 'SÜRESİ DOLDU',

    // Customers Module
    cust_title: 'Müşteriler & Kiralama Belgeleri',
    cust_subtitle: 'Müşteri profilleri, pasaport, ehliyet ve sözleşme belgeleri',
    cust_btn_new: 'Yeni Müşteri Ekle',
    cust_search_placeholder: 'İsim, telefon, e-posta veya kimlik no ara...',
    cust_col_name: 'Müşteri Adı',
    cust_col_contact: 'İletişim',
    cust_col_docs: 'Yüklenen Belgeler',
    cust_col_rentals: 'Kiralama Geçmişi',
    cust_col_active_car: 'Kullandığı Araç',
    cust_no_active_rental: 'Aktif kiralama yok',

    // Users Module
    users_title: 'Kullanıcı & Personel Yönetimi',
    users_subtitle: 'Filonuzdaki yönetici ve çalışan hesapları, erişim yetkileri',
    users_btn_new: 'Yeni Kullanıcı Ekle',
    users_role_admin: 'Filo Yöneticisi (ADMIN)',
    users_role_staff: 'Personel (STAFF)',
    users_col_name: 'Ad Soyad',
    users_col_email: 'E-posta',
    users_col_role: 'Yetki Rolü',
    users_col_created: 'Kayıt Tarihi',
    users_btn_edit: 'Düzenle / Şifre Sıfırla',

    // Settings Module
    sett_title: 'Sistem & Filo Ayarları',
    sett_subtitle: 'Filo parametreleri, WhatsApp bildirimleri ve güvenlik ayarları',
    sett_tab_system: 'Sistem & Filo Ayarları',
    sett_tab_password: 'Şifre Değiştir',
    sett_general_title: 'Genel Filo Bilgileri',
    sett_company_name: 'Filo / Şirket Adı',
    sett_phone: 'İletişim & WhatsApp Numarası',
    sett_email: 'Operasyon E-posta Adresi',
    sett_currency: 'Varsayılan Para Birimi',
    sett_security_title: 'Şifre Değiştir',
    sett_current_pwd: 'Mevcut Şifre',
    sett_new_pwd: 'Yeni Şifre',
    sett_confirm_pwd: 'Yeni Şifre Tekrar',
    sett_btn_save: 'Ayarları Kaydet',

    // Audit Logs Module
    audit_title: 'Denetim & İşlem Geçmişi (Audit Logs)',
    audit_subtitle: 'Sistemdeki tüm araç, bakım, ceza ve kullanıcı işlemleri kayıt altındadır',
  },

  en: {
    nav_dashboard: 'Dashboard',
    nav_super_admin: 'Super Admin Panel',
    nav_vehicles: 'Vehicles',
    nav_excel_import: 'AI Excel Import',
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
    dash_col_initial_expense: 'Initial Reg. & Notary',
    dash_col_operating_cost: 'Operating Expense',
    dash_col_total_cost: 'Total Lifetime Cost',
    dash_col_amortization_left: 'Amortization Left',
    dash_col_amortization_progress: 'Amortization Progress',
    dash_col_revenue: 'Rental Revenue',
    dash_col_maint: 'Maintenance',
    dash_col_oil: 'Engine Oil',
    dash_col_regi: 'Registracija',
    dash_col_total_expense: 'Total Cost / Outlay',
    dash_col_net_profit: 'Net Profit / Balance',
    dash_col_margin: 'Expense Ratio',
    dash_col_services: 'Services & Faults',
    dash_col_actions: 'Actions',
    dash_btn_extend: 'Extend',
    dash_btn_return: 'Return',
    dash_btn_remind: 'Remind',
    dash_loading_portal: 'Opening Fleet Management Portal...',

    // Common UI
    common_all: 'All',
    common_search: 'Search',
    common_filter: 'Filter',
    common_save: 'Save',
    common_saving: 'Saving...',
    common_cancel: 'Cancel',
    common_edit: 'Edit',
    common_delete: 'Delete',
    common_actions: 'Actions',
    common_details: 'Details',
    common_status: 'Status',
    common_plate: 'License Plate',
    common_vehicle: 'Vehicle',
    common_customer: 'Customer',
    common_phone: 'Phone',
    common_date: 'Date',
    common_amount: 'Amount',
    common_notes: 'Notes',
    common_close: 'Close',
    common_loading: 'Loading...',
    common_success: 'Operation Successful',
    common_error: 'An Error Occurred',
    common_no_data: 'No records found',
    common_all_owners: 'All Partners / Owners',
    common_total: 'Total',
    common_currency_eur: '€ (EUR)',
    common_currency_rsd: 'RSD (Dinar)',

    // Parking Tickets
    parking_title: 'Belgrade Parking Tickets (Parking Servis eDPK)',
    parking_subtitle: 'Automatically scanned from Belgrade Parking Servis, detects violations instantly.',
    parking_scan_all: 'Scan All Vehicles Now',
    parking_scanning: 'Scanning All Vehicles...',
    parking_tab_all: 'All',
    parking_tab_unpaid: 'Unpaid',
    parking_tab_paid: 'Paid',
    parking_kpi_total: 'Total Tickets',
    parking_kpi_unpaid: 'Unpaid Fines',
    parking_kpi_notified: 'Customer Notified',
    parking_kpi_waiting: 'customers waiting',
    parking_kpi_bot: 'Background Scanner',
    parking_kpi_bot_status: 'Active (Every 1-2 Hours)',
    parking_kpi_bot_desc: 'Parking Servis eDPK API link is active',
    parking_search_placeholder: 'Search ticket no, plate, street or customer...',
    parking_col_ticket_no: 'Ticket No & Date',
    parking_col_plate: 'Vehicle & Plate',
    parking_col_location: 'Location & Zone',
    parking_col_amount: 'Fine Amount',
    parking_col_status: 'Status',
    parking_col_customer: 'Customer & Contact',
    parking_col_actions: 'Actions',
    parking_notify_wa: 'Notify via WhatsApp',
    parking_notified: 'Notified',
    parking_mark_paid: 'Mark as Paid',
    parking_upload_receipt: 'Upload Receipt',
    parking_status_paid: 'Paid',
    parking_status_unpaid: 'Unpaid',
    parking_early_discount: '50% discount within 20 days',
    parking_no_tickets: 'No parking tickets recorded.',

    // Vehicles Module
    veh_title: 'Fleet Vehicles & Inventory Tracking',
    veh_subtitle: 'Vehicles in fleet inventory, registration calendar, fuel consumption, and rental status',
    veh_add_new: 'Add New Vehicle',
    veh_tab_all: 'All Vehicles',
    veh_tab_rented: 'Rented',
    veh_tab_available: 'Available (Ready)',
    veh_tab_returning_soon: 'Returning in 1 Week',
    veh_tab_reg_expiring: 'Registration Expiring (30 Days)',
    veh_tab_faults: 'Faults / Needs Service',
    veh_search_placeholder: 'Search plate, brand, model or VIN...',
    veh_card_daily: 'Daily',
    veh_card_monthly: 'Monthly',
    veh_card_km: 'Mileage',
    veh_card_fuel: 'Fuel',
    veh_card_reg_expiry: 'Reg. Expiry',
    veh_card_owner: 'Owner / Partner',
    veh_btn_details: 'View Details',
    veh_btn_rent: 'Rent',
    veh_btn_make_available: 'Make Available',
    veh_btn_service: 'Log Service',
    veh_no_vehicles: 'No vehicles match criteria.',
    veh_modal_add_title: 'Add New Vehicle to Fleet',
    veh_modal_plate: 'Plate (e.g. BG-123-AB)',
    veh_modal_brand: 'Brand',
    veh_modal_model: 'Model',
    veh_modal_year: 'Model Year',
    veh_modal_color: 'Color',
    veh_modal_fuel_type: 'Fuel Type',
    veh_modal_km: 'Current KM',
    veh_modal_reg_expiry: 'Registration Expiry Date',
    veh_modal_purchase_price: 'Purchase Cost (€)',
    veh_modal_initial_expense: 'Initial Setup Expenses (€)',
    veh_modal_daily_price: 'Daily Rental Rate (€)',
    veh_modal_monthly_price: 'Monthly Rental Rate (€)',
    veh_modal_owner: 'Vehicle Owner / Partner',
    veh_modal_edit_title: 'Edit Vehicle Details',
    veh_accessories_title: 'Vehicle Interior Accessories & Features',
    veh_accessories_subtitle: 'Interior accessories and equipment checked during rentals',
    veh_tab_finance: 'Finance & Amortization',
    veh_finance_title: 'Vehicle Cost, Revenue & Amortization Analysis',
    veh_finance_subtitle: 'Vehicle-based net profitability based on purchase price, registration fees, maintenance and rental income',
    veh_finance_purchase_price: 'Purchase Price',
    veh_finance_initial_expense: 'Initial Reg. & Notary Fees',
    veh_finance_total_investment: 'Total Initial Investment (Purchase + Reg)',
    veh_finance_operating_expenses: 'Operating Expenses (Maint + Oil + Reg + Fault)',
    veh_finance_total_cost: 'Total Vehicle Cost',
    veh_finance_total_revenue: 'Total Rental Revenue',
    veh_finance_net_profit: 'Net Financial Balance',
    veh_finance_amortization_left: 'Remaining Amortization',
    veh_finance_amortized_badge: 'Fully Amortized (Profitable)',
    veh_finance_amortizing_badge: 'Amortizing in Progress',
    veh_finance_quick_edit: 'Update Purchase & Reg. Cost',
    veh_finance_edit_title: 'Edit Purchase & Registration Expenses',
    veh_finance_edit_desc: 'Update the vehicle purchase price and registration/notary fees to recalculate total cost and amortization.',
    veh_finance_breakdown_title: 'Detailed Cost and Investment Breakdown',
    veh_finance_cost_item: 'Cost Item',
    veh_finance_cost_type: 'Cost Category',
    veh_finance_cost_amount: 'Amount (€)',
    veh_finance_cost_share: 'Share in Total Cost',
    veh_finance_capex: 'Capital Investment',
    veh_finance_opex: 'Operational Expense',

    // Maintenances Module
    maint_title: 'Maintenance & Engine Oil Tracking',
    maint_subtitle: 'Periodic service, parts replacement, and 10,000 KM oil checks',
    maint_tab_services: 'General Maintenance & Repairs',
    maint_tab_oil: 'Engine Oil Tracking (10,000 KM)',
    maint_btn_new_service: 'New Service Record',
    maint_btn_new_oil: 'New Oil Change',
    maint_kpi_total_services: 'Total Services',
    maint_kpi_total_cost: 'Total Service Cost',
    maint_kpi_oil_due: 'Oil Change Due',
    maint_kpi_oil_overdue: 'Overdue Oil Changes',
    maint_col_date: 'Date',
    maint_col_vehicle: 'Vehicle & Plate',
    maint_col_km: 'Service KM',
    maint_col_cost: 'Cost',
    maint_col_shop: 'Service Shop / Mechanic',
    maint_col_parts: 'Replaced Parts',
    maint_oil_last_km: 'Last Oil Change',
    maint_oil_current_km: 'Current KM',
    maint_oil_remaining: 'KM Remaining',
    maint_oil_status_ok: 'Good Condition',
    maint_oil_status_warn: 'Due Soon (<1,000 KM)',
    maint_oil_status_critical: 'URGENT CHANGE NEEDED',

    // Inspections Module
    insp_title: 'Annual Inspection & Registration',
    insp_subtitle: 'Serbia annual vehicle registration and inspection schedule',
    insp_btn_new: 'New Inspection Record',
    insp_kpi_total: 'Total Inspections',
    insp_kpi_cost: 'Total Reg. Expense',
    insp_kpi_expiring_soon: 'Expiring in 30 Days',
    insp_kpi_expired: 'Expired',
    insp_col_expiry: 'Expiry Date',
    insp_col_station: 'Inspection Station',
    insp_status_valid: 'Valid',
    insp_status_expiring: 'Expiring Soon',
    insp_status_expired: 'EXPIRED',

    // Customers Module
    cust_title: 'Customers & Rental Documents',
    cust_subtitle: 'Customer profiles, passports, driving licenses, and rental agreements',
    cust_btn_new: 'Add Customer',
    cust_search_placeholder: 'Search name, phone, email or ID...',
    cust_col_name: 'Customer Name',
    cust_col_contact: 'Contact',
    cust_col_docs: 'Uploaded Documents',
    cust_col_rentals: 'Rental History',
    cust_col_active_car: 'Active Vehicle',
    cust_no_active_rental: 'No active rental',

    // Users Module
    users_title: 'User & Staff Management',
    users_subtitle: 'Manager and staff accounts in your fleet, access permissions',
    users_btn_new: 'Add New User',
    users_role_admin: 'Fleet Manager (ADMIN)',
    users_role_staff: 'Staff (STAFF)',
    users_col_name: 'Full Name',
    users_col_email: 'Email',
    users_col_role: 'Role',
    users_col_created: 'Created Date',
    users_btn_edit: 'Edit / Reset Password',

    // Settings Module
    sett_title: 'System & Fleet Settings',
    sett_subtitle: 'Fleet parameters, WhatsApp notifications, and security settings',
    sett_tab_system: 'System & Fleet Settings',
    sett_tab_password: 'Change Password',
    sett_general_title: 'General Fleet Info',
    sett_company_name: 'Fleet / Company Name',
    sett_phone: 'Contact & WhatsApp Number',
    sett_email: 'Operations Email',
    sett_currency: 'Default Currency',
    sett_security_title: 'Change Password',
    sett_current_pwd: 'Current Password',
    sett_new_pwd: 'New Password',
    sett_confirm_pwd: 'Confirm New Password',
    sett_btn_save: 'Save Settings',

    // Audit Logs Module
    audit_title: 'Audit & Activity Logs',
    audit_subtitle: 'All vehicle, maintenance, fine, and user actions are logged securely',
  },

  sr: {
    nav_dashboard: 'Kontrolna tabla',
    nav_super_admin: 'Super Admin Panel',
    nav_vehicles: 'Vozila',
    nav_excel_import: 'AI Excel Uvoz',
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
    dash_col_initial_expense: 'Prva Registracija i Notar',
    dash_col_operating_cost: 'Operativni Trošak',
    dash_col_total_cost: 'Ukupan Trošak Vozila',
    dash_col_amortization_left: 'Preostala Amortizacija',
    dash_col_amortization_progress: 'Status Amortizacije',
    dash_col_revenue: 'Prihod od Zakupa',
    dash_col_maint: 'Održavanje',
    dash_col_oil: 'Motorno Ulje',
    dash_col_regi: 'Registracija',
    dash_col_total_expense: 'Ukupni Izdaci / Trošak',
    dash_col_net_profit: 'Čist Profit / Saldo',
    dash_col_margin: 'Udeo Troškova',
    dash_col_services: 'Servisi i Kvarovi',
    dash_col_actions: 'Radnje',
    dash_btn_extend: 'Produži',
    dash_btn_return: 'Preuzmi',
    dash_btn_remind: 'Podseti',
    dash_loading_portal: 'Otvaranje Portala za Upravljanje Flotom...',

    // Common UI
    common_all: 'Sve',
    common_search: 'Pretraga',
    common_filter: 'Filter',
    common_save: 'Sačuvaj',
    common_saving: 'Čuvanje...',
    common_cancel: 'Otkaži',
    common_edit: 'Izmeni',
    common_delete: 'Obriši',
    common_actions: 'Radnje',
    common_details: 'Detalji',
    common_status: 'Status',
    common_plate: 'Registarska Oznaka',
    common_vehicle: 'Vozilo',
    common_customer: 'Klijent',
    common_phone: 'Telefon',
    common_date: 'Datum',
    common_amount: 'Iznos',
    common_notes: 'Beleške',
    common_close: 'Zatvori',
    common_loading: 'Učitavanje...',
    common_success: 'Uspešno Izvršeno',
    common_error: 'Došlo je do greške',
    common_no_data: 'Nema pronađenih zapisa',
    common_all_owners: 'Svi Partneri / Vlasnici',
    common_total: 'Ukupno',
    common_currency_eur: '€ (EUR)',
    common_currency_rsd: 'RSD (Dinar)',

    // Parking Tickets
    parking_title: 'Parking Kazne Beograd (Parking Servis eDPK)',
    parking_subtitle: 'Automatska provera iz sistema Parking Servis Beograd, prekršaji se odmah evidentiraju.',
    parking_scan_all: 'Skeniraj Sva Vozila Sada',
    parking_scanning: 'Skeniranje Svih Vozila...',
    parking_tab_all: 'Sve',
    parking_tab_unpaid: 'Neplaćeno',
    parking_tab_paid: 'Plaćeno',
    parking_kpi_total: 'Ukupno Kazni',
    parking_kpi_unpaid: 'Neplaćeni Dug',
    parking_kpi_notified: 'Obavešten Klijent',
    parking_kpi_waiting: 'klijenata čeka',
    parking_kpi_bot: 'Pozadinski Bot',
    parking_kpi_bot_status: 'Aktivan (1-2 Sata)',
    parking_kpi_bot_desc: 'Parking Servis eDPK API veza je aktivna',
    parking_search_placeholder: 'Pretraga broja kazne, tablice, ulice ili klijenta...',
    parking_col_ticket_no: 'Broj Kazne i Datum',
    parking_col_plate: 'Vozilo i Tablica',
    parking_col_location: 'Lokacija i Zona',
    parking_col_amount: 'Iznos Kazne',
    parking_col_status: 'Status',
    parking_col_customer: 'Klijent i Kontakt',
    parking_col_actions: 'Radnje',
    parking_notify_wa: 'Obavesti preko WhatsApp-a',
    parking_notified: 'Obavešten',
    parking_mark_paid: 'Označi kao Plaćeno',
    parking_upload_receipt: 'Učitaj Priznanicu',
    parking_status_paid: 'Plaćeno',
    parking_status_unpaid: 'Neplaćeno',
    parking_early_discount: '50% popusta u roku od 20 dana',
    parking_no_tickets: 'Nema evidentiranih parking kazni.',

    // Vehicles Module
    veh_title: 'Vozila Flote i Inventar',
    veh_subtitle: 'Vozila flote, registracioni kalendar, potrošnja goriva i status iznajmljivanja',
    veh_add_new: 'Dodaj Novo Vozilo',
    veh_tab_all: 'Sva Vozila',
    veh_tab_rented: 'U Najmu',
    veh_tab_available: 'Slobodno (Spremno)',
    veh_tab_returning_soon: 'Vraća se za 7 Dana',
    veh_tab_reg_expiring: 'Ističe Registracija (30 Dana)',
    veh_tab_faults: 'Sa Kvarom / Čeka Servis',
    veh_search_placeholder: 'Pretraga po tablici, marki, modelu ili šasiji...',
    veh_card_daily: 'Dnevno',
    veh_card_monthly: 'Mesečno',
    veh_card_km: 'Kilometraža',
    veh_card_fuel: 'Gorivo',
    veh_card_reg_expiry: 'Istek Registracije',
    veh_card_owner: 'Vlasnik / Partner',
    veh_btn_details: 'Pregled Vozila',
    veh_btn_rent: 'Iznajmi',
    veh_btn_make_available: 'Oslobodi Vozilo',
    veh_btn_service: 'Unesi Servis',
    veh_no_vehicles: 'Nema vozila koja odgovaraju kriterijumu.',
    veh_modal_add_title: 'Dodavanje Novog Vozila u Flotu',
    veh_modal_plate: 'Tablica (npr: BG-123-AB)',
    veh_modal_brand: 'Marka',
    veh_modal_model: 'Model',
    veh_modal_year: 'Godište',
    veh_modal_color: 'Boja',
    veh_modal_fuel_type: 'Vrsta Goriva',
    veh_modal_km: 'Trenutna Kilometraža',
    veh_modal_reg_expiry: 'Datum Isteka Registracije',
    veh_modal_purchase_price: 'Nabavna Cena (€)',
    veh_modal_initial_expense: 'Početni Troškovi (€)',
    veh_modal_daily_price: 'Dnevna Cena Najma (€)',
    veh_modal_monthly_price: 'Mesečna Cena Najma (€)',
    veh_modal_owner: 'Vlasnik / Partner',
    veh_modal_edit_title: 'Izmena Podataka o Vozilu',
    veh_accessories_title: 'Oprema i Dodaci u Vozilu',
    veh_accessories_subtitle: 'Oprema u vozilu koja se proverava pri preuzimanju i povratku',
    veh_tab_finance: 'Finansije i Amortizacija',
    veh_finance_title: 'Analiza Troškova, Prihoda i Amortizacije Vozila',
    veh_finance_subtitle: 'Pojedinačna profitabilnost vozila na osnovu nabavne cene, troškova registracije, servisa i prihoda od zakupa',
    veh_finance_purchase_price: 'Nabavna Cena',
    veh_finance_initial_expense: 'Troškovi Prve Registracije i Prenosa',
    veh_finance_total_investment: 'Ukupna Početna Investicija (Kupovina + Prenos)',
    veh_finance_operating_expenses: 'Operativni Troškovi (Servis + Ulje + Pregled + Kvarovi)',
    veh_finance_total_cost: 'Ukupan Trošak / Investicija Vozila',
    veh_finance_total_revenue: 'Ukupan Prihod od Zakupa',
    veh_finance_net_profit: 'Čist Finansijski Saldo',
    veh_finance_amortization_left: 'Preostalo do Otplate (Amortizacije)',
    veh_finance_amortized_badge: 'Potpuno Otplaćeno (U Profitu)',
    veh_finance_amortizing_badge: 'U Procesu Otplate',
    veh_finance_quick_edit: 'Ažuriraj Nabavnu Cenu i Registraciju',
    veh_finance_edit_title: 'Izmena Nabavne Cene i Troškova Registracije',
    veh_finance_edit_desc: 'Ažurirajte nabavnu cenu vozila i početne troškove da biste preračunali ukupan trošak i amortizaciju.',
    veh_finance_breakdown_title: 'Detaljan Pregled Troškova i Investicije',
    veh_finance_cost_item: 'Stavka Troška',
    veh_finance_cost_type: 'Vrsta Troška',
    veh_finance_cost_amount: 'Iznos (€)',
    veh_finance_cost_share: 'Udeo u Ukupnom Trošku',
    veh_finance_capex: 'Nabavka i Investicija',
    veh_finance_opex: 'Operativni Servisni Troškovi',

    // Maintenances Module
    maint_title: 'Održavanje i Motorno Ulje',
    maint_subtitle: 'Periodično servisiranje, zamena delova i kontrola ulja na 10.000 km',
    maint_tab_services: 'Opšte Održavanje i Popravke',
    maint_tab_oil: 'Praćenje Motornog Ulja (10.000 KM)',
    maint_btn_new_service: 'Novi Servisni Zapis',
    maint_btn_new_oil: 'Nova Zamena Ulja',
    maint_kpi_total_services: 'Ukupno Servisa',
    maint_kpi_total_cost: 'Ukupni Troškovi Servisa',
    maint_kpi_oil_due: 'Uskoro Zamena Ulja',
    maint_kpi_oil_overdue: 'Prekoračena Kilometraža',
    maint_col_date: 'Datum',
    maint_col_vehicle: 'Vozilo i Tablica',
    maint_col_km: 'Servisna Kilometraža',
    maint_col_cost: 'Trošak',
    maint_col_shop: 'Servis / Majstor',
    maint_col_parts: 'Zamenjeni Delovi',
    maint_oil_last_km: 'Poslednja Zamena',
    maint_oil_current_km: 'Trenutni KM',
    maint_oil_remaining: 'Preostalo KM',
    maint_oil_status_ok: 'U Redu',
    maint_oil_status_warn: 'Uskoro (<1.000 KM)',
    maint_oil_status_critical: 'HITNA ZAMENA POTREBNA',

    // Inspections Module
    insp_title: 'Tehnički Pregled i Registracija',
    insp_subtitle: 'Praćenje godišnjeg tehničkog pregleda i registracije u Srbiji',
    insp_btn_new: 'Novi Tehnički Pregled',
    insp_kpi_total: 'Ukupno Pregleda',
    insp_kpi_cost: 'Ukupni Trošak Registracije',
    insp_kpi_expiring_soon: 'Ističe u 30 Dana',
    insp_kpi_expired: 'Istekla Registracija',
    insp_col_expiry: 'Istek Važenja',
    insp_col_station: 'Tehnički Pregled Centar',
    insp_status_valid: 'Važeća',
    insp_status_expiring: 'Uskoro Ističe',
    insp_status_expired: 'ISTEKLO',

    // Customers Module
    cust_title: 'Klijenti i Dokumenta o Najmu',
    cust_subtitle: 'Profili klijenata, pasoši, vozačke dozvole i ugovori o najmu',
    cust_btn_new: 'Dodaj Klijenta',
    cust_search_placeholder: 'Pretraga imena, telefona, email-a ili broja lične karte...',
    cust_col_name: 'Ime Klijenta',
    cust_col_contact: 'Kontakt',
    cust_col_docs: 'Učitana Dokumenta',
    cust_col_rentals: 'Istorija Najmova',
    cust_col_active_car: 'Aktivno Vozilo',
    cust_no_active_rental: 'Nema aktivnog najma',

    // Users Module
    users_title: 'Upravljanje Korisnicima i Osobljem',
    users_subtitle: 'Nalozi administratora i osoblja u vašoj floti, pristupna prava',
    users_btn_new: 'Dodaj Novog Korisnika',
    users_role_admin: 'Menadžer Flote (ADMIN)',
    users_role_staff: 'Osoblje (STAFF)',
    users_col_name: 'Ime i Prezime',
    users_col_email: 'Email Adresa',
    users_col_role: 'Uloga',
    users_col_created: 'Datum Registracije',
    users_btn_edit: 'Izmeni / Resetuj Lozinku',

    // Settings Module
    sett_title: 'Podešavanja Sistema i Flote',
    sett_subtitle: 'Parametri flote, WhatsApp obaveštenja i bezbednosna podešavanja',
    sett_tab_system: 'Podešavanja Sistema i Flote',
    sett_tab_password: 'Promena Lozinke',
    sett_general_title: 'Opšte Informacije o Floti',
    sett_company_name: 'Naziv Flote / Firme',
    sett_phone: 'Broj Telefona i WhatsApp-a',
    sett_email: 'Email Operacija',
    sett_currency: 'Podrazumevana Valuta',
    sett_security_title: 'Promena Lozinke',
    sett_current_pwd: 'Trenutna Lozinka',
    sett_new_pwd: 'Nova Lozinka',
    sett_confirm_pwd: 'Potvrda Nove Lozinke',
    sett_btn_save: 'Sačuvaj Podešavanja',

    // Audit Logs Module
    audit_title: 'Evidencija Aktivnosti (Audit Logs)',
    audit_subtitle: 'Sve radnje sa vozilima, servisima, kaznama i korisnicima se beleže',
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
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('filo_language') as Language;
        if (saved === 'tr' || saved === 'en' || saved === 'sr') {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return 'tr';
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('filo_language') as Language;
        if (saved && (saved === 'tr' || saved === 'en' || saved === 'sr')) {
          setLanguageState(saved);
          document.documentElement.lang = saved;
        }
      } catch {
        // ignore
      }
    };

    handleSync();
    window.addEventListener('storage', handleSync);
    window.addEventListener('filo_language_change', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('filo_language_change', handleSync);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('filo_language', lang);
      document.cookie = `filo_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = lang;
      window.dispatchEvent(new Event('filo_language_change'));
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
