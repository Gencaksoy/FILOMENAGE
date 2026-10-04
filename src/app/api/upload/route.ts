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

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalExt = path.extname(file.name) || '.jpg';
    const safeBaseName = path.basename(file.name, originalExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeBaseName}_${uniqueSuffix}${originalExt}`;
    const contentType = file.type || 'image/jpeg';

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

    // 1. Supabase Cloud Storage'a Kalıcı Yükleme (Vercel & Canlı Ortam İçin)
    if (supabaseUrl && supabaseSecret) {
      try {
        const uploadEndpoint = `${supabaseUrl}/storage/v1/object/fleet-uploads/${fileName}`;
        const uploadRes = await fetch(uploadEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseSecret}`,
            'apikey': supabaseSecret,
            'Content-Type': contentType,
            'x-upsert': 'true',
          },
          body: buffer,
        });

        if (uploadRes.ok) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/fleet-uploads/${fileName}`;
          return NextResponse.json({
            success: true,
            fileName,
            fileUrl: publicUrl,
            url: publicUrl,
          });
        } else {
          console.warn('Supabase storage upload failed with status:', uploadRes.status, await uploadRes.text());
        }
      } catch (cloudErr) {
        console.warn('Supabase upload exception:', cloudErr);
      }
    }

    // 2. Yerel Ortam (Fallback)
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const localUrl = `/uploads/${fileName}`;
      return NextResponse.json({
        success: true,
        fileName,
        fileUrl: localUrl,
        url: localUrl,
      });
    } catch (localErr: any) {
      console.warn('Local fs write failed (likely serverless readonly), falling back to data URL:', localErr?.message);
      // Vercel serverless ortamında ve Supabase erişilemezse data URL fallback (küçük/sıkıştırılmış dosyalar için)
      if (buffer.length <= 2 * 1024 * 1024) {
        const base64Data = `data:${contentType};base64,${buffer.toString('base64')}`;
        return NextResponse.json({
          success: true,
          fileName,
          fileUrl: base64Data,
          url: base64Data,
        });
      }
      return NextResponse.json({ error: 'Dosya kaydedilemedi. Lütfen daha küçük bir dosya seçiniz.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Dosya yüklenemedi.' }, { status: 500 });
  }
}
