import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
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
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role } = body;

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
    const userRole = role === 'STAFF' ? 'STAFF' : 'ADMIN';

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: userRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
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
