import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { ParsedVehicleRow } from '@/lib/excel-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const body = await req.json();
    const { vehicles, updateExisting = false } = body as {
      vehicles: ParsedVehicleRow[];
      updateExisting?: boolean;
    };

    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return NextResponse.json({ error: 'İçe aktarılacak geçerli araç verisi bulunamadı.' }, { status: 400 });
    }

    const fleetId = currentUser.role === 'SUPER_ADMIN' ? (currentUser.fleetId || null) : currentUser.fleetId;

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let createdCustomersCount = 0;
    const errors: string[] = [];

    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    for (const item of vehicles) {
      const plate = String(item.plate || '').trim().toUpperCase();
      if (!plate) {
        skippedCount++;
        continue;
      }

      try {
        // Filoda mevcut araç var mı?
        const existingVehicle = await prisma.vehicle.findFirst({
          where: {
            plate,
            isDeleted: false,
            ...(fleetId ? { fleetId } : {}),
          },
        });

        let vehicleId = existingVehicle?.id;

        if (existingVehicle) {
          if (updateExisting) {
            await prisma.vehicle.update({
              where: { id: existingVehicle.id },
              data: {
                brand: item.brand || existingVehicle.brand,
                model: item.model || existingVehicle.model,
                modelYear: item.modelYear || existingVehicle.modelYear,
                color: item.color || existingVehicle.color,
                currentKm: item.currentKm || existingVehicle.currentKm,
                fuelType: item.fuelType || existingVehicle.fuelType,
                owner: item.owner || existingVehicle.owner,
                monthlyPrice: item.monthlyPrice || existingVehicle.monthlyPrice,
                dailyPrice: item.dailyPrice || existingVehicle.dailyPrice,
                status: item.status || existingVehicle.status,
                notes: item.notes || existingVehicle.notes,
              },
            });
            updatedCount++;
          } else {
            skippedCount++;
            continue;
          }
        } else {
          // Yeni araç oluştur
          const newVeh = await prisma.vehicle.create({
            data: {
              plate,
              brand: item.brand || 'Bilinmiyor',
              model: item.model || 'Model',
              modelYear: item.modelYear || 2020,
              color: item.color || 'Beyaz',
              currentKm: item.currentKm || 0,
              fuelType: item.fuelType || 'Dizel',
              owner: item.owner || currentUser.fleetName || 'Şirket',
              purchasePrice: item.purchasePrice || 0,
              initialExpenses: 0,
              monthlyPrice: item.monthlyPrice || 350,
              dailyPrice: item.dailyPrice || 25,
              registrationExpiry: oneYearLater,
              status: item.status || 'AVAILABLE',
              notes: item.notes || null,
              fleetId,
            },
          });
          vehicleId = newVeh.id;
          createdCount++;
        }

        // Eğer araç Kirada ise ve müşteri bilgisi varsa müşteriyi ve kiralamayı bağla
        if (item.status === 'RENTED' && item.customerName?.trim() && vehicleId) {
          const custName = item.customerName.trim();
          const custPhone = item.customerPhone?.trim() || '+381 60 0000000';

          // Müşteri var mı kontrol et
          let customer = await prisma.customer.findFirst({
            where: {
              name: { equals: custName, mode: 'insensitive' },
              isDeleted: false,
              ...(fleetId ? { fleetId } : {}),
            },
          });

          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                name: custName,
                phone: custPhone,
                fleetId,
              },
            });
            createdCustomersCount++;
          }

          // Bu araca ait aktif kiralama var mı?
          const existingActiveRental = await prisma.rental.findFirst({
            where: {
              vehicleId,
              status: 'ACTIVE',
            },
          });

          if (!existingActiveRental) {
            const startDate = item.rentalStartDate ? new Date(item.rentalStartDate) : new Date();
            const endDate = item.rentalEndDate
              ? new Date(item.rentalEndDate)
              : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

            await prisma.rental.create({
              data: {
                vehicleId,
                customerId: customer.id,
                startDate,
                endDate,
                monthlyRate: item.monthlyPrice || 350,
                dailyRate: item.dailyPrice || 25,
                totalAmount: item.monthlyPrice || 350,
                status: 'ACTIVE',
                isPaid: true,
              },
            });
          }
        }
      } catch (err: any) {
        console.error(`Error importing vehicle ${plate}:`, err);
        errors.push(`${plate}: ${err?.message || 'Hata'}`);
      }
    }

    // Denetim günlüğü
    await logAudit({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'IMPORT_VEHICLES_EXCEL_AI',
      target: `${createdCount} Araç, ${createdCustomersCount} Müşteri`,
      description: `Yapay zeka Excel aktarımı tamamlandı: ${createdCount} araç eklendi, ${updatedCount} güncellendi, ${skippedCount} atlandı, ${createdCustomersCount} yeni müşteri oluşturuldu.`,
    });

    return NextResponse.json({
      success: true,
      message: `${createdCount} araç ve ${createdCustomersCount} müşteri başarıyla sisteme aktarıldı.`,
      createdCount,
      updatedCount,
      skippedCount,
      createdCustomersCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Excel confirm import error:', error);
    return NextResponse.json(
      { error: error?.message || 'Araçlar kaydedilirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
