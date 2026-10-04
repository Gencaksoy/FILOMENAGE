import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function syncLiveNotifications(targetFleetId?: string | null) {
  try {
    const now = new Date();

    // 1. Check all active rentals for overdue or upcoming returns (within 7 days)
    const rentalWhere: any = { status: 'ACTIVE' };
    if (targetFleetId) {
      rentalWhere.vehicle = { fleetId: targetFleetId };
    }

    const activeRentals = await prisma.rental.findMany({
      where: rentalWhere,
      include: { vehicle: true, customer: true },
    });

    for (const rental of activeRentals) {
      const vFleetId = rental.vehicle?.fleetId || targetFleetId || null;
      const endDate = new Date(rental.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        const absDays = Math.abs(diffDays);
        const title = `Araç İadesi Gecikti: ${rental.vehicle.plate}`;
        const message = `${rental.vehicle.plate} plakalı ${rental.vehicle.brand} ${rental.vehicle.model} aracının kiralama süresi ${absDays} gün önce doldu! Müşteri: ${rental.customer.name} (${rental.customer.phone}).`;

        const existing = await prisma.notification.findFirst({
          where: {
            targetPlate: rental.vehicle.plate,
            fleetId: vFleetId,
            type: 'DANGER',
            title: { contains: 'Gecikti' },
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              title,
              message,
              type: 'DANGER',
              targetPlate: rental.vehicle.plate,
              fleetId: vFleetId,
              link: `/vehicles/${rental.vehicleId}`,
            },
          });
        }
      } else if (diffDays <= 7) {
        const title = `Araç İadesi Yaklaşıyor: ${rental.vehicle.plate}`;
        const message = `${rental.vehicle.plate} aracının teslimatına ${diffDays === 0 ? 'BUGÜN' : `${diffDays} gün`} kaldı (${rental.customer.name} - ${rental.customer.phone}).`;

        const existing = await prisma.notification.findFirst({
          where: {
            targetPlate: rental.vehicle.plate,
            fleetId: vFleetId,
            type: 'WARNING',
            title: { contains: 'Araç İadesi' },
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              title,
              message,
              type: 'WARNING',
              targetPlate: rental.vehicle.plate,
              fleetId: vFleetId,
              link: `/vehicles/${rental.vehicleId}`,
            },
          });
        }
      }
    }

    // 2. Check unpaid Belgrade parking tickets (eDPK)
    const ticketWhere: any = { status: 'UNPAID' };
    if (targetFleetId) {
      ticketWhere.OR = [
        { fleetId: targetFleetId },
        { vehicle: { fleetId: targetFleetId } },
      ];
    }

    const unpaidTickets = await prisma.parkingTicket.findMany({
      where: ticketWhere,
      include: { vehicle: true },
      orderBy: { issueDate: 'desc' },
      take: 20,
    });

    for (const ticket of unpaidTickets) {
      const tFleetId = ticket.fleetId || ticket.vehicle?.fleetId || targetFleetId || null;
      const title = `Ödenmemiş Park Cezası: ${ticket.plate}`;
      const existing = await prisma.notification.findFirst({
        where: {
          targetPlate: ticket.plate,
          fleetId: tFleetId,
          title: { contains: 'Park Cezası' },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            title,
            message: `${ticket.plate} plakalı araca ait ${ticket.ticketNumber} no'lu (${ticket.amountRsd} RSD / €${ticket.amountEur}) Belgrad eDPK park cezası ödenmedi! İhlal Yeri: ${ticket.street || 'Belgrad'}.`,
            type: 'DANGER',
            targetPlate: ticket.plate,
            fleetId: tFleetId,
            link: '/parking-tickets',
          },
        });
      }
    }

    // 3. Check Registracija / Registration expiry (within 15 days or overdue)
    const regWhere: any = {
      isDeleted: false,
      registrationExpiry: { not: null },
    };
    if (targetFleetId) {
      regWhere.fleetId = targetFleetId;
    }

    const vehiclesWithRegistration = await prisma.vehicle.findMany({
      where: regWhere,
    });

    for (const v of vehiclesWithRegistration) {
      if (!v.registrationExpiry) continue;
      const vFleetId = v.fleetId || targetFleetId || null;
      const expDate = new Date(v.registrationExpiry);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 15) {
        const isOverdue = diffDays < 0;
        const title = isOverdue
          ? `Registracija (Ruhsat) Süresi Doldu: ${v.plate}`
          : `Registracija Yenileme Yaklaşıyor: ${v.plate}`;
        const message = isOverdue
          ? `${v.plate} plakalı aracın registracija süresi ${Math.abs(diffDays)} gün önce bitti! Trafiğe çıkması yasaktır.`
          : `${v.plate} plakalı aracın registracija süresinin bitmesine ${diffDays === 0 ? 'BUGÜN' : `${diffDays} gün`} kaldı. Yenileme yaptırınız.`;

        const existing = await prisma.notification.findFirst({
          where: {
            targetPlate: v.plate,
            fleetId: vFleetId,
            title: { contains: 'Registracija' },
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              title,
              message,
              type: isOverdue ? 'DANGER' : 'WARNING',
              targetPlate: v.plate,
              fleetId: vFleetId,
              link: `/vehicles/${v.id}`,
            },
          });
        }
      }
    }

    // 4. Check inspections due in <= 30 days
    const inspWhere: any = {};
    if (targetFleetId) {
      inspWhere.vehicle = { fleetId: targetFleetId };
    }

    const inspections = await prisma.inspectionRecord.findMany({
      where: inspWhere,
      include: { vehicle: true },
      orderBy: { nextInspectionDate: 'asc' },
    });

    for (const insp of inspections) {
      const vFleetId = insp.vehicle?.fleetId || targetFleetId || null;
      const nextDate = new Date(insp.nextInspectionDate);
      const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 30 && diffDays >= 0) {
        const title = `Yıllık Muayene Yaklaşıyor: ${insp.vehicle.plate}`;
        const message = `${insp.vehicle.plate} aracının yıllık TÜV muayenesine ${diffDays} gün kaldı (${insp.station}).`;

        const existing = await prisma.notification.findFirst({
          where: {
            targetPlate: insp.vehicle.plate,
            fleetId: vFleetId,
            title: { contains: 'Muayene' },
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              title,
              message,
              type: 'WARNING',
              targetPlate: insp.vehicle.plate,
              fleetId: vFleetId,
              link: `/inspection`,
            },
          });
        }
      }
    }

    // 5. Check open critical faults
    const faultWhere: any = {
      status: { in: ['OPEN', 'IN_PROGRESS'] },
      severity: { in: ['CRITICAL', 'HIGH'] },
    };
    if (targetFleetId) {
      faultWhere.vehicle = { fleetId: targetFleetId };
    }

    const faults = await prisma.vehicleFault.findMany({
      where: faultWhere,
      include: { vehicle: true },
    });

    for (const fault of faults) {
      const vFleetId = fault.vehicle?.fleetId || targetFleetId || null;
      const title = `Acil Araç Arızası: ${fault.vehicle.plate}`;
      const message = `${fault.vehicle.plate} aracında ${fault.severity === 'CRITICAL' ? 'KRİTİK' : 'YÜKSEK'} seviye arıza: ${fault.title}.`;

      const existing = await prisma.notification.findFirst({
        where: {
          targetPlate: fault.vehicle.plate,
          fleetId: vFleetId,
          title: { contains: 'Arızası' },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            title,
            message,
            type: 'DANGER',
            targetPlate: fault.vehicle.plate,
            fleetId: vFleetId,
            link: `/vehicles/${fault.vehicleId}`,
          },
        });
      }
    }
  } catch (err) {
    console.error('Notification auto-sync error:', err);
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'super-admin@company.local' ||
        currentUser.email === 'super-admin@company.local');

    const fleetId = isSuper ? null : currentUser?.fleetId || null;

    await syncLiveNotifications(fleetId);

    const where: any = {};
    if (!isSuper) {
      if (fleetId) {
        where.fleetId = fleetId;
      } else {
        where.fleetId = '__none__';
      }
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    const unreadCount = await prisma.notification.count({ where: { ...where, isRead: false } });
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Bildirimler alınamadı.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'super-admin@company.local' ||
        currentUser.email === 'super-admin@company.local');

    const fleetCondition = !isSuper && currentUser?.fleetId ? { fleetId: currentUser.fleetId } : {};
    const body = await req.json();

    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { isRead: false, ...fleetCondition },
        data: { isRead: true },
      });
    } else if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, ...fleetCondition },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json({ error: 'Güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'super-admin@company.local' ||
        currentUser.email === 'super-admin@company.local');

    const fleetCondition = !isSuper && currentUser?.fleetId ? { fleetId: currentUser.fleetId } : {};
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      await prisma.notification.deleteMany({
        where: fleetCondition,
      });
      return NextResponse.json({ success: true, message: 'Tüm bildirimler temizlendi.' });
    } else if (id) {
      await prisma.notification.deleteMany({
        where: { id, ...fleetCondition },
      });
      return NextResponse.json({ success: true, message: 'Bildirim silindi.' });
    }

    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json({ error: 'Bildirim silinemedi.' }, { status: 500 });
  }
}
