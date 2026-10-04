import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { TargetModuleType, cleanPlate } from '@/lib/excel-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const body = await req.json();
    const targetModule: TargetModuleType = body.targetModule || 'VEHICLES';
    const items: any[] = body.items || body.vehicles || [];
    const updateExisting: boolean = !!body.updateExisting;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'İçe aktarılacak geçerli veri bulunamadı.' }, { status: 400 });
    }

    const fleetId = currentUser.role === 'SUPER_ADMIN' ? (currentUser.fleetId || null) : currentUser.fleetId;

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let createdCustomersCount = 0;
    const errors: string[] = [];

    // 1. VEHICLES IMPORT
    if (targetModule === 'VEHICLES') {
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      for (const item of items) {
        const plate = cleanPlate(item.plate);
        if (!plate) {
          skippedCount++;
          continue;
        }

        try {
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

          if (item.status === 'RENTED' && item.customerName?.trim() && vehicleId) {
            const custName = item.customerName.trim();
            const custPhone = item.customerPhone?.trim() || '+381 60 0000000';

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
    }

    // 2. CUSTOMERS IMPORT
    else if (targetModule === 'CUSTOMERS') {
      for (const item of items) {
        const name = String(item.name || '').trim();
        const phone = String(item.phone || '').trim();
        if (!name) {
          skippedCount++;
          continue;
        }

        try {
          const existing = await prisma.customer.findFirst({
            where: {
              name: { equals: name, mode: 'insensitive' },
              isDeleted: false,
              ...(fleetId ? { fleetId } : {}),
            },
          });

          if (existing) {
            if (updateExisting) {
              await prisma.customer.update({
                where: { id: existing.id },
                data: {
                  phone: phone || existing.phone,
                  identityNo: item.identityNo || existing.identityNo,
                  email: item.email || existing.email,
                  address: item.address || existing.address,
                  notes: item.notes || existing.notes,
                },
              });
              updatedCount++;
            } else {
              skippedCount++;
            }
          } else {
            await prisma.customer.create({
              data: {
                name,
                phone: phone || '+381 60 0000000',
                identityNo: item.identityNo || null,
                email: item.email || null,
                address: item.address || null,
                notes: item.notes || null,
                fleetId,
              },
            });
            createdCount++;
          }
        } catch (err: any) {
          errors.push(`${name}: ${err?.message || 'Hata'}`);
        }
      }
    }

    // 3. MAINTENANCE IMPORT
    else if (targetModule === 'MAINTENANCE') {
      for (const item of items) {
        const plate = cleanPlate(item.plate);
        if (!plate) {
          skippedCount++;
          continue;
        }

        try {
          let vehicle = await prisma.vehicle.findFirst({
            where: { plate, isDeleted: false, ...(fleetId ? { fleetId } : {}) },
          });

          if (!vehicle) {
            vehicle = await prisma.vehicle.create({
              data: {
                plate,
                brand: 'Bilinmiyor',
                model: 'Model',
                modelYear: 2020,
                color: 'Beyaz',
                fuelType: 'Dizel',
                fleetId,
              },
            });
          }

          const mDate = item.maintenanceDate ? new Date(item.maintenanceDate) : new Date();

          await prisma.maintenanceRecord.create({
            data: {
              vehicleId: vehicle.id,
              maintenanceDate: isNaN(mDate.getTime()) ? new Date() : mDate,
              serviceName: item.serviceName || 'Özel Servis',
              description: item.description || 'Periyodik Bakım ve Onarım',
              laborCost: item.laborCost || 0,
              partsCost: item.partsCost || 0,
              totalCost: item.totalCost || (item.laborCost || 0) + (item.partsCost || 0) || 50,
              currency: item.currency || 'EUR',
              paidBy: item.paidBy || null,
              notes: item.notes || null,
            },
          });
          createdCount++;
        } catch (err: any) {
          errors.push(`${plate}: ${err?.message || 'Hata'}`);
        }
      }
    }

    // 4. OIL CHANGE IMPORT
    else if (targetModule === 'OIL_CHANGE') {
      for (const item of items) {
        const plate = cleanPlate(item.plate);
        if (!plate) {
          skippedCount++;
          continue;
        }

        try {
          let vehicle = await prisma.vehicle.findFirst({
            where: { plate, isDeleted: false, ...(fleetId ? { fleetId } : {}) },
          });

          if (!vehicle) {
            vehicle = await prisma.vehicle.create({
              data: {
                plate,
                brand: 'Bilinmiyor',
                model: 'Model',
                modelYear: 2020,
                color: 'Beyaz',
                fuelType: 'Dizel',
                fleetId,
              },
            });
          }

          const cDate = item.changeDate ? new Date(item.changeDate) : new Date();

          await prisma.oilChangeRecord.create({
            data: {
              vehicleId: vehicle.id,
              changeDate: isNaN(cDate.getTime()) ? new Date() : cDate,
              km: item.km || vehicle.currentKm || 0,
              oilType: item.oilType || '5W-30',
              filterChanged: item.filterChanged ?? true,
              cost: item.cost || 60,
              currency: item.currency || 'EUR',
              serviceName: item.serviceName || null,
              paidBy: item.paidBy || null,
              notes: item.notes || null,
            },
          });
          createdCount++;
        } catch (err: any) {
          errors.push(`${plate}: ${err?.message || 'Hata'}`);
        }
      }
    }

    // 5. INSPECTION IMPORT
    else if (targetModule === 'INSPECTION') {
      for (const item of items) {
        const plate = cleanPlate(item.plate);
        if (!plate) {
          skippedCount++;
          continue;
        }

        try {
          let vehicle = await prisma.vehicle.findFirst({
            where: { plate, isDeleted: false, ...(fleetId ? { fleetId } : {}) },
          });

          if (!vehicle) {
            vehicle = await prisma.vehicle.create({
              data: {
                plate,
                brand: 'Bilinmiyor',
                model: 'Model',
                modelYear: 2020,
                color: 'Beyaz',
                fuelType: 'Dizel',
                fleetId,
              },
            });
          }

          const insDate = item.inspectionDate ? new Date(item.inspectionDate) : new Date();
          const nextDate = item.nextInspectionDate ? new Date(item.nextInspectionDate) : new Date(Date.now() + 365 * 24 * 3600 * 1000);

          await prisma.inspectionRecord.create({
            data: {
              vehicleId: vehicle.id,
              inspectionDate: isNaN(insDate.getTime()) ? new Date() : insDate,
              nextInspectionDate: isNaN(nextDate.getTime()) ? new Date() : nextDate,
              cost: item.cost || 120,
              currency: item.currency || 'EUR',
              station: item.station || 'Auto Centar Beograd',
              paidBy: item.paidBy || null,
              notes: item.notes || null,
            },
          });

          // Aracın muayene/tescil bitişini güncelle
          if (!isNaN(nextDate.getTime())) {
            await prisma.vehicle.update({
              where: { id: vehicle.id },
              data: { registrationExpiry: nextDate },
            });
          }

          createdCount++;
        } catch (err: any) {
          errors.push(`${plate}: ${err?.message || 'Hata'}`);
        }
      }
    }

    // 6. PARKING TICKETS IMPORT
    else if (targetModule === 'PARKING_TICKETS') {
      for (const item of items) {
        const plate = cleanPlate(item.plate);
        if (!plate) {
          skippedCount++;
          continue;
        }

        try {
          let vehicle = await prisma.vehicle.findFirst({
            where: { plate, isDeleted: false, ...(fleetId ? { fleetId } : {}) },
          });

          if (!vehicle) {
            vehicle = await prisma.vehicle.create({
              data: {
                plate,
                brand: 'Bilinmiyor',
                model: 'Model',
                modelYear: 2020,
                color: 'Beyaz',
                fuelType: 'Dizel',
                fleetId,
              },
            });
          }

          const cleanPlt = plate.replace(/[^A-Z0-9]/g, '');
          const issDate = item.issueDate ? new Date(item.issueDate) : new Date();

          await prisma.parkingTicket.create({
            data: {
              ticketNumber: item.ticketNumber || `EDPK-${Math.floor(100000 + Math.random() * 900000)}`,
              vehicleId: vehicle.id,
              plate,
              cleanPlate: cleanPlt,
              zone: item.zone || 'Zona 2',
              street: item.street || null,
              violation: item.violation || 'Isteklo vreme parkiranja',
              amountRsd: item.amountRsd || 1870,
              amountEur: item.amountEur || Math.round((item.amountRsd || 1870) / 117),
              status: item.status || 'UNPAID',
              issueDate: isNaN(issDate.getTime()) ? new Date() : issDate,
              fleetId,
            },
          });
          createdCount++;
        } catch (err: any) {
          errors.push(`${plate}: ${err?.message || 'Hata'}`);
        }
      }
    }

    // Audit log
    await logAudit({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: `IMPORT_${targetModule}_AI`,
      target: `${createdCount} Kayıt (${targetModule})`,
      description: `Universal AI Excel aktarımı tamamlandı (${targetModule}): ${createdCount} kayıt eklendi, ${updatedCount} güncellendi, ${skippedCount} atlandı.`,
    });

    return NextResponse.json({
      success: true,
      message: `${createdCount} kayıt başarıyla ilgili modüle aktarıldı.`,
      targetModule,
      createdCount,
      updatedCount,
      skippedCount,
      createdCustomersCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Universal import confirm error:', error);
    return NextResponse.json(
      { error: error?.message || 'Kayıtlar işlenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
