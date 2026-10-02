# YILDIZ FİLO – Kurumsal Araç Kiralama, Kurye, Zimmet & Masraf Yönetim Paneli

Modern, profesyonel ve kurumsal araç kiralama / filo yönetim web uygulaması.

---

## 🚀 Hızlı Başlangıç

### 1. Geliştirici Sunucusunu Başlatma:
```bash
npm run dev
```
Uygulama varsayılan olarak **http://localhost:3000** adresinde açılır.

### 2. Demo Giriş Bilgileri:

| Rol | E-posta | Şifre | Yetki Açıklaması |
|---|---|---|---|
| **Yönetici (Admin)** | `yonetici@filo.com` | `admin123` | Tam Yetkili: Araç silme/ekleme, kurye, zimmet, bakım, masraf, kullanıcı yönetimi, denetim logları |
| **Personel 1** | `personel1@filo.com` | `user123` | Operasyonel Yetki: Araç ve kurye işlemleri, zimmet verme/geri alma, bakım ve masraf girişi |
| **Personel 2** | `personel2@filo.com` | `user123` | Operasyonel Yetki: Araç ve kurye takibi, kilometre ve yakıt kayıtları yönetimi |

*Giriş ekranında tek tıkla test yapabilmeniz için hızlı giriş butonları da bulunmaktadır.*

---

## 🛠️ Teknoloji Yığını

- **Frontend & Backend**: Next.js 14 (App Router), TypeScript, React 18
- **Stil & Arayüz**: Tailwind CSS, Lucide Icons, Recharts (Modern Veri Grafikleri)
- **Veritabanı & ORM**: SQLite (`prisma/dev.db`) + Prisma ORM *(İstenildiğinde `schema.prisma` içerisinden tek satırla PostgreSQL'e dönüştürülebilir)*
- **Kimlik Doğrulama**: Güvenli HTTP-Only Cookie Session, Bcrypt Şifreleme
- **Dışa Aktarma**: SheetJS (XLSX) ile Excel ve CSV Dışa Aktarımı
- **QR Kod**: QR Code SVG Motoru (Araç Hızlı Erişim Kartları)

---

## 📦 Temel Modüller ve Özellikler

1. **Dashboard (Filo Özeti & KPI'lar)**
   - Toplam, aktif, boşta, kuryede, bakımda ve servisteki araç sayıları.
   - Yaklaşan ve geciken bakımlar paneli (hem gün hem kilometre bazlı otomatik hesaplama).
   - Son 6 aylık masraf trendi grafiği, durum dağılımı donut grafiği.
   - Son işlem geçmişi (Audit log özeti).

2. **Araçlar Modülü**
   - Tüm teknik detaylar (Plaka, marka, model, şasi no, motor no, yakıt, vites vb.).
   - Aynı plaka ve şasi numarasının tekrar eklenmesini engelleyen veri bütünlüğü kontrolleri.
   - Kilometrenin geriye doğru düşürülmesini engelleyen doğrulama mekanizması.
   - Her araç için benzersiz yazdırılabilir QR Kod üretimi.
   - Silme işleminde soft-delete (veri kaybını önlemek için geçmiş kayıtlar korunarak pasife alma).

3. **Gelişmiş Araç Profil Sayfası**
   - Büyük özet kartı (Plaka, güncel KM, kurye, sonraki bakım, toplam masraf).
   - 9 Ayrı Sekme: Genel Bilgiler, Kurye & Zimmet Geçmişi, Bakım Geçmişi, Masraflar, KM Geçmişi, Yakıt Kayıtları, Sigorta/Kasko, Muayene (TÜVTÜRK), Hasar Kayıtları, Denetim İzi.

4. **Kuryeler Modülü**
   - Kurye kimlik, telefon, işe başlama bilgileri.
   - Kurye araç geçmişi: Hangi tarihler arasında hangi aracı kullandı, kaç KM yaptı?

5. **Araç – Kurye Zimmet Sistemi**
   - Araç tesliminde otomatik durum güncellemesi (`Kuryede`).
   - Araç geri alma (iade) modalı: Kullanım süresi ve kullanılan KM otomatik hesaplanır, araç boşta durumuna çekilir.

6. **Bakım & Dinamik Parça Sistemi**
   - Bakım faturası oluşturma, servis seçimi.
   - Dinamik parça ekleme (Parça adı, marka, adet, birim fiyat & otomatik satır toplamı).
   - Otomatik bakım masrafı oluşturma ve araç güncel KM güncellemesi.

7. **Masraflar & Servisler Modülü**
   - 12 farklı masraf kategorisi (Periyodik bakım, arıza, lastik, muayene, sigorta vb.).
   - Anlaşmalı servis veritabanı, servis bazında toplam harcama ve işlem istatistikleri.

8. **Kilometre & Yakıt Takibi**
   - Günlük/rutin sayaç okumaları.
   - Yakıt tüketim, litre fiyatı ve toplam tutar analizleri.

9. **Sigorta & Muayene Takibi**
   - Kasko ve trafik poliçeleri (yaklaşan vade gün uyarısı).
   - TÜVTÜRK periyodik muayene takvimi.

10. **Raporlar & Excel Dışa Aktarım**
    - Araç masraf & kilometre maliyeti raporu.
    - Servis harcama raporu.
    - Kurye sürüş ve kullanım raporu.
    - Tüm tablolarda **Excel (.xlsx)** ve **CSV** butonları.

11. **Güvenlik & Denetim Günlüğü (Audit Log)**
    - Sistem üzerinde yapılan her kritik işlem (oluşturma, güncelleme, silme, zimmet, iade, giriş) otomatik kaydedilir ve değiştirilemez.

12. **Sistem Ayarları**
    - Bakım uyarı süreleri (30 gün sarı, 7 gün turuncu) ve kilometre uyarı eşikleri (2.000 KM sarı, 500 KM turuncu) yönetici tarafından değiştirilebilir.
