import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function syncLiveNotifications() {
  try {
    const now = new Date();

    // 1. Check all active rentals for overdue or upcoming returns (within 7 days)
    const activeRentals = await prisma.rental.findMany({
      where: { status: 'ACTIVE' },
      include: { vehicle: true, customer: true },
    });

    for (const rental of activeRentals) {
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
            type: 'DANGER',
            title: { contains: 'Gecikti' },
            isRead: false,
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              title,
              message,
              type: 'DANGER',
              targetPlate: rental.vehicle.plate,
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
            type: 'WARNING',
            title: { contains: 'Araç İadesi' },
            isRead: false,
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              title,
              message,
              type: 'WARNING',
              targetPlate: rental.vehicle.plate,
              link: `/vehicles/${rental.vehicleId}`,
            },
          });
        }
      }
    }

    // 2. Check unpaid Belgrade parking tickets (eDPK)
    const unpaidTickets = await prisma.parkingTicket.findMany({
      where: { status: 'UNPAID' },
      include: { vehicle: true },
      orderBy: { issueDate: 'desc' },
      take: 20,
    });

    for (const ticket of unpaidTickets) {
      const title = `Ödenmemiş Park Cezası: ${ticket.plate}`;
      const existing = await prisma.notification.findFirst({
        where: {
          targetPlate: ticket.plate,
          title: { contains: 'Park Cezası' },
          isRead: false,
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            title,
            message: `${ticket.plate} plakalı araca ait ${ticket.ticketNumber} no'lu (${ticket.amountRsd} RSD / €${ticket.amountEur}) Belgrad eDPK park cezası ödenmedi! İhlal Yeri: ${ticket.street || 'Belgrad'}.`,
            type: 'DANGER',
            targetPlate: ticket.plate,
            link: '/parking-tickets',
          },
        });
      }
    }

    // 3. Check Registracija / Registration expiry (within 15 days or overdue)
    const vehiclesWithRegistration = await prisma.vehicle.findMany({
      where: {
        isDeleted: false,
        registrationExpiry: { not: null },
      },
    });

    for (const v of vehiclesWithRegistration) {
      if (!v.registrationExpiry) continue;
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
            title: { contains: 'Registracija' },
            isRead: false,
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              title,
              message,
              type: isOverdue ? 'DANGER' : 'WARNING',
              targetPlate: v.plate,
              link: `/vehicles/${v.id}`,
            },
          });
        }
      }
    }

    // 4. Check inspections due in <= 30 days
    const inspections = await prisma.inspectionRecord.findMany({
      include: { vehicle: true },
      orderBy: { nextInspectionDate: 'asc' },
    });

    for (const insp of inspections) {
      const nextDate = new Date(insp.nextInspectionDate);
      const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 30 && diffDays >= 0) {
        const title = `Yıllık Muayene Yaklaşıyor: ${insp.vehicle.plate}`;
        const message = `${insp.vehicle.plate} aracının yıllık TÜV muayenesine ${diffDays} gün kaldı (${insp.station}).`;

        const existing = await prisma.notification.findFirst({
          where: {
            targetPlate: insp.vehicle.plate,
            title: { contains: 'Muayene' },
            isRead: false,
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              title,
              message,
              type: 'WARNING',
              targetPlate: insp.vehicle.plate,
              link: `/inspection`,
            },
          });
        }
      }
    }

    // 5. Check open critical faults
    const faults = await prisma.vehicleFault.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        severity: { in: ['CRITICAL', 'HIGH'] },
      },
      include: { vehicle: true },
    });

    for (const fault of faults) {
      const title = `Acil Araç Arızası: ${fault.vehicle.plate}`;
      const message = `${fault.vehicle.plate} aracında ${fault.severity === 'CRITICAL' ? 'KRİTİK' : 'YÜKSEK'} seviye arıza: ${fault.title}.`;

      const existing = await prisma.notification.findFirst({
        where: {
          targetPlate: fault.vehicle.plate,
          title: { contains: 'Arızası' },
          isRead: false,
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            title,
            message,
            type: 'DANGER',
            targetPlate: fault.vehicle.plate,
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
    await syncLiveNotifications();

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    const unreadCount = await prisma.notification.count({ where: { isRead: false } });
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Bildirimler alınamadı.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    } else if (body.id) {
      await prisma.notification.update({
        where: { id: body.id },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json({ error: 'Güncellenemedi.' }, { status: 500 });
  }
}
