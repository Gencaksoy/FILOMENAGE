import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const shops = await prisma.serviceShop.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(shops);
  } catch (error) {
    console.error('ServiceShops GET error:', error);
    return NextResponse.json({ error: 'Servisler alınamadı.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ error: 'Servis adı zorunludur.' }, { status: 400 });
    }

    const existing = await prisma.serviceShop.findUnique({
      where: { name },
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    const shop = await prisma.serviceShop.create({
      data: {
        name,
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });

    await logAudit({
      userName: 'Yönetici',
      action: 'CREATE_SERVICE_SHOP',
      target: shop.name,
      description: `Yeni anlaşmalı servis eklendi: ${shop.name}`,
    });

    return NextResponse.json(shop, { status: 201 });
  } catch (error: any) {
    console.error('ServiceShops POST error:', error);
    return NextResponse.json({ error: error.message || 'Servis eklenemedi.' }, { status: 500 });
  }
}
