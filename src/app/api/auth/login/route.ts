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

    // Filosu silinmiş kullanıcıların girişini engelle (Askıya alınmış filolar giriş yapabilir ve uyarı ekranı görür)
    if (!isSuper) {
      if (!user.fleetId || !user.fleet) {
        return NextResponse.json(
          { error: 'Bağlı olduğunuz filo bulunamadı veya sistemden silinmiş. Lütfen SaaS yöneticisi ile iletişime geçiniz.' },
          { status: 403 }
        );
      }
    }

    const effectiveRole = isSuper ? 'SUPER_ADMIN' : user.role;

    let parsedPartners: string[] = [];
    if (user.fleet?.partners) {
      try {
        parsedPartners = JSON.parse(user.fleet.partners);
      } catch {
        parsedPartners = [];
      }
    }

    let parsedFeatures: Record<string, boolean> = {
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
    if (user.fleet?.features) {
      try {
        parsedFeatures = { ...parsedFeatures, ...JSON.parse(user.fleet.features) };
      } catch {}
    }

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: effectiveRole,
      avatar: user.avatar,
      fleetId: user.fleetId,
      fleetName: user.fleet?.name || null,
      fleetCode: user.fleet?.code || null,
      fleetStatus: user.fleet?.status || null,
      fleetExpiresAt: user.fleet?.expiresAt ? user.fleet.expiresAt.toISOString() : null,
      isPartnership: user.fleet?.isPartnership ?? false,
      partners: parsedPartners,
      features: parsedFeatures,
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
