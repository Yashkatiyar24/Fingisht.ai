import { pool } from '../lib/db';

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('Current database time:', result.rows[0].now);
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
}

testConnection();
