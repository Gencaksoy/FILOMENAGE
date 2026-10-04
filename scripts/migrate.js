const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Running database schema updates...');

  // 1. Add contractUrl and contractTitle to Rental
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Rental" ADD COLUMN IF NOT EXISTS "contractUrl" TEXT;
  `);
  console.log('Added contractUrl to Rental');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Rental" ADD COLUMN IF NOT EXISTS "contractTitle" TEXT;
  `);
  console.log('Added contractTitle to Rental');

  // 2. Add rentalId to CustomerDocument
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CustomerDocument" ADD COLUMN IF NOT EXISTS "rentalId" TEXT;
  `);
  console.log('Added rentalId to CustomerDocument');

  // Add foreign key constraint if not exists
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CustomerDocument_rentalId_fkey'
      ) THEN
        ALTER TABLE "CustomerDocument" 
        ADD CONSTRAINT "CustomerDocument_rentalId_fkey" 
        FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL;
      END IF;
    END $$;
  `);
  console.log('Added foreign key CustomerDocument -> Rental');

  // Add indexes
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CustomerDocument_customerId_idx" ON "CustomerDocument"("customerId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CustomerDocument_rentalId_idx" ON "CustomerDocument"("rentalId");
  `);
  console.log('Created indexes on CustomerDocument');

  // 3. Add foreign key ParkingTicket -> Fleet if not exists
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ParkingTicket_fleetId_fkey'
      ) THEN
        ALTER TABLE "ParkingTicket" 
        ADD CONSTRAINT "ParkingTicket_fleetId_fkey" 
        FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE CASCADE;
      END IF;
    END $$;
  `);
  console.log('Added foreign key ParkingTicket -> Fleet');

  console.log('ALL SCHEMA UPDATES COMPLETED SUCCESSFULLY!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
