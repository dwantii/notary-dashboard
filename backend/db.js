const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'notary_user',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_NAME || 'notary_db',
      waitForConnections: true,
      connectionLimit: 10
    });
  }
  return pool;
}

module.exports = { getPool };
