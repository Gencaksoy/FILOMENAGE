import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Comprehensive Seed & Correlation Fix ---');

  // 1. Verify fleet
  const fleet = await prisma.fleet.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });

  if (!fleet) {
    throw new Error('No active fleet found in database!');
  }

  const fleetId = fleet.id;
  console.log(`Using Fleet: ${fleet.name} (${fleet.code}, ID: ${fleetId})`);

  // 2. Ensure all existing users belong to proper fleet or super admin
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (u.role === 'SUPER_ADMIN') {
      console.log(`User ${u.name} (${u.email}) is Super Admin.`);
    } else {
      if (u.fleetId !== fleetId) {
        await prisma.user.update({
          where: { id: u.id },
          data: { fleetId, isActive: true },
        });
        console.log(`Linked user ${u.name} (${u.email}) to fleet ${fleetId}.`);
      }
    }
  }

  // 3. Fix / Clean existing records
  await prisma.vehicle.updateMany({
    where: { fleetId: null },
    data: { fleetId },
  });
  await prisma.customer.updateMany({
    where: { fleetId: null },
    data: { fleetId },
  });

  // Fix unprofessional placeholder names from earlier manual testing
  await prisma.vehicle.updateMany({
    where: { plate: 'BGASDA' },
    data: {
      plate: 'BG 819-KV',
      brand: 'Renault',
      model: 'Megane 1.5 dCi',
      modelYear: 2020,
      color: 'Gümüş Gri',
      owner: 'Atilla',
      currentKm: 142000,
      monthlyPrice: 380,
      dailyPrice: 25,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 950,
      status: 'AVAILABLE',
      vin: 'VF1RFB00465819203',
      engineNo: 'K9K872U019283',
      chronicIssues: 'Yok',
    },
  });

  await prisma.vehicle.updateMany({
    where: { plate: 'BG33QAA' },
    data: {
      plate: 'BG 391-ZR',
      brand: 'Skoda',
      model: 'Octavia 1.6 TDI',
      modelYear: 2021,
      color: 'Beyaz',
      owner: 'Atilla',
      currentKm: 118000,
      monthlyPrice: 420,
      dailyPrice: 28,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 980,
      status: 'AVAILABLE',
      vin: 'TMBAG7NE3M0098231',
      engineNo: 'DGTE847192',
      chronicIssues: 'Yok',
    },
  });

  await prisma.vehicle.updateMany({
    where: { plate: 'B3131' },
    data: {
      plate: 'BG 245-TX',
      brand: 'Peugeot',
      model: '308 1.5 BlueHDi',
      modelYear: 2021,
      color: 'Füme',
      owner: 'Onur',
      currentKm: 98500,
      monthlyPrice: 400,
      dailyPrice: 26,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 920,
      status: 'AVAILABLE',
      vin: 'VF3LPHYH6MS110294',
      engineNo: 'YH010049281',
      chronicIssues: 'AdBlue seviyesi düzenli kontrol edilmeli',
    },
  });

  await prisma.vehicle.updateMany({
    where: { plate: 'BG 1709-OT' },
    data: {
      brand: 'Volkswagen',
      model: 'Passat 2.0 TDI Highline',
      modelYear: 2020,
      color: 'Siyah',
      owner: 'Onur',
      currentKm: 165000,
      monthlyPrice: 450,
      dailyPrice: 30,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 1100,
      vin: 'WVWZZZ3CZLE091823',
      engineNo: 'DFCA819203',
      chronicIssues: 'DSG mekatronik yağı kontrol edilmeli',
      fleetId,
    },
  });

  // 4. Seed Vehicles to ensure 10 total
  const vehicleDefs = [
    // 5 owned by Onur (Buy2Cars)
    {
      plate: 'BG 1709-OT',
      brand: 'Volkswagen',
      model: 'Passat 2.0 TDI Highline',
      modelYear: 2020,
      color: 'Siyah',
      owner: 'Onur',
      currentKm: 165000,
      monthlyPrice: 450,
      dailyPrice: 30,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 1100,
      status: 'RENTED',
      vin: 'WVWZZZ3CZLE091823',
      engineNo: 'DFCA819203',
      chronicIssues: 'DSG mekatronik yağı kontrol edilmeli',
      registrationExpiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 gün kaldı (ALARM)
    },
    {
      plate: 'BG 245-TX',
      brand: 'Peugeot',
      model: '308 1.5 BlueHDi',
      modelYear: 2021,
      color: 'Füme',
      owner: 'Onur',
      currentKm: 98500,
      monthlyPrice: 400,
      dailyPrice: 26,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 920,
      status: 'RENTED',
      vin: 'VF3LPHYH6MS110294',
      engineNo: 'YH010049281',
      chronicIssues: 'AdBlue seviyesi düzenli kontrol edilmeli',
      registrationExpiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    },
    {
      plate: 'BG 102-MM',
      brand: 'Audi',
      model: 'A4 2.0 TDI S-Tronic',
      modelYear: 2019,
      color: 'Metalik Gri',
      owner: 'Onur',
      currentKm: 178000,
      monthlyPrice: 480,
      dailyPrice: 32,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 1150,
      status: 'AVAILABLE',
      vin: 'WAUZZZF45KA019284',
      engineNo: 'DETA910293',
      chronicIssues: 'Yok',
      registrationExpiry: new Date(Date.now() + 210 * 24 * 60 * 60 * 1000),
    },
    {
      plate: 'BG 734-CD',
      brand: 'Fiat',
      model: 'Tipo 1.3 Multijet Lounge',
      modelYear: 2022,
      color: 'Lacivert',
      owner: 'Onur',
      currentKm: 64000,
      monthlyPrice: 350,
      dailyPrice: 22,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 850,
      status: 'AVAILABLE',
      vin: 'ZFA35600006712391',
      engineNo: '199B100049102',
      chronicIssues: 'Yok',
      registrationExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
    {
      plate: 'BG 415-KL',
      brand: 'Renault',
      model: 'Clio 1.0 TCe Touch',
      modelYear: 2022,
      color: 'Alev Kırmızı',
      owner: 'Onur',
      currentKm: 52000,
      monthlyPrice: 340,
      dailyPrice: 20,
      fuelType: 'Benzin',
      fuelConsumptionRsd: 980,
      status: 'MAINTENANCE',
      vin: 'VF1RJA00468901234',
      engineNo: 'H4D470U019283',
      chronicIssues: 'Klima gazı dolumu planlandı',
      registrationExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },

    // 5 owned by Atilla (Autentra)
    {
      plate: 'BG 819-KV',
      brand: 'Renault',
      model: 'Megane 1.5 dCi Icon',
      modelYear: 2020,
      color: 'Gümüş Gri',
      owner: 'Atilla',
      currentKm: 142000,
      monthlyPrice: 380,
      dailyPrice: 25,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 950,
      status: 'RENTED',
      vin: 'VF1RFB00465819203',
      engineNo: 'K9K872U019283',
      chronicIssues: 'Yok',
      registrationExpiry: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    },
    {
      plate: 'BG 391-ZR',
      brand: 'Skoda',
      model: 'Octavia 1.6 TDI Style',
      modelYear: 2021,
      color: 'Kar Beyazı',
      owner: 'Atilla',
      currentKm: 118000,
      monthlyPrice: 420,
      dailyPrice: 28,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 980,
      status: 'RENTED',
      vin: 'TMBAG7NE3M0098231',
      engineNo: 'DGTE847192',
      chronicIssues: 'Yok',
      registrationExpiry: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000), // 11 gün kaldı (ALARM)
    },
    {
      plate: 'BG 512-AB',
      brand: 'Ford',
      model: 'Focus 1.5 EcoBlue Titanium',
      modelYear: 2021,
      color: 'Manyetik Gri',
      owner: 'Atilla',
      currentKm: 104000,
      monthlyPrice: 410,
      dailyPrice: 27,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 940,
      status: 'AVAILABLE',
      vin: 'WF0NXXGCHNMA09182',
      engineNo: 'ZTDA910294',
      chronicIssues: 'Yok',
      registrationExpiry: new Date(Date.now() + 160 * 24 * 60 * 60 * 1000),
    },
    {
      plate: 'BG 608-EF',
      brand: 'Toyota',
      model: 'Corolla 1.8 Hybrid e-CVT',
      modelYear: 2022,
      color: 'Sedef Beyaz',
      owner: 'Atilla',
      currentKm: 71000,
      monthlyPrice: 460,
      dailyPrice: 30,
      fuelType: 'Benzin',
      fuelConsumptionRsd: 780,
      status: 'AVAILABLE',
      vin: 'SB1ZE3BE10E019284',
      engineNo: '2ZRFXE819203',
      chronicIssues: 'Yok - Çok ekonomik hibrit',
      registrationExpiry: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
    },
    {
      plate: 'BG 921-GH',
      brand: 'Opel',
      model: 'Astra 1.6 CDTI Enjoy',
      modelYear: 2019,
      color: 'Koyu Mavi',
      owner: 'Atilla',
      currentKm: 153000,
      monthlyPrice: 360,
      dailyPrice: 24,
      fuelType: 'Dizel',
      fuelConsumptionRsd: 960,
      status: 'POST_RENTAL_CHECK',
      vin: 'W0VBD6EC4KG091823',
      engineNo: 'B16DTH910293',
      chronicIssues: 'Zincir sesi kontrol edildi, sorunsuz',
      registrationExpiry: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
    },
  ];

  const dbVehicles: Record<string, any> = {};

  for (const def of vehicleDefs) {
    const existing = await prisma.vehicle.findUnique({ where: { plate: def.plate } });
    if (existing) {
      const updated = await prisma.vehicle.update({
        where: { id: existing.id },
        data: {
          ...def,
          fleetId,
          isDeleted: false,
        },
      });
      dbVehicles[def.plate] = updated;
    } else {
      const created = await prisma.vehicle.create({
        data: {
          ...def,
          fleetId,
          isDeleted: false,
          purchasePrice: 9500,
          initialExpenses: 650,
          accessories: '["Telefon Tutucu", "Çakmaklık Şarj Aleti", "İlk Yardım Çantası", "Reflektör & Yangın Tüpü", "Paspas Seti"]',
        },
      });
      dbVehicles[def.plate] = created;
    }
  }

  console.log(`Verified ${Object.keys(dbVehicles).length} vehicles.`);

  // 5. Seed 10 Realistic Customers
  const customerDefs = [
    { name: 'Nikola Petrović', phone: '+381641122334', identityNo: '012938471', email: 'nikola.petrovic@gmail.com', address: 'Knez Mihailova 12, Beograd' },
    { name: 'Marko Jovanović', phone: '+381659988771', identityNo: '098765432', email: 'marko.j@yahoo.com', address: 'Bulevar Kralja Aleksandra 44, Beograd' },
    { name: 'Aleksandar Đorđević', phone: '+381634567890', identityNo: '112233445', email: 'aleksandar.dj@gmail.com', address: 'Balkanska 18, Beograd' },
    { name: 'Stefan Nikolić', phone: '+381601234567', identityNo: '223344556', email: 'stefan.nikolic@hotmail.com', address: 'Terazije 5, Beograd' },
    { name: 'Milan Stojanović', phone: '+381622345678', identityNo: '334455667', email: 'milan.st@gmail.com', address: 'Požeška 82, Banovo Brdo' },
    { name: 'Dušan Ilić', phone: '+381649876543', identityNo: '445566778', email: 'dusan.ilic@outlook.com', address: 'Jurija Gagarina 22, Novi Beograd' },
    { name: 'Jelena Simić', phone: '+381631122445', identityNo: '556677889', email: 'jelena.simic@gmail.com', address: 'Vojvode Stepe 120, Voždovac' },
    { name: 'Milica Radović', phone: '+381653344556', identityNo: '667788990', email: 'milica.radovic@gmail.com', address: 'Cara Dušana 54, Dorćol' },
    { name: 'Nemanja Popović', phone: '+381628877665', identityNo: '778899001', email: 'nemanja.pop@gmail.com', address: 'Gospodska 14, Zemun' },
    { name: 'Vladimir Lukić', phone: '+381607766554', identityNo: '889900112', email: 'vladimir.lukic@gmail.com', address: 'Bulevar Mihajla Pupina 10, Novi Beograd' },
  ];

  const dbCustomers: any[] = [];
  for (const c of customerDefs) {
    const existing = await prisma.customer.findFirst({
      where: { phone: c.phone, isDeleted: false },
    });
    if (existing) {
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: { ...c, fleetId },
      });
      dbCustomers.push(updated);
    } else {
      const created = await prisma.customer.create({
        data: {
          ...c,
          fleetId,
          documents: {
            create: [
              {
                docType: 'PASSPORT',
                title: `${c.name} - Pasaport Fotokopisi`,
                fileUrl: '/uploads/sample_passport.jpg',
              },
              {
                docType: 'DRIVING_LICENSE',
                title: `${c.name} - Sürücü Ehliyeti`,
                fileUrl: '/uploads/sample_license.jpg',
              },
            ],
          },
        },
      });
      dbCustomers.push(created);
    }
  }

  console.log(`Verified ${dbCustomers.length} customers.`);

  // 6. Seed 4 Active Rentals (creating upcoming 7-day events!)
  // Rental 1: Passat (BG 1709-OT) rented to Nikola Petrović, ends in 2 days (URGENT ALERT)
  // Rental 2: Peugeot 308 (BG 245-TX) rented to Marko Jovanović, ends in 4 days (ALERT)
  // Rental 3: Megane (BG 819-KV) rented to Aleksandar Đorđević, ends in 6 days (ALERT)
  // Rental 4: Octavia (BG 391-ZR) rented to Stefan Nikolić, ends in 28 days

  const rentalConfigs = [
    {
      plate: 'BG 1709-OT',
      customerIndex: 0, // Nikola Petrović
      startOffsetDays: -28,
      endOffsetDays: 2, // 2 gün sonra iade (ALARM)
      monthlyRate: 450,
      isPaid: true,
    },
    {
      plate: 'BG 245-TX',
      customerIndex: 1, // Marko Jovanović
      startOffsetDays: -26,
      endOffsetDays: 4, // 4 gün sonra iade (ALARM)
      monthlyRate: 400,
      isPaid: true,
    },
    {
      plate: 'BG 819-KV',
      customerIndex: 2, // Aleksandar Đorđević
      startOffsetDays: -24,
      endOffsetDays: 6, // 6 gün sonra iade (ALARM)
      monthlyRate: 380,
      isPaid: true,
    },
    {
      plate: 'BG 391-ZR',
      customerIndex: 3, // Stefan Nikolić
      startOffsetDays: -2,
      endOffsetDays: 28, // 28 gün sonra iade
      monthlyRate: 420,
      isPaid: true,
    },
  ];

  // Close any obsolete open rentals for clean state
  await prisma.rental.updateMany({
    where: {
      status: 'ACTIVE',
      vehicle: { plate: { notIn: ['BG 1709-OT', 'BG 245-TX', 'BG 819-KV', 'BG 391-ZR'] } },
    },
    data: { status: 'RETURNED', returnDate: new Date() },
  });

  const createdRentals: any[] = [];
  for (const rc of rentalConfigs) {
    const v = dbVehicles[rc.plate];
    const c = dbCustomers[rc.customerIndex];
    if (!v || !c) continue;

    // Check if active rental exists
    let rental = await prisma.rental.findFirst({
      where: { vehicleId: v.id, status: 'ACTIVE' },
    });

    const startDate = new Date(Date.now() + rc.startOffsetDays * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + rc.endOffsetDays * 24 * 60 * 60 * 1000);

    if (rental) {
      rental = await prisma.rental.update({
        where: { id: rental.id },
        data: {
          startDate,
          endDate,
          monthlyRate: rc.monthlyRate,
          totalAmount: rc.monthlyRate,
          isPaid: rc.isPaid,
          customerId: c.id,
        },
      });
    } else {
      rental = await prisma.rental.create({
        data: {
          vehicleId: v.id,
          customerId: c.id,
          startDate,
          endDate,
          monthlyRate: rc.monthlyRate,
          totalAmount: rc.monthlyRate,
          isPaid: rc.isPaid,
          status: 'ACTIVE',
          startKm: v.currentKm - 1200,
          photoFront: '/uploads/sample_car_front.svg',
          photoBack: '/uploads/sample_car_back.svg',
          photoRight: '/uploads/sample_car_right.svg',
          photoLeft: '/uploads/sample_car_left.svg',
          deliveryAccessories: '{"Telefon Tutucu":true,"Çakmaklık Şarj Aleti":true,"İlk Yardım Çantası":true,"Reflektör":true,"Paspas Seti":true}',
        },
      });
    }
    createdRentals.push(rental);
  }

  console.log(`Verified ${createdRentals.length} active rentals.`);

  // 7. Seed 2 Realistic Belgrade Parking Tickets (eDPK)
  // Ticket 1: BG 1709-OT (Passat) - Zona 2, Knez Mihailova 14, 1870 RSD (€16)
  const passat = dbVehicles['BG 1709-OT'];
  const passatRental = createdRentals.find((r) => r.vehicleId === passat?.id);
  const peugeot = dbVehicles['BG 245-TX'];
  const peugeotRental = createdRentals.find((r) => r.vehicleId === peugeot?.id);

  if (passat) {
    const existingTicket = await prisma.parkingTicket.findFirst({
      where: { ticketNumber: '9823412', plate: 'BG 1709-OT' },
    });
    if (!existingTicket) {
      await prisma.parkingTicket.create({
        data: {
          ticketNumber: '9823412',
          vehicleId: passat.id,
          plate: 'BG 1709-OT',
          cleanPlate: 'BG1709OT',
          zone: 'Zona 2 (Žuta)',
          street: 'Knez Mihailova 14, Stari Grad',
          violation: 'Isteklo dozvoljeno vreme parkiranja',
          amountRsd: 1870,
          amountEur: 16,
          discountDescription: '20 gün içinde ödenirse %50 indirimli: 935 RSD (~8 €)',
          referenceNumber: '9823412-01',
          status: 'UNPAID',
          issueDate: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 gün önce
          customerId: passatRental?.customerId || null,
          rentalId: passatRental?.id || null,
          fleetId,
        },
      });
      console.log('Created Belgrad parking ticket 9823412 for BG 1709-OT.');
    }
  }

  if (peugeot) {
    const existingTicket2 = await prisma.parkingTicket.findFirst({
      where: { ticketNumber: '9845120', plate: 'BG 245-TX' },
    });
    if (!existingTicket2) {
      await prisma.parkingTicket.create({
        data: {
          ticketNumber: '9845120',
          vehicleId: peugeot.id,
          plate: 'BG 245-TX',
          cleanPlate: 'BG245TX',
          zone: 'Zona 1 (Crvena)',
          street: 'Bulevar Kralja Aleksandra 52, Vračar',
          violation: 'Nije plaćena parking karta',
          amountRsd: 1870,
          amountEur: 16,
          discountDescription: '20 gün içinde ödenirse %50 indirimli: 935 RSD (~8 €)',
          referenceNumber: '9845120-02',
          status: 'UNPAID',
          issueDate: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14 saat önce
          customerId: peugeotRental?.customerId || null,
          rentalId: peugeotRental?.id || null,
          fleetId,
        },
      });
      console.log('Created Belgrad parking ticket 9845120 for BG 245-TX.');
    }
  }

  // 8. Seed 10 Realistic Maintenance & Service Records (5 Paid by Onur, 5 Paid by Atilla)
  const maintRecords = [
    // 5 by Onur (Buy2Cars)
    {
      plate: 'BG 1709-OT',
      paidBy: 'Onur',
      serviceName: 'Bosch Car Service Novi Beograd',
      description: 'Periyodik 160.000 KM bakımı: Motor yağı (Castrol Edge 5W-30), yağ filtresi, hava ve polen filtreleri yenilendi.',
      laborCost: 40,
      partsCost: 110,
      totalCost: 150,
      parts: [
        { partName: 'Castrol Edge 5W-30 (5L)', cost: 55 },
        { partName: 'Mann Yağ Filtresi', cost: 15 },
        { partName: 'Mann Hava & Karbonlu Polen Filtresi', cost: 40 },
      ],
      offsetDays: -45,
    },
    {
      plate: 'BG 245-TX',
      paidBy: 'Onur',
      serviceName: 'Auto Centar Beograd',
      description: 'Ön ve arka fren balataları yenilendi (Brembo). Fren hidrolik sıvısı kontrol edildi.',
      laborCost: 35,
      partsCost: 95,
      totalCost: 130,
      parts: [
        { partName: 'Brembo Ön Balata Takımı', cost: 55 },
        { partName: 'Brembo Arka Balata Takımı', cost: 40 },
      ],
      offsetDays: -30,
    },
    {
      plate: 'BG 102-MM',
      paidBy: 'Onur',
      serviceName: 'Master Servis Zemun',
      description: 'S-Tronic şanzıman yağı ve filtre değişimi yapıldı.',
      laborCost: 60,
      partsCost: 160,
      totalCost: 220,
      parts: [
        { partName: 'Audi OEM Şanzıman Yağı (6L)', cost: 120 },
        { partName: 'Şanzıman Filtresi & Karter Contası', cost: 40 },
      ],
      offsetDays: -20,
    },
    {
      plate: 'BG 734-CD',
      paidBy: 'Onur',
      serviceName: 'Vulkanizer Vuk',
      description: '4 adet sıfır kışlık lastik montajı ve balans ayarı (Continental WinterContact).',
      laborCost: 30,
      partsCost: 280,
      totalCost: 310,
      parts: [
        { partName: 'Continental WinterContact TS870 (4 Adet)', cost: 280 },
      ],
      offsetDays: -15,
    },
    {
      plate: 'BG 415-KL',
      paidBy: 'Onur',
      serviceName: 'Auto Centar Beograd',
      description: 'Klima kompresörü bakımı, klima gazı basımı ve bakteri temizliği.',
      laborCost: 40,
      partsCost: 50,
      totalCost: 90,
      parts: [
        { partName: 'R1234yf Klima Gazı & Kaçak Testi', cost: 50 },
      ],
      offsetDays: -3,
    },

    // 5 by Atilla (Autentra)
    {
      plate: 'BG 819-KV',
      paidBy: 'Atilla',
      serviceName: 'Master Servis Zemun',
      description: 'Ağır bakım: Triger seti ve devirdaim pompası yenilendi. Antifriz tazelendi.',
      laborCost: 80,
      partsCost: 190,
      totalCost: 270,
      parts: [
        { partName: 'Gates Triger Seti & Devirdaim', cost: 150 },
        { partName: 'Organik Kırmızı Antifriz (3L)', cost: 40 },
      ],
      offsetDays: -55,
    },
    {
      plate: 'BG 391-ZR',
      paidBy: 'Atilla',
      serviceName: 'Auto Centar Beograd',
      description: 'Ön fren diskleri ve balataları değiştirildi (Ferodo).',
      laborCost: 40,
      partsCost: 120,
      totalCost: 160,
      parts: [
        { partName: 'Ferodo Hava Soğutmalı Ön Disk Takımı', cost: 75 },
        { partName: 'Ferodo Ön Balata Seti', cost: 45 },
      ],
      offsetDays: -35,
    },
    {
      plate: 'BG 512-AB',
      paidBy: 'Atilla',
      serviceName: 'Bosch Car Service Novi Beograd',
      description: 'Periyodik 100.000 KM bakımı: Motor yağı (Ford Castrol Magnatec 0W-20), filtre seti değişimi.',
      laborCost: 35,
      partsCost: 95,
      totalCost: 130,
      parts: [
        { partName: 'Castrol 0W-20 Magnatec (5L)', cost: 60 },
        { partName: 'Bosch Filtre Kiti (Yağ+Hava+Polen)', cost: 35 },
      ],
      offsetDays: -25,
    },
    {
      plate: 'BG 608-EF',
      paidBy: 'Atilla',
      serviceName: 'Toyota Centar Beograd',
      description: 'Hibrit sistem sağlık testi, inverter soğutma sıvısı değişimi ve 12V akü yenilendi.',
      laborCost: 50,
      partsCost: 130,
      totalCost: 180,
      parts: [
        { partName: 'Varta 12V 45Ah AGM Akü', cost: 95 },
        { partName: 'Toyota Super Long Life Coolant', cost: 35 },
      ],
      offsetDays: -12,
    },
    {
      plate: 'BG 921-GH',
      paidBy: 'Atilla',
      serviceName: 'Master Servis Zemun',
      description: 'Ön süspansiyon rot başları, rot milleri ve z-rotlar yenilendi. Rot ayarı yapıldı.',
      laborCost: 45,
      partsCost: 85,
      totalCost: 130,
      parts: [
        { partName: 'Lemförder Z-Rot Takımı', cost: 35 },
        { partName: 'Lemförder Rot Başı & Mili', cost: 50 },
      ],
      offsetDays: -5,
    },
  ];

  for (const m of maintRecords) {
    const v = dbVehicles[m.plate];
    if (!v) continue;

    const existing = await prisma.maintenanceRecord.findFirst({
      where: { vehicleId: v.id, description: m.description },
    });

    if (!existing) {
      await prisma.maintenanceRecord.create({
        data: {
          vehicleId: v.id,
          maintenanceDate: new Date(Date.now() + m.offsetDays * 24 * 60 * 60 * 1000),
          laborCost: m.laborCost,
          partsCost: m.partsCost,
          totalCost: m.totalCost,
          originalCost: m.totalCost,
          currency: 'EUR',
          description: m.description,
          serviceName: m.serviceName,
          paidBy: m.paidBy,
          parts: {
            create: m.parts.map((p) => ({
              partName: p.partName,
              cost: p.cost,
              originalCost: p.cost,
              currency: 'EUR',
            })),
          },
        },
      });
      console.log(`Created maintenance record for ${m.plate} paid by ${m.paidBy}.`);
    }
  }

  // 9. Seed Clean Natural Audit Logs
  const auditEntries = [
    {
      userName: 'Onur Köse',
      action: 'CREATE_RENTAL',
      target: 'BG 1709-OT',
      description: 'BG 1709-OT aracı Nikola Petrović isimli müşteriye kiralandı (araba verildi).',
    },
    {
      userName: 'Atilla Kılıç',
      action: 'CREATE_RENTAL',
      target: 'BG 819-KV',
      description: 'BG 819-KV aracı Aleksandar Đorđević isimli müşteriye kiralandı (araba verildi).',
    },
    {
      userName: 'Onur Köse',
      action: 'CREATE_MAINTENANCE',
      target: 'BG 1709-OT',
      description: 'BG 1709-OT aracının periyodik bakımı yapıldı (150 € masraf girildi, Ödeyen: Onur).',
    },
    {
      userName: 'Atilla Kılıç',
      action: 'CREATE_MAINTENANCE',
      target: 'BG 819-KV',
      description: 'BG 819-KV aracının triger seti ve devirdaimi yenilendi (270 € masraf girildi, Ödeyen: Atilla).',
    },
    {
      userName: 'Sistem',
      action: 'PARKING_TICKET',
      target: 'BG 1709-OT',
      description: 'BG 1709-OT aracı için Belgrad park cezası (eDPK #9823412) sisteme işlendi.',
    },
    {
      userName: 'System Owner',
      action: 'CREATE_VEHICLE',
      target: 'BG 608-EF',
      description: 'BG 608-EF Toyota Corolla filoya yeni araç olarak eklendi.',
    },
  ];

  for (const a of auditEntries) {
    const existing = await prisma.auditLog.findFirst({
      where: { target: a.target, action: a.action, description: a.description },
    });
    if (!existing) {
      await prisma.auditLog.create({
        data: {
          userName: a.userName,
          action: a.action,
          target: a.target,
          description: a.description,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)),
        },
      });
    }
  }

  console.log('--- Seed & Correlation Fix Successfully Completed! ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
