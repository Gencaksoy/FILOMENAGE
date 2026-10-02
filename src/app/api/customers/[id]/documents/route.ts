import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { docType, title, fileUrl } = body;

    if (!docType || !fileUrl) {
      return NextResponse.json(
        { error: 'Belge türü ve dosya yolu zorunludur.' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
    }

    const doc = await prisma.customerDocument.create({
      data: {
        customerId: params.id,
        docType: docType || 'OTHER',
        title: title || 'Müşteri Belgesi',
        fileUrl,
      },
    });

    await logAudit({
      userName: 'Yönetici',
      action: 'ADD_CUSTOMER_DOCUMENT',
      target: customer.name,
      description: `${customer.name} müşterisine yeni belge eklendi (${doc.title} - ${doc.docType}).`,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    console.error('Customer document POST error:', error);
    return NextResponse.json({ error: error.message || 'Belge eklenemedi.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Belge ID zorunludur.' }, { status: 400 });
    }

    await prisma.customerDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Customer document DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Belge silinemedi.' }, { status: 500 });
  }
}
