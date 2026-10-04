const { Client } = require('pg');

async function testConnection(url) {
  console.log('Testing:', url.replace(/:[^:@]+@/, ':****@'));
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as val');
    console.log('SUCCESS:', res.rows);
    await client.end();
    return true;
  } catch (err) {
    console.log('FAIL:', err.message);
    try { await client.end(); } catch (_) {}
    return false;
  }
}

async function main() {
  await testConnection("postgresql://postgres.nmtkssmixyxippbevemc:Akobaba1453%21@aws-0-eu-north-1.pooler.supabase.com:5432/postgres");
  await testConnection("postgresql://postgres:Akobaba1453%21@db.nmtkssmixyxippbevemc.supabase.co:5432/postgres");
}

main();
