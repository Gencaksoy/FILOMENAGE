import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const currentUser = await getSessionUser();
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'akif@filoyonetim.com' ||
        currentUser.email === 'gencaksoy@outlook.com');

    const where: any = {};
    if (!isSuper && currentUser?.fleetId) {
      where.vehicle = {
        OR: [
          { fleetId: currentUser.fleetId },
          { fleetId: null },
        ],
      };
    }

    const rentals = await prisma.rental.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: true,
        customer: true,
      },
    });

    return NextResponse.json(rentals);
  } catch (error) {
    console.error('Rentals GET error:', error);
    return NextResponse.json({ error: 'Kiralamalar alınamadı.' }, { status: 500 });
  }
}

// POST: Yeni Kiralama Başlat
export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    const body = await req.json();
    const {
      vehicleId,
      customerId,
      startDate,
      endDate,
      dailyRate,
      monthlyRate,
      discountAmount,
      isPaid,
      photoFront,
      photoBack,
      photoRight,
      photoLeft,
      deliveryAccessories,
      notes,
    } = body;

    if (!vehicleId || !customerId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Araç, müşteri, başlangıç ve bitiş tarihleri zorunludur.' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.isDeleted) {
      return NextResponse.json({ error: 'Araç bulunamadı.' }, { status: 404 });
    }

    if (vehicle.status === 'RENTED') {
      return NextResponse.json(
        { error: `${vehicle.plate} plakalı araç zaten kiradadır!` },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.isDeleted) {
      return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Standart veya indirimli aylık kira hesabı
    const baseMonthly = parseFloat(monthlyRate) || vehicle.monthlyPrice || 350;
    const discount = parseFloat(discountAmount) || 0;
    const finalMonthly = Math.max(0, baseMonthly - discount);

    // Günlük veya aylık bazlı tutar hesabı
    let totalAmount = 0;
    if (diffDays >= 28) {
      const months = Math.max(1, Math.round(diffDays / 30));
      totalAmount = months * finalMonthly;
    } else {
      const rate = parseFloat(dailyRate) || vehicle.dailyPrice || (finalMonthly / 30);
      totalAmount = diffDays * rate;
    }

    const [rental] = await prisma.$transaction([
      prisma.rental.create({
        data: {
          vehicleId,
          customerId,
          startDate: start,
          endDate: end,
          startKm: vehicle.currentKm,
          dailyRate: parseFloat(dailyRate) || (finalMonthly / 30),
          monthlyRate: baseMonthly,
          discountAmount: discount,
          totalAmount,
          isPaid: isPaid !== undefined ? Boolean(isPaid) : true,
          status: 'ACTIVE',
          photoFront: photoFront || null,
          photoBack: photoBack || null,
          photoRight: photoRight || null,
          photoLeft: photoLeft || null,
          deliveryAccessories: deliveryAccessories
            ? (typeof deliveryAccessories === 'string' ? deliveryAccessories : JSON.stringify(deliveryAccessories))
            : vehicle.accessories,
          notes: notes?.trim() || null,
        },
        include: {
          vehicle: true,
          customer: true,
        },
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'RENTED' },
      }),
    ]);

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'RENTAL_START',
      target: vehicle.plate,
      description: `${vehicle.plate} aracı ${customer.name} müşterisine ${diffDays} günlüğüne kiralandı (${finalMonthly} €/aylık, İskonto: ${discount} €, Ödeme Teyit: ${rental.isPaid ? 'ÖDENDİ' : 'BEKLİYOR'}).`,
    });

    return NextResponse.json(rental, { status: 201 });
  } catch (error: any) {
    console.error('Rental POST error:', error);
    return NextResponse.json({ error: error.message || 'Kiralama başlatılamadı.' }, { status: 500 });
  }
}

// PUT: Kiralamayı Sonlandır / Aracı Geri Al
export async function PUT(req: Request) {
  try {
    const currentUser = await getSessionUser();
    const body = await req.json();
    const {
      rentalId,
      returnKm,
      notes,
      returnAccessories,
      sentToPostCheck,
      returnInspectionNotes,
    } = body;

    if (!rentalId) {
      return NextResponse.json({ error: 'Kiralama ID zorunludur.' }, { status: 400 });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { vehicle: true, customer: true },
    });

    if (!rental) {
      return NextResponse.json({ error: 'Kiralama kaydı bulunamadı.' }, { status: 404 });
    }

    if (rental.status === 'RETURNED') {
      return NextResponse.json({ error: 'Bu kiralama zaten sonlandırılmış.' }, { status: 400 });
    }

    const now = new Date();
    const finalKm = returnKm ? parseInt(returnKm, 10) : rental.vehicle.currentKm;

    // Yeni araç durumu: Bakım/Temizliğe mi gönderilecek, yoksa doğrudan Boşta mı?
    const nextStatus = sentToPostCheck ? 'POST_RENTAL_CHECK' : 'AVAILABLE';

    const [updatedRental] = await prisma.$transaction([
      prisma.rental.update({
        where: { id: rentalId },
        data: {
          status: 'RETURNED',
          returnDate: now,
          returnKm: finalKm,
          returnAccessories: returnAccessories
            ? (typeof returnAccessories === 'string' ? returnAccessories : JSON.stringify(returnAccessories))
            : null,
          sentToPostCheck: Boolean(sentToPostCheck),
          returnInspectionNotes: returnInspectionNotes || null,
          notes: notes ? (rental.notes ? `${rental.notes} | İade Notu: ${notes}` : notes) : rental.notes,
        },
      }),
      prisma.vehicle.update({
        where: { id: rental.vehicleId },
        data: {
          status: nextStatus,
          currentKm: Math.max(rental.vehicle.currentKm, finalKm),
        },
      }),
    ]);

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'RENTAL_RETURN',
      target: rental.vehicle.plate,
      description: `${rental.vehicle.plate} aracı ${rental.customer.name} müşterisinden teslim alındı (İade KM: ${finalKm}, Sonraki Durum: ${nextStatus === 'POST_RENTAL_CHECK' ? 'Kiradan Sonra Bakım/Temizlik' : 'Boşta/Hazır'}).`,
    });

    return NextResponse.json(updatedRental);
  } catch (error: any) {
    console.error('Rental PUT error:', error);
    return NextResponse.json({ error: error.message || 'Araç iade işlemi başarısız.' }, { status: 500 });
  }
}

// DELETE: Kiralamayı Sil (Yalnızca ADMIN yapabilir)
export async function DELETE(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (currentUser && currentUser.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Çalışanların (STAFF) sistemden kiralama sözleşmesi silme yetkisi yoktur!' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rentalId = searchParams.get('rentalId');
    if (!rentalId) {
      return NextResponse.json({ error: 'Kiralama ID zorunludur.' }, { status: 400 });
    }

    await prisma.rental.delete({ where: { id: rentalId } });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'DELETE_RENTAL',
      description: `Kiralama kaydı silindi (ID: ${rentalId}).`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Rental DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Kiralama silinemedi.' }, { status: 500 });
  }
}
