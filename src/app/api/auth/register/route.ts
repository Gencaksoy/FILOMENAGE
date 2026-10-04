import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSessionCookie, DEFAULT_FEATURES } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { validatePassword, validateRealisticEmail } from '@/lib/validation';
import { verifyEmailDomainDns } from '@/lib/dns-check';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, fleetCode } = body;

    if (!name || !email || !password || !fleetCode) {
      return NextResponse.json(
        { error: 'Lütfen tüm alanları (Ad Soyad, E-posta, Şifre ve Filo Kodu) eksiksiz doldurunuz.' },
        { status: 400 }
      );
    }

    // Şifre karmaşıklık kontrolü: en az 6 karakter, büyük/küçük harf ve rakam
    const pwdValidation = validatePassword(password);
    if (!pwdValidation.isValid) {
      return NextResponse.json(
        { error: pwdValidation.errors.join(' ') },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = fleetCode.trim().toUpperCase();

    // Gerçekçi e-posta kontrolü (geçici sağlayıcılar ve sahte formatları engelle)
    const emailValidation = validateRealisticEmail(cleanEmail);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error || 'Lütfen geçerli ve gerçek bir e-posta adresi giriniz.' },
        { status: 400 }
      );
    }

    // DNS MX sunucu doğrulaması (alan adının gerçekte var olup olmadığını sına)
    const dnsValidation = await verifyEmailDomainDns(cleanEmail);
    if (!dnsValidation.valid) {
      return NextResponse.json(
        { error: dnsValidation.reason || 'Girilen e-posta alan adına ait geçerli bir posta sunucusu bulunamadı.' },
        { status: 400 }
      );
    }

    // 1. Filo Kodu Doğrulaması
    const fleet = await prisma.fleet.findFirst({
      where: {
        code: {
          equals: cleanCode,
          mode: 'insensitive',
        },
      },
    });

    if (!fleet) {
      return NextResponse.json(
        {
          error:
            `"${cleanCode}" koduna sahip bir filo bulunamadı! Filolar SaaS Yöneticisi tarafından oluşturulur. Lütfen geçerli filo kodunuzu kontrol ediniz veya sistem yöneticiniz ile iletişime geçiniz.`,
        },
        { status: 400 }
      );
    }

    // 2. Filo Durumu Kontrolü
    if (fleet.status !== 'ACTIVE') {
      const reason =
        fleet.status === 'SUSPENDED'
          ? 'Bu filo şu anda askıya alınmıştır.'
          : 'Bu filonun lisans süresi dolmuştur.';
      return NextResponse.json(
        { error: `${reason} Lütfen lisansınızı yenilemek için SaaS yöneticisi ile irtibata geçiniz.` },
        { status: 403 }
      );
    }

    // 3. E-posta Tekillik Kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi ile kayıtlı bir hesap zaten mevcuttur. Lütfen giriş yapınız.' },
        { status: 400 }
      );
    }

    // 4. Şifreyi Hashle ve Kullanıcıyı Kaydet
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: 'ADMIN', // Filo koduyla ilk yetkili kayıt ADMIN (Filo Yöneticisi) olarak açılır
        fleetId: fleet.id,
        isActive: true,
      },
    });

    // Filo özelliklerini çözümle
    let parsedPartners: string[] = [];
    if (fleet.partners) {
      try {
        parsedPartners = JSON.parse(fleet.partners);
      } catch {
        parsedPartners = [];
      }
    }

    let parsedFeatures: Record<string, boolean> = { ...DEFAULT_FEATURES };
    if (fleet.features) {
      try {
        parsedFeatures = { ...DEFAULT_FEATURES, ...JSON.parse(fleet.features) };
      } catch {}
    }

    const authUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      fleetId: fleet.id,
      fleetName: fleet.name,
      fleetCode: fleet.code,
      fleetStatus: fleet.status,
      fleetExpiresAt: fleet.expiresAt ? fleet.expiresAt.toISOString() : null,
      isPartnership: fleet.isPartnership,
      partners: parsedPartners,
      features: parsedFeatures,
    };

    const cookieValue = await createSessionCookie(authUser);

    cookies().set('filo_auth_session', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 gün
    });

    await logAudit({
      userId: newUser.id,
      userName: newUser.name,
      action: 'REGISTER_WITH_FLEET_CODE',
      entityType: 'USER',
      entityId: newUser.id,
      description: `${newUser.name} (${newUser.email}), "${fleet.name}" (${fleet.code}) filosuna Filo Kodu ile kaydoldu ve oturum açtı.`,
    });

    return NextResponse.json({
      success: true,
      message: `"${fleet.name}" filosu için hesabınız başarıyla oluşturuldu!`,
      user: authUser,
      redirectTo: '/',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Kayıt işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.' },
      { status: 500 }
    );
  }
}
