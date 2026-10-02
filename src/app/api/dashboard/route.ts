import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { generateWhatsAppReminderUrl } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const currentUser = await getSessionUser();
    const isStaff = currentUser?.role === 'STAFF';
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'akif@filoyonetim.com' ||
        currentUser.email === 'gencaksoy@outlook.com');

    const { searchParams } = new URL(req.url);
    const ownerFilter = searchParams.get('owner') || 'ALL';

    const now = new Date();
    const where: any = { isDeleted: false };

    // Filo İzolasyonu (Multi-tenancy):
    if (!isSuper && currentUser?.fleetId) {
      where.fleetId = currentUser.fleetId;
    }

    if (ownerFilter !== 'ALL') {
      where.owner = ownerFilter;
    }

    const ownersWhere: any = { isDeleted: false };
    if (!isSuper && currentUser?.fleetId) {
      ownersWhere.fleetId = currentUser.fleetId;
    }

    const [vehicles, allOwners, companySetting] = await Promise.all([
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
          },
          inspections: {
            orderBy: { inspectionDate: 'desc' },
          },
          faults: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { plate: 'asc' },
      }),
      prisma.vehicle.findMany({
        where: ownersWhere,
        select: { owner: true },
        distinct: ['owner'],
      }),
      prisma.systemSetting.findUnique({
        where: { key: 'company_name' },
      }),
    ]);

    const companyName = companySetting?.value || 'Filo & Rent a Car';
    const ownersList = Array.from(new Set(allOwners.map((o) => o.owner))).filter(Boolean);

    const totalVehicles = vehicles.length;
    const rentedVehicles = vehicles.filter((v) => v.status === 'RENTED').length;
    const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE').length;
    const maintenanceVehicles = vehicles.filter((v) => v.status === 'MAINTENANCE').length;
    const postRentalCheckVehicles = vehicles.filter((v) => v.status === 'POST_RENTAL_CHECK').length;
    const occupancyRate = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

    // 1. Yaklaşan Araç Geri Alımları & Forecast Zaman Dağılımı
    let returnsOverdueCount = 0;
    let returnsTodayCount = 0;
    let returnsNext3DaysCount = 0;
    let returnsNext7DaysCount = 0;
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
          diffDays,
          companyName
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
          totalAmount: isStaff ? null : activeRental.totalAmount,
          isPaid: activeRental.isPaid,
          photos: {
            front: activeRental.photoFront,
            back: activeRental.photoBack,
            right: activeRental.photoRight,
            left: activeRental.photoLeft,
          },
          deliveryAccessories: activeRental.deliveryAccessories,
          extensionCount: activeRental.extensionCount || 0,
          diffDays,
          statusText,
          badgeType,
          whatsAppUrl,
        });
      }
    });

    upcomingReturns.sort((a, b) => a.diffDays - b.diffDays);

    // 2. Zorunlu Registracija Uyarıları
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

    // 3. Ortak Bazlı İstatistikler & Finansal Amortisman & Araç Başı Analizler
    let totalFleetInvestment = 0;
    let totalFleetRevenue = 0;
    let totalFleetMaintCost = 0;
    let totalFleetOilCost = 0;
    let totalFleetInspCost = 0;

    const partnerStats: Record<string, any> = {};
    const vehicleAnalyticsList: any[] = [];

    vehicles.forEach((v) => {
      const vInvestment = (v.purchasePrice || 0) + (v.initialExpenses || 0);
      const vRevenue = v.rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
      const vMaintCost = v.maintenances.reduce((acc, m) => acc + (m.totalCost || 0), 0);
      const vOilCost = v.oilChanges.reduce((acc, o) => acc + (o.cost || 0), 0);
      const vInspCost = v.inspections.reduce((acc, i) => acc + (i.cost || 0), 0);
      const vTotalExpense = vMaintCost + vOilCost + vInspCost;
      const vNetProfit = vRevenue - vTotalExpense;
      const vExpenseRatio = vRevenue > 0 ? Math.round((vTotalExpense / vRevenue) * 100) : (vTotalExpense > 0 ? 100 : 0);
      const vFaultCount = v.faults?.length || 0;
      const vActiveFaultCount = v.faults?.filter((f) => f.status === 'OPEN' || f.status === 'IN_PROGRESS').length || 0;
      const vServiceCount = v.maintenances.length + v.oilChanges.length + v.inspections.length;
      const hasChronic = Boolean(v.chronicIssues && v.chronicIssues.trim().length > 0);

      totalFleetInvestment += vInvestment;
      totalFleetRevenue += vRevenue;
      totalFleetMaintCost += vMaintCost;
      totalFleetOilCost += vOilCost;
      totalFleetInspCost += vInspCost;

      vehicleAnalyticsList.push({
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        modelYear: v.modelYear,
        owner: v.owner || 'Atilla',
        status: v.status,
        investment: isStaff ? null : vInvestment,
        revenue: isStaff ? null : vRevenue,
        maintCost: isStaff ? null : vMaintCost,
        oilCost: isStaff ? null : vOilCost,
        inspCost: isStaff ? null : vInspCost,
        totalExpense: isStaff ? null : vTotalExpense,
        netProfit: isStaff ? null : vNetProfit,
        expenseRatio: isStaff ? null : vExpenseRatio,
        serviceCount: vServiceCount,
        maintCount: v.maintenances.length,
        oilCount: v.oilChanges.length,
        inspCount: v.inspections.length,
        faultCount: vFaultCount,
        activeFaultCount: vActiveFaultCount,
        hasChronic,
        chronicIssues: v.chronicIssues || null,
        latestFault: v.faults?.[0]?.title || null,
      });
    });

    const totalFleetExpenses = totalFleetMaintCost + totalFleetOilCost + totalFleetInspCost;
    const fleetNetProfit = totalFleetRevenue - totalFleetExpenses;
    const fleetRemainingAmortization = Math.max(0, totalFleetInvestment - fleetNetProfit);
    const fleetAmortizationPercent = totalFleetInvestment > 0
      ? Math.min(100, Math.round((fleetNetProfit / totalFleetInvestment) * 100))
      : 0;

    const avgExpensePerVehicle = totalVehicles > 0 ? Math.round(totalFleetExpenses / totalVehicles) : 0;
    const avgRevenuePerVehicle = totalVehicles > 0 ? Math.round(totalFleetRevenue / totalVehicles) : 0;

    // Ortak bazlı gruplama
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
        totalInvestment: isStaff ? null : pInvestment,
        totalRevenue: isStaff ? null : pRevenue,
        totalExpenses: isStaff ? null : pExpense,
        netProfit: isStaff ? null : pNetProfit,
        remainingAmortization: isStaff ? null : pRemainingAmortization,
        amortizationPercent: isStaff ? null : pAmortizationPercent,
      };
    });

    // 4. En Çok Masraf Çıkaran Araçlar (Top Expense Vehicles)
    const topExpenseVehicles = [...vehicleAnalyticsList]
      .filter((v) => !isStaff && v.totalExpense > 0)
      .sort((a, b) => (b.totalExpense || 0) - (a.totalExpense || 0))
      .slice(0, 5);

    // 5. En Çok Arıza Yapan / Kronik Sorunlu Araçlar (Top Defect / Fault Vehicles)
    const topFaultVehicles = [...vehicleAnalyticsList]
      .filter((v) => v.faultCount > 0 || v.hasChronic || v.serviceCount > 0)
      .sort((a, b) => {
        const scoreB = (b.activeFaultCount * 3) + (b.faultCount * 2) + (b.hasChronic ? 5 : 0) + (b.serviceCount * 0.5);
        const scoreA = (a.activeFaultCount * 3) + (a.faultCount * 2) + (a.hasChronic ? 5 : 0) + (a.serviceCount * 0.5);
        return scoreB - scoreA;
      })
      .slice(0, 5);

    // 6. Yıllık Muayene Hatırlatmaları
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

    // 7. Aktif Araç Arızaları
    const activeFaultsWhere: any = { status: { in: ['OPEN', 'IN_PROGRESS'] } };
    if (!isSuper && currentUser?.fleetId) {
      activeFaultsWhere.vehicle = { fleetId: currentUser.fleetId };
    }
    if (ownerFilter !== 'ALL') {
      activeFaultsWhere.vehicle = { ...activeFaultsWhere.vehicle, owner: ownerFilter };
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

    // Park Cezaları (eDPK)
    const parkingWhere: any = { status: 'UNPAID' };
    if (!isSuper && currentUser?.fleetId) {
      parkingWhere.vehicle = { fleetId: currentUser.fleetId };
    }
    if (ownerFilter !== 'ALL') {
      parkingWhere.vehicle = { ...parkingWhere.vehicle, owner: ownerFilter };
    }

    const [unpaidTickets, unpaidParkingAgg] = await Promise.all([
      prisma.parkingTicket.findMany({
        where: parkingWhere,
        include: {
          vehicle: { select: { id: true, plate: true, brand: true, model: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { issueDate: 'desc' },
        take: 5,
      }),
      prisma.parkingTicket.aggregate({
        where: parkingWhere,
        _sum: { amountRsd: true, amountEur: true },
        _count: { id: true },
      }),
    ]);

    const parkingStats = {
      unpaidCount: unpaidParkingAgg._count.id || 0,
      unpaidAmountRsd: unpaidParkingAgg._sum.amountRsd || 0,
      unpaidAmountEur: unpaidParkingAgg._sum.amountEur || 0,
      recentUnpaid: unpaidTickets,
    };

    return NextResponse.json({
      isStaff,
      parkingStats,
      kpi: {
        totalVehicles,
        rentedVehicles,
        availableVehicles,
        maintenanceVehicles,
        postRentalCheckVehicles,
        occupancyRate,
        activeFaultsVehicles: activeFaults.length,
      },
      forecast: {
        returnsOverdueCount,
        returnsTodayCount,
        returnsNext3DaysCount,
        returnsNext7DaysCount,
        returnsNext14DaysCount,
        returnsLaterCount,
      },
      fleetFinancials: isStaff ? null : {
        totalFleetInvestment,
        totalFleetRevenue,
        totalFleetExpenses,
        fleetNetProfit,
        fleetRemainingAmortization,
        fleetAmortizationPercent,
        avgExpensePerVehicle,
        avgRevenuePerVehicle,
        occupancyRate,
        breakdown: {
          maintenance: totalFleetMaintCost,
          oil: totalFleetOilCost,
          inspection: totalFleetInspCost,
        },
      },
      topExpenseVehicles,
      topFaultVehicles,
      vehicleAnalytics: vehicleAnalyticsList,
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
