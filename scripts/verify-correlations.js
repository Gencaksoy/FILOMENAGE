const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFYING DATABASE CORRELATIONS ===\n');

  // 1. Check vehicles
  const vehicles = await prisma.vehicle.findMany({
    include: {
      rentals: {
        include: {
          customer: true,
          documents: true,
        },
      },
    },
  });

  console.log(`Total Vehicles: ${vehicles.length}`);
  for (const v of vehicles) {
    console.log(`- Vehicle [${v.plate}] ID=${v.id} Status=${v.status} Model=${v.brand} ${v.model}`);
    const activeRentals = v.rentals.filter((r) => r.status === 'ACTIVE');
    console.log(`  Total Rentals: ${v.rentals.length}, Active Rentals: ${activeRentals.length}`);
    for (const r of activeRentals) {
      console.log(`    * Active Rental ID=${r.id}, Customer=${r.customer?.name} (${r.customer?.phone}), Contract=${r.contractUrl || 'none'}`);
    }

    // Inconsistency check: Vehicle AVAILABLE but has ACTIVE rental
    if (v.status === 'AVAILABLE' && activeRentals.length > 0) {
      console.log(`  ⚠️ INCONSISTENCY FOUND: Vehicle is AVAILABLE but has ${activeRentals.length} ACTIVE rental(s)! Auto-closing...`);
      for (const r of activeRentals) {
        await prisma.rental.update({
          where: { id: r.id },
          data: { status: 'RETURNED' },
        });
        console.log(`    -> Closed rental ${r.id} to RETURNED.`);
      }
    }
  }

  // 2. Check customers and documents
  const customers = await prisma.customer.findMany({
    include: {
      documents: true,
      rentals: true,
    },
  });
  console.log(`\nTotal Customers: ${customers.length}`);
  for (const c of customers) {
    console.log(`- Customer: ${c.name} (${c.phone}), Rentals: ${c.rentals.length}, Documents: ${c.documents.length}`);
    for (const d of c.documents) {
      console.log(`    * Document [${d.docType}] "${d.title}" rentalId=${d.rentalId || 'none'} URL=${d.fileUrl?.slice(0, 40)}...`);
    }
  }

  // 3. Check for any CustomerDocuments with rentalId that don't match
  const allDocs = await prisma.customerDocument.findMany({
    include: {
      rental: true,
      customer: true,
    },
  });
  console.log(`\nTotal Customer Documents: ${allDocs.length}`);
  for (const doc of allDocs) {
    if (doc.rentalId && !doc.rental) {
      console.log(`  ⚠️ Orphaned doc rentalId: ${doc.id}`);
    }
  }

  console.log('\n=== CORRELATION CHECK COMPLETE ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
