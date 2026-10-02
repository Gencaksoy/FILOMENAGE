import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Dosya seçilmedi.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalExt = path.extname(file.name) || '.jpg';
    const safeBaseName = path.basename(file.name, originalExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeBaseName}_${uniqueSuffix}${originalExt}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      fileName,
      fileUrl,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Dosya yüklenemedi.' }, { status: 500 });
  }
}
