# FILOMENAGE

Filo yönetimi, araç takibi, bakım, kiralama ve operasyonel raporlamayı tek bir Next.js uygulamasında sunan kurumsal sistemdir.

Versiyon: 1.0.2

## Amaç

Bu proje, filo sahipleri ve yöneticileri için:
- araçların listelenmesi ve takibi,
- kiralama ve iade akışları,
- bakım / yağ değişimi / muayene takibi,
- müşteri ve kullanıcı yönetimi,
- güvenlik logları ve erişim kontrolü
sağlamayı hedefler.

## Teknoloji Yığını

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL / Supabase uyumlu yapı
- bcryptjs

## Çalıştırma

1. Bağımlılıkları kur:
```bash
npm install
```

2. Ortam değişkenlerini hazırlayın:
```bash
cp .env.example .env
```

Üretim ortamında (ör. Vercel) `NEXTAUTH_SECRET` için güçlü ve benzersiz bir değer tanımlayın. Örnek değer yalnızca şablondur; üretimde kullanmayın.

3. Veritabanını eşitleyin:
```bash
npx prisma db push
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

Uygulama varsayılan olarak http://localhost:3000 adresinde çalışır.

## Veritabanı ve seed

- Veritabanı reset durumunda yeni bir temiz başlangıç oluşturmak için:
```bash
npm run db:seed
```
- Bu işlemin amacı, yerel geliştirme / demo verilerini temiz ve yeniden üretilebilir tutmaktır.

## Güvenlik notu

- Yönetici yetkisi veritabanındaki `role` alanına göre belirlenir.
- Email bazlı hardcoded super-admin bypass kaldırılmıştır.
- Oturum cookie'leri Web Crypto HMAC-SHA256 ile imzalanıp doğrulanır.
- İmza doğrulaması için Edge Runtime uyumlu Web Crypto kullanılır.

## Versiyon Yönetimi

Bu projede versiyon yönetimi `package.json` üzerinden yapılır. Yeni bir değişiklik eklenmeden önce uygun seviyeyi artırın:

```bash
npm run version:patch
npm run version:minor
npm run version:major
```

Mevcut sürüm şu anda:
```bash
npm run version:show
```

## Geliştirme Notları

- Kodlar için güvenlik ve yetki kontrolleri önemlidir.
- Özellikle session cookie, role doğrulaması ve admin erişim rotaları düzenli olarak kontrol edilmelidir.
- Yeni özellik eklenirken ilgili README ve versiyon bilgisi güncellenmelidir.
