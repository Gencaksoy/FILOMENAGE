# 🚗 FILOMENAGE - SaaS Filo Yönetim & Rent a Car Sistemi
## 📌 Proje Hafızası & Sistem Mimarisi Rehberi (PROJECT_MEMORY.md)

Bu dosya, projenin mimarisini, dosya yapısını, kritik iş kurallarını, veri modellerini, uygulanan becerileri (skills) ve gelecekteki geliştirmelerde referans alınacak tüm detayları eksiksiz olarak belgelemektedir.

---

## 🏢 1. Proje Genel Bakışı
- **Adı / Repo:** FILOMENAGE (`https://github.com/System/FILOMENAGE.git` - branch: `main`)
- **Amaç:** Çok kiracılı (Multi-tenant), bulut tabanlı modern Rent a Car ve Filo Yönetim SaaS Platformu.
- **Birincil Hedef Pazar:** Sırbistan (Belgrad) operasyonları ağırlıklı olup küresel kullanıma uygundur.
- **Para Birimleri:** EUR (€) ve RSD (Sırp Dinarı). Sabit / Operasyonel Kur: **1 EUR = 117 RSD**.
- **Çoklu Dil (Trilingual i18n):** Türkçe (TR), Sırpça (SR - Latin), İngilizce (EN).
- **Tema:** Açık (Light) & Koyu (Dark) mod desteği (Amber & Slate paleti, sıfır kontrast hatası).

---

## ⚙️ 2. Teknoloji Yığını (Tech Stack)
- **Framework:** Next.js 14.2.15 (App Router, Server & Client Components)
- **Kütüphaneler:** React 18, TypeScript (Strict Mode)
- **Stil & Tasarım:** Tailwind CSS, PostCSS, Lucide React ikon seti
- **Veritabanı & ORM:** SQLite / Prisma ORM
- **Yetkilendirme:** JWT tabanlı Cookie & Header kimlik doğrulama (`/api/auth/*`)
- **Bildirim & Geri Bildirim:** `@/components/ui/Toast` (Erişilebilir, `role="alert"`, animasyonlu, trilingual)
- **Yükleme Durumları (CLS Önleme):** `@/components/ui/Skeleton` (`KpiSkeleton`, `TableSkeleton`, `VehicleGridSkeleton`)

---

## 👥 3. Rol ve Yetki Matrisi (Role Matrix)

| Rol | Kapsam | İzin Verilen İşlemler | Kısıtlanan İşlemler |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | SaaS Sahibi (System Owner) | Sistemdeki tüm filoları görüntüleme, yeni filo açma, filo silme, araç kotası (`maxVehicles`) belirleme, modül erişimi açma/kapama, abonelik uzatma, arşiv yönetimi, kullanıcı şifresi sıfırlama. | Yok |
| **`ADMIN`** | Filo Yöneticisi | Kendi filosuna araç ekleme/düzenleme/silme, kiralama başlatma/bitirme, fiyatlandırma, ciro ve amortisman raporları, kullanıcı tanımlama/askıya alma, sistem parametreleri. | Başka filoları veya SaaS süper admin verilerini göremez. |
| **`STAFF`** | Filo Personeli | Kiralama başlatma, iade alma, teslimat/iade fotoğrafları yükleme, arıza/hasar kaydı açma, masraf fişi girme. | Araç silme, arıza silme, müşteri silme ve filo silme yetkisi **yoktur**; kritik finansal raporlar kısıtlıdır. |

*SaaS Yöneticisi İletişim:* WhatsApp: `+381 617 027 504` (Filo satın alma, lisans genişletme ve ek araç kotası talepleri).

---

## 🌐 4. Çoklu Dil (i18n) & Yerelleştirme Mimarisi
- **Kaynak Dosya:** [src/lib/i18n.tsx](file:///C:/Users/user/Desktop/Yeni%20klas%C3%B6r/src/lib/i18n.tsx)
- **Diller:**
  - `'tr'`: Türkçe
  - `'sr'`: Sırpça (Srpski Latinica - *Registracija, Održavanje, Zamena ulja, Kazne za parkiranje, Klijenti, Vozila*)
  - `'en'`: İngilizce (*Vehicles, Rentals, Maintenance, Oil Change, Customers, Parking Tickets*)
- **Kullanım Biçimi:**
  ```tsx
  import { useLanguage } from '@/lib/i18n';
  const { t, language, setLanguage } = useLanguage();
  ```
- **Kural:** Sistem genelinde hiçbir sabit Türkçe/İngilizce metin yalın olarak bırakılmamalıdır; `t.*` anahtarları veya `language === 'sr' ? '...' : language === 'en' ? '...' : '...'` kontrolü kullanılmalıdır.
- **Tarih & Saat:** Sırbistan saat dilimi (`Europe/Belgrade`, GMT+1 kış / GMT+2 yaz) üzerinden formatlanır ([src/lib/formatters.ts](file:///C:/Users/user/Desktop/Yeni%20klas%C3%B6r/src/lib/formatters.ts)).

---

## 🎨 5. UI/UX Pro Max Standartları & Tasarım Sistemi
Projede `ui-ux-pro-max-skill-main` prensipleri uygulanmaktadır:

1. **Engelleyici Pop-up Yasağı:**
   - Tarayıcının standart `window.alert(...)` ve `window.confirm(...)` çağrıları yerine modern `Toast` bileşeni kullanılır.
   - Toast'lar 3.5 saniye sonra yumuşak kayma ile otomatik kapanır, isteğe bağlı kapatma düğmesi içerir ve hata durumlarında dikkat sesi tetikler (`triggerNotificationAlertOnce()`).
2. **Sıfır Yer Değiştirme (Zero Cumulative Layout Shift):**
   - Sayfa ilk açılışlarında tam ekran siyah spinner yerine içerikle birebir orantılı `Skeleton` bileşenleri yer alır:
     - `KpiSkeleton`: Üst özet KPI kartları
     - `TableSkeleton`: Tablo satır ve sütunları
     - `VehicleGridSkeleton`: Araç kartları ızgarası
3. **Dokunma ve Erişilebilirlik:**
   - Mobil butonlar ve etkileşimli öğeler en az 44px yüksekliğe sahiptir.
   - Odaklanma (Focus) durumlarında amber rengi halkalar (`focus:ring-2 focus:ring-amber-500/20`) kullanılır.
4. **Filo Kodu Rozeti:**
   - Dashboard üst başlığında `Kod: <FİLO_KODU>` rozeti gösterilir.

---

## 📂 6. Dosya ve Dizin Ağacı Haritası

```text
├── docs/
│   └── superpowers/plans/
│       └── 2026-10-04-system-ui-ux-enhancement.md   # Uygulanan UX modernizasyon planı
├── prisma/
│   └── schema.prisma                                 # SQLite veritabanı modelleri
├── public/                                           # Statik varlıklar, logolar, araç SVG'leri
├── src/
│   ├── app/
│   │   ├── page.tsx                                  # Landing Page (misafir) & Dashboard (giriş yapılmış)
│   │   ├── layout.tsx                                # Kök HTML ve font yapılandırması
│   │   ├── login/page.tsx                            # Giriş sayfası
│   │   ├── register/page.tsx                         # Yeni filo kayıt sayfası
│   │   ├── vehicles/                                 # Araç listesi ve filtreleme
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx                         # Araç detay, teslimat fotoğrafları, arıza, masraf
│   │   ├── customers/page.tsx                        # Müşteri ve belge (pasaport/ehliyet) yönetimi
│   │   ├── maintenances/page.tsx                     # Periyodik bakım ve motor yağı takibi
│   │   ├── parking-tickets/page.tsx                  # eDPK Belgrad park cezası sorgulama & WhatsApp
│   │   ├── users/page.tsx                            # Personel ve yönetici hesapları
│   │   ├── settings/page.tsx                         # Filo ayarları, şifre değiştirme
│   │   ├── super-admin/page.tsx                      # SaaS Super Admin yönetim konsolu
│   │   ├── audit-logs/page.tsx                       # Sistem denetim izi
│   │   ├── inspection/page.tsx                       # Muayene ve tescil bitiş takipleri
│   │   ├── notifications/page.tsx                    # Bildirim merkezi
│   │   └── api/                                      # Next.js App Router REST API uç noktaları
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx                         # Sidebar, Header, Modül yetkilendirme sarmalayıcısı
│   │   │   ├── Sidebar.tsx                           # Sol navigasyon menüsü
│   │   │   └── Header.tsx                            # Üst bar, dil ve tema seçiciler
│   │   ├── providers/
│   │   │   ├── ClientProviders.tsx                   # AuthProvider, ThemeProvider, ToastProvider sarmalayıcısı
│   │   │   └── ThemeProvider.tsx                     # Koyu/Açık tema sağlayıcısı
│   │   ├── ui/
│   │   │   ├── Toast.tsx                             # Trilingual cam efektli bildirim sistemi
│   │   │   ├── Skeleton.tsx                          # Sıfır CLS iskelet yükleyiciler
│   │   │   ├── Modal.tsx                             # Erişilebilir diyalog penceresi
│   │   │   └── ImageLightbox.tsx                     # Fotoğraf büyütme modalı
│   │   └── landing/
│   │       └── LandingPage.tsx                       # SaaS tanıtım ve satış sayfası
│   └── lib/
│       ├── auth-client.ts                            # İstemci tarafı oturum yardımcıları
│       ├── auth-context.tsx                          # AuthContext oturum durumu
│       ├── formatters.ts                             # Tarih, saat, KM, EUR-RSD döviz çeviricileri
│       ├── i18n.tsx                                  # Dil sözlükleri ve useLanguage kancası
│       ├── prisma.ts                                 # Prisma istemci singleton örneği
│       └── validation.ts                             # Şifre ve e-posta doğrulama kuralları
├── PROJECT_MEMORY.md                                 # Bu dosya (Sistem hafıza kılavuzu)
└── tsconfig.json                                     # TypeScript yapılandırması
```

---

## 🗄️ 7. Veritabanı Modelleri (Özet)
- **`Fleet`:** Filo adı, kodu (`code`), yönetici bilgileri, araç kotası (`maxVehicles`), abonelik bitişi (`subscriptionEnd`), ortaklık durumu (`isPartnership`), aktif modüller JSON (`features`).
- **`User`:** Kullanıcı adı, e-posta, şifre hash'i, rolü (`SUPER_ADMIN`, `ADMIN`, `STAFF`), ait olduğu filo (`fleetId`), aktiflik durumu (`isActive`).
- **`Vehicle`:** Plaka (`plate`), marka, model, yıl, renk, güncel KM, yakıt tipi, tescil bitişi (`registrationExpiry`), alış fiyatı, günlük/aylık kira bedelleri, durum (`AVAILABLE`, `RENTED`, `MAINTENANCE`, `POST_RENTAL_CHECK`), donanımlar JSON (`accessories`).
- **`Customer`:** Ad soyad, telefon, kimlik/pasaport no, adres, notlar.
- **`Document`:** Müşteriye ait kimlik/ehliyet/sözleşme belgeleri ve görsel URL'leri.
- **`Rental`:** Aktif/geçmiş kiralamalar, başlangıç-bitiş tarihleri, aylık kira, indirim, teslimat ve iade fotoğrafları, teslim KM'si ve iade KM'si.
- **`Maintenance` & `MaintenancePart`:** Periyodik bakım detayları, servis adı, işçilik, parça kodları ve maliyetleri.
- **`OilChange`:** Motor yağı değişim KM'si, yağ tipi, filtre değişim durumu, maliyet.
- **`Fault`:** Arıza/hasar başlığı, açıklaması, şiddeti (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), durumu (`OPEN`, `RESOLVED`), maliyeti.
- **`ParkingTicket`:** eDPK park cezası numarası, plaka, sokak, bölge, RSD ve EUR tutarı, ceza tarihi, ödeme durumu (`PAID`, `UNPAID`).
- **`AuditLog`:** Kullanıcı işlemlerinin denetim izi (kim, ne zaman, hangi işlemi yaptı).
- **`Archive`:** Sistemden silinen kayıtların geri döndürülebilir yedek kopyası.

---

## 🛠️ 8. Geliştirici ve Çalıştırma Komutları
- **Bağımlılık Yükleme:** `npm install`
- **Geliştirme Sunucusu:** `npm run dev` (Port: 3000)
- **Üretim Derlemesi Doğrulama:** `npx next build`
- **Prisma Veritabanı Güncelleme:** `npx prisma db push`
- **Git Binary Konumu (Windows Local):** `& "C:\Users\user\AppData\Local\MinGit\cmd\git.exe"`

---

*Son Güncelleme: 04 Ekim 2026 - FILOMENAGE Core Architecture*
