// Simple database connection test
const { Client } = require('pg');

const connectionString = 'postgresql://vevurn_user:5Tujt460zh0OQSRQFlhifyiSuepcFNWA@dpg-d2ese8uuk2gs73bq42ng-a.oregon-postgres.render.com/vevurn';

async function testConnection() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Attempting to connect to PostgreSQL database...');
    await client.connect();
    console.log('✅ Database connection successful!');
    
    console.log('🔍 Testing query...');
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📊 Query result:', result.rows[0]);
    
    await client.end();
    console.log('🔚 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

testConnection();
