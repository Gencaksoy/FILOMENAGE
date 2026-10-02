import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSessionCookie } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre zorunludur.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { fleet: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Geçersiz e-posta veya şifre ya da hesap pasif.' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Geçersiz e-posta veya şifre.' },
        { status: 401 }
      );
    }

    const isSuper =
      user.role === 'SUPER_ADMIN' ||
      user.email === 'akif@filoyonetim.com' ||
      user.email === 'gencaksoy@outlook.com';

    // Filosu silinmiş veya askıya alınmış kullanıcıların girişini kesin olarak engelle:
    if (!isSuper) {
      if (!user.fleetId || !user.fleet) {
        return NextResponse.json(
          { error: 'Bağlı olduğunuz filo bulunamadı veya sistemden silinmiş. Lütfen SaaS yöneticisi ile iletişime geçiniz.' },
          { status: 403 }
        );
      }
      if (user.fleet.status !== 'ACTIVE') {
        const statusMsg = user.fleet.status === 'SUSPENDED' ? 'askıya alınmış' : 'lisans süresi dolmuş';
        return NextResponse.json(
          { error: `Bağlı olduğunuz filonun erişimi ${statusMsg}.` },
          { status: 403 }
        );
      }
    }

    const effectiveRole = isSuper ? 'SUPER_ADMIN' : user.role;

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: effectiveRole,
      avatar: user.avatar,
      fleetId: user.fleetId,
      fleetName: user.fleet?.name || null,
      fleetCode: user.fleet?.code || null,
    };

    const cookieValue = createSessionCookie(authUser);

    cookies().set('filo_auth_session', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      description: `${user.name} (${user.email}, ${effectiveRole}) sisteme başarıyla giriş yaptı.`,
    });

    const redirectTo = isSuper ? '/super-admin' : '/';
    return NextResponse.json({ success: true, user: authUser, redirectTo });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Giriş sırasında hata oluştu.' }, { status: 500 });
  }
}
