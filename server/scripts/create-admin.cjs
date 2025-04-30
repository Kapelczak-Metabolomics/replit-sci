/**
 * Create Admin User Script for Kapelczak Notes (CommonJS version)
 * This script creates an admin user if one doesn't exist.
 * Used during deployment to ensure an admin user is available.
 */

const { Pool } = require('pg');
const crypto = require('crypto');

// Get database connection string from environment variables
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Error: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

console.log('🔄 Checking for existing admin user...');

// Create a PostgreSQL client
const pool = new Pool({ connectionString });

// Simple password hashing function for the admin user
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createAdminUser() {
  let client;
  
  try {
    client = await pool.connect();
    
    // Check if admin user already exists
    const checkResult = await client.query("SELECT id FROM users WHERE username = 'admin'");
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Admin user already exists. No action needed.');
      return;
    }
    
    console.log('⏳ Creating admin user...');
    
    // Hash the password for the admin user
    const hashedPassword = hashPassword('demo');
    
    // Create admin user with default credentials
    const createResult = await client.query(`
      INSERT INTO users (
        username, 
        email, 
        password, 
        displayName, 
        role, 
        isAdmin, 
        isVerified
      ) VALUES (
        'admin', 
        'admin@kapelczak.com', 
        $1, 
        'Admin User', 
        'Administrator', 
        true, 
        true
      ) RETURNING id
    `, [hashedPassword]);
    
    if (createResult.rows.length > 0) {
      console.log(`✅ Admin user created successfully with ID: ${createResult.rows[0].id}`);
      console.log('⚠️ Default credentials:');
      console.log('   Username: admin');
      console.log('   Password: demo');
      console.log('⚠️ IMPORTANT: Change the default password immediately after first login!');
    } else {
      console.error('❌ Failed to create admin user.');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the function
createAdminUser();