import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function syncLiveNotifications() {
  try {
    const now = new Date();

    // 1. Check all active rentals for overdue or upcoming returns
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
      } else if (diffDays <= 2) {
        const title = `Araç İadesi Yaklaşıyor: ${rental.vehicle.plate}`;
        const message = `${rental.vehicle.plate} aracının teslimatına ${diffDays === 0 ? 'BUGÜN' : `${diffDays} gün`} kaldı (${rental.customer.name} - ${rental.customer.phone}).`;

        const existing = await prisma.notification.findFirst({
          where: {
            targetPlate: rental.vehicle.plate,
            type: 'WARNING',
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

    // 2. Check inspections due in <= 30 days
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
  } catch (err) {
    console.error('Notification auto-sync error:', err);
  }
}

export async function GET() {
  try {
    await syncLiveNotifications();

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
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
