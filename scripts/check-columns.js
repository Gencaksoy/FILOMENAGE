const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rentalCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Rental'
    ORDER BY ordinal_position;
  `);
  console.log('Rental columns:', rentalCols);

  const docCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'CustomerDocument'
    ORDER BY ordinal_position;
  `);
  console.log('CustomerDocument columns:', docCols);
}

main().catch(console.error).finally(() => prisma.$disconnect());
