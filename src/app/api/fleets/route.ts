import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'akif@filoyonetim.com' ||
        currentUser.email === 'gencaksoy@outlook.com');
    if (!isSuper) {
      return NextResponse.json({ error: 'Yetkisiz erişim. Bu panel sadece Süper Yöneticiye aittir.' }, { status: 403 });
    }

    const fleets = await prisma.fleet.findMany({
      include: {
        _count: {
          select: {
            vehicles: true,
            customers: true,
            users: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(fleets);
  } catch (error) {
    console.error('Fleets GET error:', error);
    return NextResponse.json({ error: 'Filolar alınamadı.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'akif@filoyonetim.com' ||
        currentUser.email === 'gencaksoy@outlook.com');
    if (!isSuper) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      code,
      ownerName,
      ownerEmail,
      ownerPassword,
      phone,
      city = 'Belgrad',
      maxVehicles = 20,
      expiresMonths = 12,
      notes,
      isPartnership = false,
      partners = [],
      features = {},
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Filo adı zorunludur.' }, { status: 400 });
    }

    // Filo Kodu (Örn: FL-4819)
    let finalCode = (code || '').trim().toUpperCase();
    if (!finalCode) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      finalCode = `FL-${rand}`;
    }

    const existingCode = await prisma.fleet.findUnique({
      where: { code: finalCode },
    });

    if (existingCode) {
      return NextResponse.json({ error: `Bu filo kodu (${finalCode}) zaten kullanımda. Farklı bir kod giriniz.` }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (parseInt(expiresMonths) || 12));

    const finalIsPartnership = Boolean(isPartnership);
    let finalPartners = '[]';
    if (Array.isArray(partners)) {
      finalPartners = JSON.stringify(partners.map((p: any) => String(p).trim()).filter(Boolean));
    } else if (typeof partners === 'string') {
      try {
        const parsed = JSON.parse(partners);
        finalPartners = Array.isArray(parsed) ? JSON.stringify(parsed) : '[]';
      } catch {
        finalPartners = JSON.stringify(partners.split(',').map((p) => p.trim()).filter(Boolean));
      }
    }

    const defaultFeatures = {
      vehicles: true,
      rentals: true,
      customers: true,
      maintenance: true,
      oilChange: true,
      inspection: true,
      parkingTickets: true,
      faults: true,
      finance: true,
      auditLogs: true,
    };
    const finalFeatures = typeof features === 'string'
      ? features
      : JSON.stringify({ ...defaultFeatures, ...features });

    // Filo oluşturuluyor
    const newFleet = await prisma.fleet.create({
      data: {
        name: name.trim(),
        code: finalCode,
        ownerName: ownerName?.trim() || null,
        ownerEmail: ownerEmail?.trim().toLowerCase() || null,
        phone: phone?.trim() || null,
        city: city?.trim() || 'Belgrad',
        maxVehicles: parseInt(maxVehicles) || 20,
        status: 'ACTIVE',
        isPartnership: finalIsPartnership,
        partners: finalPartners,
        features: finalFeatures,
        expiresAt,
        notes: notes?.trim() || null,
      },
    });

    // Eğer filo sahibi e-postası ve şifresi verildiyse o filoya ait ilk yönetici kullanıcısını oluştur
    let initialUser = null;
    if (ownerEmail && ownerPassword) {
      const cleanEmail = ownerEmail.trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      
      if (!existingUser) {
        const passwordHash = await bcrypt.hash(ownerPassword, 10);
        initialUser = await prisma.user.create({
          data: {
            name: ownerName?.trim() || `${name} Yöneticisi`,
            email: cleanEmail,
            passwordHash,
            role: 'ADMIN',
            fleetId: newFleet.id,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userName: currentUser.name,
        userRole: 'SUPER_ADMIN',
        action: 'CREATE_FLEET',
        target: newFleet.name,
        description: `Yeni filo tanımlandı: ${newFleet.name} (Kod: ${newFleet.code}, Araç Kotası: ${newFleet.maxVehicles})`,
      },
    });

    return NextResponse.json({
      fleet: newFleet,
      initialUser,
      message: 'Filo ve yönetici hesabı başarıyla oluşturuldu.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Fleets POST error:', error);
    return NextResponse.json({ error: error.message || 'Filo oluşturulamadı.' }, { status: 500 });
  }
}
