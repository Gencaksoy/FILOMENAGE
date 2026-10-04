import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { parseAndAnalyzeExcel } from '@/lib/excel-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Lütfen bir Excel (.xlsx, .xls) veya CSV dosyası yükleyin.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await parseAndAnalyzeExcel(buffer);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      ...result,
    });
  } catch (error: any) {
    console.error('Excel AI analyze error:', error);
    return NextResponse.json(
      { error: error?.message || 'Excel dosyası analiz edilirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
