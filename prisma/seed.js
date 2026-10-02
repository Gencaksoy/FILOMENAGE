const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Veritabanı Sıfırlanıyor (Tüm Araçlar, Müşteriler ve Kayıtlar Temizleniyor) ---');

  await prisma.vehicleFault.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.inspectionRecord.deleteMany();
  await prisma.oilChangeRecord.deleteMany();
  await prisma.maintenancePart.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.customerDocument.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.serviceShop.deleteMany();
  await prisma.user.deleteMany();

  console.log('--- Tek Yönetici Hesabı Oluşturuluyor: Akif Aksoy ---');
  const adminHash = await bcrypt.hash('admin123', 10);

  await prisma.user.create({
    data: {
      name: 'Akif Aksoy',
      email: 'akif@filoyonetim.com',
      passwordHash: adminHash,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('--- Sistem Temiz ve Boş Olarak Hazırlandı ---');
  console.log('Toplam Araç: 0');
  console.log('Toplam Müşteri: 0');
  console.log('Yönetici: Akif Aksoy (akif@filoyonetim.com / admin123)');
}

main()
  .catch((e) => {
    console.error('Seed Hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
