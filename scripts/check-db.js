const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const archives = await prisma.archivedRecord.findMany();
  console.log('Archived records:', archives);
}

main().catch(console.error).finally(() => prisma.$disconnect());
