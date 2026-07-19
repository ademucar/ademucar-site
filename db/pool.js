// PostgreSQL bağlantı havuzu — tüm veritabanı işleri buradan geçer.
const { Pool } = require("pg");

// Bulut Postgres (Render/Neon vb.) SSL ister; yerel bilgisayarda gerekmez.
const uzak = /render\.com|neon\.tech|supabase|railway|amazonaws/.test(
  process.env.DATABASE_URL || ""
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: uzak ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => console.error("Veritabanı hatası:", err.message));

module.exports = pool;