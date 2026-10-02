import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { generateWhatsAppReminderUrl } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const currentUser = await getSessionUser();
    const isStaff = currentUser?.role === 'STAFF';

    const { searchParams } = new URL(req.url);
    const ownerFilter = searchParams.get('owner') || 'ALL';

    const now = new Date();
    const where: any = { isDeleted: false };
    if (ownerFilter !== 'ALL') {
      where.owner = ownerFilter;
    }

    const [vehicles, allOwners] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          rentals: {
            include: { customer: true },
            orderBy: { startDate: 'desc' },
          },
          maintenances: {
            orderBy: { maintenanceDate: 'desc' },
            include: { parts: true },
          },
          oilChanges: {
            orderBy: { changeDate: 'desc' },
            take: 1,
          },
          inspections: {
            orderBy: { inspectionDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { plate: 'asc' },
      }),
      prisma.vehicle.findMany({
        where: { isDeleted: false },
        select: { owner: true },
        distinct: ['owner'],
      }),
    ]);

    const ownersList = Array.from(new Set(allOwners.map((o) => o.owner))).filter(Boolean);

    const totalVehicles = vehicles.length;
    const rentedVehicles = vehicles.filter((v) => v.status === 'RENTED').length;
    const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE').length;
    const maintenanceVehicles = vehicles.filter((v) => v.status === 'MAINTENANCE').length;
    const postRentalCheckVehicles = vehicles.filter((v) => v.status === 'POST_RENTAL_CHECK').length;

    // 1. Yaklaşan Araç Geri Alımları & Forecast Zaman Dağılımı (1 hafta sonra elime geçecek araba sayısı vb.)
    let returnsOverdueCount = 0;
    let returnsTodayCount = 0;
    let returnsNext3DaysCount = 0;
    let returnsNext7DaysCount = 0; // 1 hafta içinde boşa çıkacak
    let returnsNext14DaysCount = 0;
    let returnsLaterCount = 0;

    const upcomingReturns: any[] = [];
    vehicles.forEach((v) => {
      const activeRental = v.rentals.find((r) => r.status === 'ACTIVE');
      if (activeRental && v.status === 'RENTED') {
        const endDate = new Date(activeRental.endDate);
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let statusText = '';
        let badgeType: 'DANGER' | 'WARNING' | 'OK' = 'OK';

        if (diffDays < 0) {
          returnsOverdueCount++;
          statusText = `${Math.abs(diffDays)} gün gecikti (Süresi doldu!)`;
          badgeType = 'DANGER';
        } else if (diffDays === 0) {
          returnsTodayCount++;
          statusText = 'BUGÜN teslim alınacak';
          badgeType = 'WARNING';
        } else if (diffDays <= 3) {
          returnsNext3DaysCount++;
          if (diffDays <= 7) returnsNext7DaysCount++;
          statusText = `${diffDays} gün kaldı`;
          badgeType = 'WARNING';
        } else if (diffDays <= 7) {
          returnsNext7DaysCount++;
          statusText = `${diffDays} gün kaldı (Bu Hafta)`;
          badgeType = 'OK';
        } else if (diffDays <= 14) {
          returnsNext14DaysCount++;
          statusText = `${diffDays} gün kaldı (Gelecek Hafta)`;
          badgeType = 'OK';
        } else {
          returnsLaterCount++;
          statusText = `${diffDays} gün kaldı`;
          badgeType = 'OK';
        }

        const whatsAppUrl = generateWhatsAppReminderUrl(
          activeRental.customer.phone,
          activeRental.customer.name,
          v.plate,
          activeRental.startDate,
          activeRental.endDate,
          diffDays
        );

        upcomingReturns.push({
          rentalId: activeRental.id,
          vehicleId: v.id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          owner: v.owner,
          customerName: activeRental.customer.name,
          customerPhone: activeRental.customer.phone,
          startDate: activeRental.startDate,
          endDate: activeRental.endDate,
          dailyRate: activeRental.dailyRate,
          monthlyRate: activeRental.monthlyRate,
          totalAmount: isStaff ? null : activeRental.totalAmount, // Çalışandan gizle
          isPaid: activeRental.isPaid,
          photos: {
            front: activeRental.photoFront,
            back: activeRental.photoBack,
            right: activeRental.photoRight,
            left: activeRental.photoLeft,
          },
          deliveryAccessories: activeRental.deliveryAccessories,
          diffDays,
          statusText,
          badgeType,
          whatsAppUrl,
        });
      }
    });

    upcomingReturns.sort((a, b) => a.diffDays - b.diffDays);

    // 2. Zorunlu Registracija (Register / Tescil) Uyarıları
    const registrationAlerts: any[] = [];
    vehicles.forEach((v) => {
      if (v.registrationExpiry) {
        const regDiff = new Date(v.registrationExpiry).getTime() - now.getTime();
        const diffDays = Math.ceil(regDiff / (1000 * 60 * 60 * 24));
        if (diffDays <= 45) {
          registrationAlerts.push({
            vehicleId: v.id,
            plate: v.plate,
            brand: v.brand,
            model: v.model,
            owner: v.owner,
            registrationExpiry: v.registrationExpiry,
            diffDays,
            isExpired: diffDays < 0,
            isUrgent: diffDays <= 7,
          });
        }
      }
    });
    registrationAlerts.sort((a, b) => a.diffDays - b.diffDays);

    // 3. Ortak Bazlı İstatistikler & Finansal Amortisman (STAFF için finansallar gizlenir)
    let totalFleetInvestment = 0;
    let totalFleetRevenue = 0;
    let totalFleetExpenses = 0;

    const partnerStats: Record<string, any> = {};
    ownersList.forEach((partner) => {
      const partnerVehicles = vehicles.filter((v) => v.owner === partner);
      const pTotal = partnerVehicles.length;
      const pRented = partnerVehicles.filter((v) => v.status === 'RENTED').length;
      const pAvailable = partnerVehicles.filter((v) => v.status === 'AVAILABLE').length;
      const pPostCheck = partnerVehicles.filter((v) => v.status === 'POST_RENTAL_CHECK').length;

      let pInvestment = 0;
      let pRevenue = 0;
      let pExpense = 0;

      partnerVehicles.forEach((v) => {
        pInvestment += (v.purchasePrice || 0) + (v.initialExpenses || 0);
        pRevenue += v.rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        const maintCost = v.maintenances.reduce((acc, m) => acc + (m.totalCost || 0), 0);
        const oilCost = v.oilChanges.reduce((acc, o) => acc + (o.cost || 0), 0);
        const inspCost = v.inspections.reduce((acc, i) => acc + (i.cost || 0), 0);
        pExpense += maintCost + oilCost + inspCost;
      });

      totalFleetInvestment += pInvestment;
      totalFleetRevenue += pRevenue;
      totalFleetExpenses += pExpense;

      const pNetProfit = pRevenue - pExpense;
      const pRemainingAmortization = Math.max(0, pInvestment - pNetProfit);
      const pAmortizationPercent = pInvestment > 0
        ? Math.min(100, Math.round((pNetProfit / pInvestment) * 100))
        : 100;

      partnerStats[partner] = {
        owner: partner,
        totalVehicles: pTotal,
        rentedVehicles: pRented,
        availableVehicles: pAvailable,
        postRentalCheckVehicles: pPostCheck,
        // Staff ise finansal verileri gizle:
        totalInvestment: isStaff ? null : pInvestment,
        totalRevenue: isStaff ? null : pRevenue,
        totalExpenses: isStaff ? null : pExpense,
        netProfit: isStaff ? null : pNetProfit,
        remainingAmortization: isStaff ? null : pRemainingAmortization,
        amortizationPercent: isStaff ? null : pAmortizationPercent,
      };
    });

    const fleetNetProfit = totalFleetRevenue - totalFleetExpenses;
    const fleetRemainingAmortization = Math.max(0, totalFleetInvestment - fleetNetProfit);
    const fleetAmortizationPercent = totalFleetInvestment > 0
      ? Math.min(100, Math.round((fleetNetProfit / totalFleetInvestment) * 100))
      : 0;

    // 4. Yıllık Muayene Hatırlatmaları (1 yıl periyot)
    const upcomingInspections: any[] = [];
    vehicles.forEach((v) => {
      const lastInsp = v.inspections[0];
      if (lastInsp) {
        const nextDate = new Date(lastInsp.nextInspectionDate);
        const diffTime = nextDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        upcomingInspections.push({
          vehicleId: v.id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          owner: v.owner,
          station: lastInsp.station,
          nextInspectionDate: lastInsp.nextInspectionDate,
          diffDays,
          isDueSoon: diffDays <= 30,
        });
      }
    });

    upcomingInspections.sort((a, b) => a.diffDays - b.diffDays);

    // 5. Aktif Araç Arızaları (Açık ve Tamirde olanlar)
    const activeFaultsWhere: any = { status: { in: ['OPEN', 'IN_PROGRESS'] } };
    if (ownerFilter !== 'ALL') {
      activeFaultsWhere.vehicle = { owner: ownerFilter };
    }

    const activeFaults = await prisma.vehicleFault.findMany({
      where: activeFaultsWhere,
      include: {
        vehicle: {
          select: { id: true, plate: true, brand: true, model: true, owner: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      isStaff,
      kpi: {
        totalVehicles,
        rentedVehicles,
        availableVehicles,
        maintenanceVehicles,
        postRentalCheckVehicles,
        activeFaultsVehicles: activeFaults.length,
      },
      forecast: {
        returnsOverdueCount,
        returnsTodayCount,
        returnsNext3DaysCount,
        returnsNext7DaysCount, // 1 hafta içinde boşa çıkacak araba sayısı
        returnsNext14DaysCount,
        returnsLaterCount,
      },
      // Amortisman & Finansal (Sadece ADMIN görür)
      fleetFinancials: isStaff ? null : {
        totalFleetInvestment,
        totalFleetRevenue,
        totalFleetExpenses,
        fleetNetProfit,
        fleetRemainingAmortization,
        fleetAmortizationPercent,
      },
      ownersList,
      partnerStats,
      upcomingReturns,
      registrationAlerts,
      upcomingInspections: upcomingInspections.slice(0, 6),
      activeFaults,
      activeFaultsCount: activeFaults.length,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Dashboard verileri alınamadı.' }, { status: 500 });
  }
}
