import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';

    const where: any = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { identityNo: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        rentals: {
          where: { status: 'ACTIVE' },
          include: { vehicle: true },
          take: 1,
        },
      },
    });

    const now = new Date();
    const result = customers.map((c) => {
      const activeRental = c.rentals[0];
      let activeVehicle = null;
      let remainingDays: number | null = null;
      let remainingText = 'Kirada araç yok';

      if (activeRental && activeRental.vehicle) {
        const endDate = new Date(activeRental.endDate);
        const diffTime = endDate.getTime() - now.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (remainingDays < 0) {
          remainingText = `${Math.abs(remainingDays)} gün gecikti`;
        } else if (remainingDays === 0) {
          remainingText = 'Bugün iade';
        } else if (remainingDays === 1) {
          remainingText = 'Yarın iade';
        } else {
          remainingText = `${remainingDays} gün kaldı`;
        }

        activeVehicle = {
          rentalId: activeRental.id,
          vehicleId: activeRental.vehicle.id,
          plate: activeRental.vehicle.plate,
          brand: activeRental.vehicle.brand,
          model: activeRental.vehicle.model,
          owner: activeRental.vehicle.owner,
          startDate: activeRental.startDate,
          endDate: activeRental.endDate,
          remainingDays,
          remainingText,
        };
      }

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        identityNo: c.identityNo,
        email: c.email,
        address: c.address,
        notes: c.notes,
        documents: c.documents,
        createdAt: c.createdAt,
        activeVehicle,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Customers GET error:', error);
    return NextResponse.json({ error: 'Müşteriler alınamadı.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = body.name?.trim();
    const phone = body.phone?.trim();

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Müşteri adı ve telefon numarası zorunludur.' },
        { status: 400 }
      );
    }

    const documentsData: any[] = [];
    if (body.passportPhoto) {
      documentsData.push({
        docType: 'PASSPORT',
        title: `${name} - Pasaport Belgesi`,
        fileUrl: body.passportPhoto,
      });
    }
    if (body.licensePhoto) {
      documentsData.push({
        docType: 'DRIVING_LICENSE',
        title: `${name} - Sürücü Belgesi (Ehliyet)`,
        fileUrl: body.licensePhoto,
      });
    }
    if (body.idPhoto) {
      documentsData.push({
        docType: 'ID_CARD',
        title: `${name} - Kimlik Kartı`,
        fileUrl: body.idPhoto,
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        identityNo: body.identityNo?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        notes: body.notes?.trim() || null,
        documents: documentsData.length > 0 ? { create: documentsData } : undefined,
      },
      include: {
        documents: true,
      },
    });

    await logAudit({
      userName: 'Yönetici',
      action: 'CREATE_CUSTOMER',
      target: customer.name,
      description: `Yeni müşteri kaydedildi: ${customer.name} (${customer.phone}). Belgeler: ${customer.documents.length} adet.`,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('Customer POST error:', error);
    return NextResponse.json({ error: error.message || 'Müşteri eklenemedi.' }, { status: 500 });
  }
}
