import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const isSuper = currentUser.role === 'SUPER_ADMIN' || currentUser.email === 'akif@filoyonetim.com';

    const where: any = {};
    if (!isSuper) {
      // Filo sahipleri ve normal çalışanlar SaaS yöneticisini (Akif Aksoy) ASLA göremez!
      where.role = { not: 'SUPER_ADMIN' };
      where.email = { not: 'akif@filoyonetim.com' };
      where.name = { not: 'Akif Aksoy' };

      // Filo yöneticisi ise sadece kendi filosuna ait personelleri görsün
      if (currentUser.fleetId) {
        where.fleetId = currentUser.fleetId;
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        fleetId: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Kullanıcılar alınamadı.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
    }

    const isSuper =
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.email === 'akif@filoyonetim.com' ||
      currentUser.email === 'gencaksoy@outlook.com';

    const body = await req.json();
    const { name, email, password, role, fleetId } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Ad Soyad, E-posta ve Şifre zorunludur.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten sistemde kayıtlı.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Yalnızca süper admin SUPER_ADMIN rolü verebilir
    let userRole = role === 'STAFF' ? 'STAFF' : 'ADMIN';
    if (role === 'SUPER_ADMIN' && !isSuper) {
      userRole = 'ADMIN';
    }

    const assignedFleetId = isSuper ? (fleetId || currentUser.fleetId || null) : (currentUser.fleetId || null);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: userRole,
        fleetId: assignedFleetId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        fleetId: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'CREATE_USER',
        target: newUser.name,
        description: `Yeni kullanıcı eklendi: ${newUser.name} (${newUser.email}, Rol: ${newUser.role})`,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json({ error: 'Kullanıcı oluşturulamadı.' }, { status: 500 });
  }
}
