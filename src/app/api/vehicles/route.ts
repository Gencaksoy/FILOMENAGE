import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const isSuper =
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.email === 'akif@filoyonetim.com' ||
      currentUser.email === 'gencaksoy@outlook.com';

    if (!isSuper && currentUser.features?.vehicles === false) {
      return NextResponse.json({ error: 'Araç yönetimi özelliği filonuz için devre dışıdır.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || '';
    const owner = searchParams.get('owner') || '';

    const now = new Date();
    const conditions: any[] = [{ isDeleted: false }];

    if (!isSuper) {
      if (!currentUser.fleetId) {
        return NextResponse.json({ error: 'Bağlı bir filo bulunamadı.' }, { status: 403 });
      }
      conditions.push({ fleetId: currentUser.fleetId });
    }

    if (search) {
      conditions.push({
        OR: [
          { plate: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { owner: { contains: search, mode: 'insensitive' } },
          { fuelType: { contains: search, mode: 'insensitive' } },
          { vin: { contains: search, mode: 'insensitive' } },
          { engineNo: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (status && status !== 'ALL') {
      if (status === 'RENTABLE') {
        conditions.push({ status: { in: ['AVAILABLE', 'POST_RENTAL_CHECK'] } });
      } else {
        conditions.push({ status });
      }
    }

    if (owner && owner !== 'ALL') {
      conditions.push({ owner });
    }

    const where = { AND: conditions };

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { plate: 'asc' },
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
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const result = vehicles.map((v) => {
      const activeRental = v.rentals.find((r) => r.status === 'ACTIVE');
      const latestMaint = v.maintenances[0];
      const latestOil = v.oilChanges[0];
      const latestInsp = v.inspections[0];

      let remainingDays: number | null = null;
      let remainingText = 'Boşta';

      if (v.status === 'RENTED' && activeRental) {
        const endDate = new Date(activeRental.endDate);
        const diffTime = endDate.getTime() - now.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDaysText(remainingDays)) {
          remainingText = diffDaysText(remainingDays);
        }
      } else if (v.status === 'MAINTENANCE') {
        remainingText = 'Serviste';
      } else if (v.status === 'POST_RENTAL_CHECK') {
        remainingText = 'Kiradan Sonra Bakım / Temizlik';
      }

      // Registration (Registracija) days left
      let regDaysLeft: number | null = null;
      if (v.registrationExpiry) {
        const regDiff = new Date(v.registrationExpiry).getTime() - now.getTime();
        regDaysLeft = Math.ceil(regDiff / (1000 * 60 * 60 * 24));
      }

      // ROI & Amortization Calculations
      const totalRentalRevenue = v.rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
      const totalMaintCost = v.maintenances.reduce((sum, m) => sum + (m.totalCost || 0), 0);
      const totalOilCost = v.oilChanges.reduce((sum, o) => sum + (o.cost || 0), 0);
      const totalInspCost = v.inspections.reduce((sum, i) => sum + (i.cost || 0), 0);
      const totalExpenses = totalMaintCost + totalOilCost + totalInspCost;
      const netProfit = totalRentalRevenue - totalExpenses;
      const totalInvestment = (v.purchasePrice || 0) + (v.initialExpenses || 0);
      const remainingAmortization = Math.max(0, totalInvestment - netProfit);
      const isAmortized = totalInvestment > 0 && netProfit >= totalInvestment;
      const amortizationPercent = totalInvestment > 0
        ? Math.min(100, Math.round((netProfit / totalInvestment) * 100))
        : 100;

      return {
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        modelYear: v.modelYear,
        color: v.color,
        currentKm: v.currentKm,
        dailyPrice: v.dailyPrice,
        monthlyPrice: v.monthlyPrice,
        status: v.status,
        owner: v.owner || null,
        fuelType: v.fuelType || 'Dizel',
        fuelConsumptionRsd: v.fuelConsumptionRsd || 0,
        registrationExpiry: v.registrationExpiry,
        regDaysLeft,
        purchasePrice: v.purchasePrice || 0,
        initialExpenses: v.initialExpenses || 0,
        accessories: v.accessories,
        vin: v.vin,
        engineNo: v.engineNo,
        chronicIssues: v.chronicIssues,
        notes: v.notes,

        // Financial & Amortization
        financials: {
          totalRentalRevenue,
          totalExpenses,
          netProfit,
          totalInvestment,
          remainingAmortization,
          isAmortized,
          amortizationPercent,
        },

        activeRental: activeRental
          ? {
              id: activeRental.id,
              customerId: activeRental.customerId,
              customerName: activeRental.customer.name,
              customerPhone: activeRental.customer.phone,
              startDate: activeRental.startDate,
              endDate: activeRental.endDate,
              remainingDays,
              remainingText,
              monthlyRate: activeRental.monthlyRate,
              discountAmount: activeRental.discountAmount,
              isPaid: activeRental.isPaid,
              photos: {
                front: activeRental.photoFront,
                back: activeRental.photoBack,
                right: activeRental.photoRight,
                left: activeRental.photoLeft,
              },
              deliveryAccessories: activeRental.deliveryAccessories,
            }
          : null,
        latestMaintenance: latestMaint
          ? {
              maintenanceDate: latestMaint.maintenanceDate,
              nextMaintenanceDate: latestMaint.nextMaintenanceDate,
              laborCost: latestMaint.laborCost,
              partsCost: latestMaint.partsCost,
              totalCost: latestMaint.totalCost,
              description: latestMaint.description,
              partsCount: latestMaint.parts.length,
              createdAt: latestMaint.createdAt,
            }
          : null,
        latestOilChange: latestOil
          ? {
              changeDate: latestOil.changeDate,
              km: latestOil.km,
              oilType: latestOil.oilType,
              filterChanged: latestOil.filterChanged,
              cost: latestOil.cost,
              createdAt: latestOil.createdAt,
            }
          : null,
        latestInspection: latestInsp
          ? {
              inspectionDate: latestInsp.inspectionDate,
              nextInspectionDate: latestInsp.nextInspectionDate,
              cost: latestInsp.cost,
            }
          : null,
        activeFaultsCount: v.faults?.length || 0,
        hasActiveFault: (v.faults?.length || 0) > 0,
        latestFault: v.faults?.[0]?.title || null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Vehicles GET error:', error);
    return NextResponse.json({ error: 'Araçlar alınamadı.' }, { status: 500 });
  }
}

function diffDaysText(diffDays: number): string {
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} gün gecikti`;
  } else if (diffDays === 0) {
    return 'Bugün bitiyor';
  } else if (diffDays === 1) {
    return 'Yarın bitiyor';
  } else {
    return `${diffDays} gün kaldı`;
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const isSuper =
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.email === 'akif@filoyonetim.com' ||
      currentUser.email === 'gencaksoy@outlook.com';

    if (!isSuper && currentUser.features?.vehicles === false) {
      return NextResponse.json({ error: 'Araç ekleme özelliği filonuz için devre dışıdır.' }, { status: 403 });
    }

    if (currentUser.fleetStatus && currentUser.fleetStatus !== 'ACTIVE' && !isSuper) {
      return NextResponse.json(
        { error: 'Filonuz askıya alınmıştır. Yeni araç eklemek için lütfen lisans / abonelik ödemenizi yenileyiniz.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const plate = body.plate?.trim().toUpperCase();

    if (!plate || !body.brand || !body.model) {
      return NextResponse.json(
        { error: 'Plaka, marka ve model zorunludur.' },
        { status: 400 }
      );
    }

    const existing = await prisma.vehicle.findFirst({
      where: { plate, isDeleted: false },
    });
    if (existing) {
      return NextResponse.json(
        { error: `"${plate}" plakalı araç zaten kayıtlı!` },
        { status: 400 }
      );
    }

    let assignedFleetId = currentUser?.fleetId || body.fleetId || null;
    if (!assignedFleetId) {
      const primaryFleet = await prisma.fleet.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
      });
      assignedFleetId = primaryFleet?.id || null;
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plate,
        brand: body.brand.trim(),
        model: body.model.trim(),
        modelYear: parseInt(body.modelYear, 10) || new Date().getFullYear(),
        color: body.color?.trim() || null,
        currentKm: parseInt(body.currentKm, 10) || 0,
        dailyPrice: parseFloat(body.dailyPrice) || 0,
        monthlyPrice: parseFloat(body.monthlyPrice) || 350,
        status: body.status || 'AVAILABLE',
        owner: body.owner?.trim() || null,
        fuelType: body.fuelType || 'Dizel',
        fuelConsumptionRsd: parseFloat(body.fuelConsumptionRsd) || 0,
        registrationExpiry: body.registrationExpiry ? new Date(body.registrationExpiry) : null,
        purchasePrice: parseFloat(body.purchasePrice) || 0,
        initialExpenses: parseFloat(body.initialExpenses) || 0,
        accessories: body.accessories
          ? (typeof body.accessories === 'string' ? body.accessories.trim() : JSON.stringify(body.accessories))
          : '["Telefon Tutucu", "Çakmaklık Şarj Aleti", "İlk Yardım Çantası", "Reflektör & Yangın Tüpü", "Paspas Seti"]',
        vin: body.vin?.trim() || null,
        engineNo: body.engineNo?.trim() || null,
        chronicIssues: body.chronicIssues?.trim() || null,
        notes: body.notes?.trim() || null,
        fleetId: assignedFleetId,
      },
    });

    await logAudit({
      userName: body.userName || 'Yönetici',
      userRole: body.userRole || 'ADMIN',
      action: 'CREATE_VEHICLE',
      target: plate,
      fleetId: assignedFleetId,
      description: `${plate} plakalı ${vehicle.brand} ${vehicle.model} sisteme eklendi (Sahibi: ${vehicle.owner}, Satın Alma: ${vehicle.purchasePrice} €, İlk Masraf: ${vehicle.initialExpenses} €).`,
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    console.error('Vehicle POST error:', error);
    return NextResponse.json({ error: error.message || 'Araç eklenemedi.' }, { status: 500 });
  }
}
