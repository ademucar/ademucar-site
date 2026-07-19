-- Örnek tablo: kurulumun çalıştığını görmek için.
-- İleride kendi tablolarını (mesaj, soru vb.) buraya ekleyeceksin.
CREATE TABLE IF NOT EXISTS notlar (
    id      SERIAL PRIMARY KEY,
    baslik  TEXT        NOT NULL,
    icerik  TEXT        NOT NULL DEFAULT '',
    tarih   TIMESTAMPTZ NOT NULL DEFAULT now()
);