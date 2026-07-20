require("dotenv").config();
const path = require("path");
const express = require("express");
const pool = require("./db/pool");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // gelen JSON'u oku

// Kök adres → ana sayfa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Sağlık kontrolü: sunucu + veritabanı ayakta mı?
app.get("/api/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT now() AS zaman");
    res.json({ durum: "ok", veritabani: "bağlı", zaman: r.rows[0].zaman });
  } catch (err) {
    res.status(500).json({ durum: "hata", mesaj: err.message });
  }
});


// Uzantısız URL'leri .html dosyalarına çöz (ör. /projeler → projeler.html)
app.get("/:sayfa", (req, res, next) => {
  if (req.params.sayfa.includes(".")) return next(); // dosya (css, png) ise dokunma
  res.sendFile(path.join(__dirname, "public", req.params.sayfa + ".html"), (err) => {
    if (err) next();
  });
});


// Statik site (birazdan buraya kendi dosyalarını koyacağız)
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
  console.log(`Test: http://localhost:${PORT}/api/health`);
});