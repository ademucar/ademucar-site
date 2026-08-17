require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pool = require("./db/pool");

const app = express();
const PORT = process.env.PORT || 3000;

// Sunucunun ne olduğunu dışarıya söyleme (saldırgana ipucu vermez)
app.disable("x-powered-by");

// Cloudflare/Render arkasındayız: ziyaretçinin gerçek IP'si için gerekli.
// Rate limit'in doğru çalışması buna bağlı.
app.set("trust proxy", 1);

// Güvenlik başlıkları (clickjacking, MIME sniffing, referrer sızıntısı vb.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Sayfa içi <style> blokları ve style="" nitelikleri kullanılıyor
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      // Oyunlarda sayfa içi <script> blokları var
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      // HTML'deki onclick="..." gibi satır içi olay işleyicileri için şart.
      // (helmet varsayılanı 'none' olduğundan oyun butonları çalışmazdı)
      scriptSrcAttr: ["'unsafe-inline'"],
      // flagcdn: Neon Flagle'ın bayrak görselleri
      imgSrc: ["'self'", "data:", "blob:", "https://flagcdn.com"],
      // Sözlük artık kendi sunucumuzda (public/words.txt) → dış bağlantıya gerek yok
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],   // Siteyi kimse iframe'e gömemez
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  },
  // Farklı kaynaktan gelen görsel/font yüklenebilsin diye gevşetiliyor
  crossOriginEmbedderPolicy: false
}));

// Hız sınırı: tek IP'den aşırı istekle sunucuyu/veritabanını yormayı engeller
app.use("/api", rateLimit({
  windowMs: 60 * 1000,       // 1 dakika
  max: 60,                   // dakikada en fazla 60 istek
  standardHeaders: true,
  legacyHeaders: false,
  message: { durum: "hata", mesaj: "Çok fazla istek gönderildi. Lütfen biraz bekleyin." }
}));

app.use(express.json({ limit: "10kb" })); // gelen JSON'u oku (boyut sınırlı)

// Kök adres → ana sayfa
app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Sağlık kontrolü: sunucu + veritabanı ayakta mı?
app.get("/api/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT now() AS zaman");
    res.json({ durum: "ok", veritabani: "bağlı", zaman: r.rows[0].zaman });
  } catch (err) {
    // Hatanın detayı sadece sunucu günlüğüne yazılır.
    // Dışarıya verilirse veritabanı adresi/tablo isimleri sızabilir.
    console.error("Sağlık kontrolü hatası:", err.message);
    res.status(500).json({ durum: "hata", mesaj: "Servis şu anda kullanılamıyor." });
  }
});


// Uzantısız URL'leri .html dosyalarına çöz (ör. /projeler → projeler.html)
app.get("/:sayfa", (req, res, next) => {
  const sayfa = req.params.sayfa;

  // Sadece harf, rakam, tire, alt çizgi kabul et. Nokta/eğik çizgi/ters eğik
  // çizgi içeren hiçbir şey geçemez → dizin dışına çıkma (../) denemeleri engellenir.
  if (!/^[\p{L}\p{N}_-]+$/u.test(sayfa)) return next();

  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(__dirname, "public", sayfa + ".html"), (err) => {
    if (err) next();
  });
});


// Statik site
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      // HTML her zaman taze gelsin: yoksa güncellenen css/js referansları
      // tarayıcıya hiç ulaşmaz ve değişiklikler görünmez.
      res.setHeader("Cache-Control", "no-cache");
    } else {
      // css/js/görseller sürüm etiketiyle (?v=) yenilendiği için uzun süre saklanabilir
      res.setHeader("Cache-Control", "public, max-age=604800");
    }
  }
}));

// Beklenmeyen hatalarda yığın izi (stack trace) dışarı sızmasın
app.use((err, req, res, next) => {
  console.error("Sunucu hatası:", err.stack || err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ durum: "hata", mesaj: "Beklenmeyen bir hata oluştu." });
});

app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
  console.log(`Test: http://localhost:${PORT}/api/health`);
});