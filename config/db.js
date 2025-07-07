// config/db.js
const mysql = require('mysql2');

// Debug config (tanpa password)
console.log('📦 DB Config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

// Buat koneksi
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Tes koneksi
connection.connect((err) => {
  if (err) {
    console.error('❌ Gagal koneksi ke MySQL:', err.message);
    return;
  }
  console.log('✅ Terhubung ke MySQL');
});

module.exports = connection;
